import { Injectable } from '@nestjs/common';
import { SecurityEventsService } from '@oxinov/server-kit';
import { DatabaseContext, type Tx } from '../database/database-context.service';
import { Errors } from '../errors';
import { WelcomeEmailService } from '../mail/welcome-email.service';
import type { AccountUser, PolicyRef } from './account.types';
import type { AcceptPoliciesDto, WelcomeDto } from './accounts.dto';
import { outstandingPolicies, policyKey, type CurrentPolicy } from './policies';

export interface AccountView {
  id: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  country: string | null;
  status: string;
  trustLevel: string;
  welcomeRequired: boolean;
  outstandingPolicies: { policyId: string; version: number; title: string; url: string }[];
}

export interface EntitlementView {
  productKey: string;
  entitlementKey: string;
  source: string;
  startsAt: Date;
  endsAt: Date | null;
}

@Injectable()
export class AccountsService {
  constructor(
    private readonly db: DatabaseContext,
    private readonly securityEvents: SecurityEventsService,
    private readonly welcomeEmail: WelcomeEmailService,
  ) {}

  me(user: AccountUser): Promise<AccountView> {
    return this.db.run({ userId: user.userId }, (tx) => this.view(tx, user.userId));
  }

  /**
   * FR-ID-2205: records the profile answers and acceptance of every current sign-up policy, then
   * activates the account and grants member access to launched products (FR-PLAN-2602), then sends the
   * welcome email once (FR-NOTIF-2903). Repeating the call on an active account changes and sends nothing.
   */
  async welcome(user: AccountUser, input: WelcomeDto): Promise<AccountView> {
    if (user.status === 'SUSPENDED') throw Errors.accountSuspended();
    if (!user.emailVerified) throw Errors.emailNotVerified();

    const { view, welcomed } = await this.db.run({ userId: user.userId }, async (tx) => {
      const account = await tx.userAccount.findUniqueOrThrow({ where: { id: user.userId } });
      if (account.status !== 'PENDING_WELCOME') return { view: await this.view(tx, user.userId), welcomed: false };

      const outstanding = await outstandingPolicies(tx, user.userId);
      this.assertCovers(outstanding, input.accepted);
      await this.recordAcceptances(tx, user.userId, outstanding, input);

      // Only the request that moves the row out of PENDING_WELCOME counts as the welcome. A concurrent retry
      // waits on the row lock, then matches nothing, so it grants nothing and sends no second email.
      const now = new Date();
      const moved = await tx.userAccount.updateMany({
        where: { id: user.userId, status: 'PENDING_WELCOME' },
        data: {
          displayName: input.displayName ?? account.displayName,
          country: input.country,
          ageConfirmedAt: now,
          welcomedAt: now,
          status: 'ACTIVE',
        },
      });
      if (moved.count !== 1) return { view: await this.view(tx, user.userId), welcomed: false };

      await this.grantMemberAccess(tx, user.userId);
      await tx.auditEvent.create({
        data: { actorUserId: user.userId, action: 'account.welcomed', targetType: 'user_account', targetId: user.userId },
      });
      return { view: await this.view(tx, user.userId), welcomed: true };
    });

    // FR-NOTIF-2903: one welcome email, only after the transaction committed; a failed send never fails the welcome.
    if (welcomed) {
      await this.welcomeEmail.send({ userId: view.id, email: view.emailVerified ? view.email : null, displayName: view.displayName });
    }
    return view;
  }

  /** FR-POLICY-2404: accept new material versions before the next protected action. */
  async acceptPolicies(user: AccountUser, input: AcceptPoliciesDto): Promise<AccountView> {
    if (user.status === 'SUSPENDED') throw Errors.accountSuspended();
    return this.db.run({ userId: user.userId }, async (tx) => {
      const outstanding = await outstandingPolicies(tx, user.userId);
      this.assertCovers(outstanding, input.accepted);
      await this.recordAcceptances(tx, user.userId, outstanding, input);
      return this.view(tx, user.userId);
    });
  }

  /** FR-PLAN-2603: the person's active entitlement keys; newly launched products are added first. */
  entitlements(user: AccountUser): Promise<EntitlementView[]> {
    return this.db.run({ userId: user.userId }, async (tx) => {
      await this.grantMemberAccess(tx, user.userId);
      const now = new Date();
      const rows = await tx.entitlement.findMany({
        where: { userId: user.userId, revokedAt: null, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        orderBy: [{ productKey: 'asc' }, { entitlementKey: 'asc' }],
      });
      return rows.map((row) => ({
        productKey: row.productKey,
        entitlementKey: row.entitlementKey,
        source: row.source,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
      }));
    });
  }

  /** Every outstanding policy must be accepted at its current version; stale versions are refused. */
  private assertCovers(outstanding: CurrentPolicy[], accepted: PolicyRef[]): void {
    const acceptedKeys = new Set(accepted.map(policyKey));
    const missing = outstanding.filter((policy) => !acceptedKeys.has(policyKey(policy)));
    if (missing.length === 0) return;
    const namesStale = accepted.some((ref) => missing.some((policy) => policy.policyId === ref.policyId));
    const keys = missing.map(policyKey);
    throw namesStale ? Errors.policyVersionOutdated(keys) : Errors.policyAcceptanceRequired(keys);
  }

  private async recordAcceptances(
    tx: Tx,
    userId: string,
    policies: CurrentPolicy[],
    input: { channel: 'WEB' | 'ANDROID' | 'IOS'; locale: string },
  ): Promise<void> {
    if (policies.length === 0) return;
    await tx.policyAcceptance.createMany({
      data: policies.map((policy) => ({
        userId,
        policyId: policy.policyId,
        policyVersion: policy.version,
        channel: input.channel,
        locale: input.locale,
      })),
      skipDuplicates: true,
    });
    for (const policy of policies) {
      this.securityEvents.emit({
        action: 'auth.policy.accepted',
        category: 'authentication',
        outcome: 'success',
        severity: 1,
        reasonCode: 'POLICY_ACCEPTED',
        actor: { id: userId, type: 'user' },
        target: { type: 'policy' },
        attributes: { policy_id: policy.policyId, policy_version: policy.version },
      });
    }
  }

  /** Free member access to every launched product (FR-PLAN-2602). Existing grants are left alone. */
  private async grantMemberAccess(tx: Tx, userId: string): Promise<void> {
    const account = await tx.userAccount.findUniqueOrThrow({ where: { id: userId }, select: { status: true } });
    if (account.status !== 'ACTIVE') return;
    const launched = await tx.product.findMany({ where: { launched: true }, select: { key: true } });
    if (launched.length === 0) return;
    await tx.entitlement.createMany({
      data: launched.map((product) => ({
        userId,
        productKey: product.key,
        entitlementKey: `${product.key}.member`,
        source: 'MEMBER' as const,
      })),
      skipDuplicates: true,
    });
  }

  private async view(tx: Tx, userId: string): Promise<AccountView> {
    const account = await tx.userAccount.findUniqueOrThrow({ where: { id: userId } });
    const outstanding = await outstandingPolicies(tx, userId);
    return {
      id: account.id,
      email: account.email,
      emailVerified: account.emailVerified,
      displayName: account.displayName,
      country: account.country,
      status: account.status,
      trustLevel: account.trustLevel,
      welcomeRequired: account.status === 'PENDING_WELCOME',
      outstandingPolicies: outstanding.map(({ policyId, version, title, url }) => ({ policyId, version, title, url })),
    };
  }
}
