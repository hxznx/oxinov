import { Injectable } from '@nestjs/common';
import { SecurityEventsService, type IdentityResolver, type VerifiedIdentity } from '@oxinov/server-kit';
import { DatabaseContext } from '../database/database-context.service';
import { Prisma } from '../generated/prisma/client';
import type { AccountUser } from './account.types';

/**
 * Maps a verified identity to the person's Oxinov account, creating it on first sign-in in the
 * PENDING_WELCOME state (FR-ID-2205). Accounts are keyed by the immutable subject, never by email
 * (FR-ID-2206); verified-email linking between sign-in methods happens in id.oxinov.com.
 */
@Injectable()
export class IdentityService implements IdentityResolver<AccountUser> {
  constructor(
    private readonly db: DatabaseContext,
    private readonly securityEvents: SecurityEventsService,
  ) {}

  async resolve(identity: VerifiedIdentity): Promise<AccountUser> {
    try {
      return await this.resolveOnce(identity);
    } catch (error) {
      // Two first requests from a new person raced to create the account; the loser reads the winner's.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return this.resolveOnce(identity);
      }
      throw error;
    }
  }

  private async resolveOnce(identity: VerifiedIdentity): Promise<AccountUser> {
    const { account, created } = await this.db.run({ authSubject: identity.subject }, async (tx) => {
      const existing = await tx.userAccount.findUnique({ where: { authSubject: identity.subject } });
      if (!existing) {
        const account = await tx.userAccount.create({
          data: {
            authSubject: identity.subject,
            email: identity.email ?? null,
            emailVerified: identity.emailVerified ?? false,
            displayName: identity.name ?? null,
          },
        });
        return { account, created: true };
      }
      // The identity provider is the source of truth for claims it sends; a changed email is
      // unverified unless the token says otherwise.
      const emailChanged = identity.email !== undefined && identity.email !== existing.email;
      const emailVerified = identity.emailVerified ?? (emailChanged ? false : existing.emailVerified);
      if (!emailChanged && emailVerified === existing.emailVerified) return { account: existing, created: false };
      const account = await tx.userAccount.update({
        where: { id: existing.id },
        data: { email: identity.email ?? existing.email, emailVerified },
      });
      return { account, created: false };
    });

    if (created) {
      this.securityEvents.emit({
        action: 'auth.account.created',
        category: 'authentication',
        outcome: 'success',
        severity: 1,
        reasonCode: 'ACCOUNT_CREATED',
        actor: { id: account.id, type: 'user' },
      });
    }

    return {
      userId: account.id,
      authSubject: account.authSubject,
      email: account.email,
      emailVerified: account.emailVerified,
      status: account.status,
      trustLevel: account.trustLevel,
    };
  }
}
