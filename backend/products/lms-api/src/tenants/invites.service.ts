import { Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { SecurityEventsService } from '@oxinov/server-kit';
import { Errors } from '../common/errors';
import type { AuthUser, TenantScope } from '../common/request';
import { DatabaseContext } from '../database/database-context.service';
import { Prisma } from '../generated/prisma/client';
import { hasRole } from '../tenancy/roles';
import type { WorkspaceDto } from './tenants.dto';
import type { CreateInviteDto, InviteDto, MemberDto } from './invites.dto';

/** 31 characters without look-alikes (0/O, 1/I/L); 31^8 ≈ 8.5 × 10^11 possible codes. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;
const CODE_PATTERN = /^[A-HJKMNP-Z2-9]{8}$/;
const DEFAULT_EXPIRY_DAYS = 14;

export function generateInviteCode(random: (max: number) => number = randomInt): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) code += ALPHABET[random(ALPHABET.length)];
  return code;
}

/** Accepts what people type: lower case, spaces, and the display hyphen (K7PX-9QMD). */
export function normalizeInviteCode(input: string): string | null {
  const code = input.toUpperCase().replace(/[\s-]/g, '');
  return CODE_PATTERN.test(code) ? code : null;
}

type InviteRow = {
  id: string;
  code: string;
  role: InviteDto['role'];
  expiresAt: Date;
  maxUses: number | null;
  useCount: number;
  revokedAt: Date | null;
  createdAt: Date;
};

function inviteStatus(invite: InviteRow, now = new Date()): InviteDto['status'] {
  if (invite.revokedAt) return 'REVOKED';
  if (invite.expiresAt <= now) return 'EXPIRED';
  if (invite.maxUses !== null && invite.useCount >= invite.maxUses) return 'USED_UP';
  return 'ACTIVE';
}

const toDto = (invite: InviteRow): InviteDto => ({
  id: invite.id,
  code: invite.code,
  role: invite.role,
  expiresAt: invite.expiresAt,
  maxUses: invite.maxUses,
  useCount: invite.useCount,
  status: inviteStatus(invite),
  createdAt: invite.createdAt,
});

const inviteSelect = {
  id: true,
  code: true,
  role: true,
  expiresAt: true,
  maxUses: true,
  useCount: true,
  revokedAt: true,
  createdAt: true,
} as const;

const workspaceSelect = {
  id: true,
  slug: true,
  name: true,
  status: true,
  primaryColor: true,
  timeZone: true,
  defaultLocale: true,
} as const;

/**
 * Workspace join codes and the member list (FR-AUTH-102, FR-TENANT). Administrators create, list, and
 * revoke codes; any signed-in person with a verified email can redeem one. Row-level security lets a
 * redeemer read only the invite whose code they supplied (database/products/lms/migrations/20260925000100_tenant_invites).
 */
@Injectable()
export class InvitesService {
  constructor(
    private readonly db: DatabaseContext,
    private readonly securityEvents: SecurityEventsService,
  ) {}

  async create(scope: TenantScope, user: AuthUser, input: CreateInviteDto): Promise<InviteDto> {
    // Only owners may mint administrator codes; administrators invite learners and instructors.
    if (input.role === 'ADMIN' && !hasRole(scope.role, 'OWNER')) {
      throw Errors.forbidden('Only the owner can create administrator join codes.');
    }
    const expiresAt = new Date(Date.now() + (input.expiresInDays ?? DEFAULT_EXPIRY_DAYS) * 86_400_000);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
          const invite = await tx.tenantInvite.create({
            data: {
              tenantId: scope.tenantId,
              code: generateInviteCode(),
              role: input.role,
              createdByUserId: user.userId,
              expiresAt,
              maxUses: input.maxUses ?? null,
            },
            select: inviteSelect,
          });
          await tx.auditEvent.create({
            data: {
              tenantId: scope.tenantId,
              actorUserId: user.userId,
              action: 'tenant.invite.created',
              targetType: 'tenant_invite',
              targetId: invite.id,
              metadata: { role: input.role, expiresAt: expiresAt.toISOString(), maxUses: input.maxUses ?? null },
            },
          });
          return toDto(invite);
        });
      } catch (error) {
        // A code collision is astronomically rare; try a fresh code.
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') continue;
        throw error;
      }
    }
    throw Errors.conflict('Could not create a join code. Try again.');
  }

  list(scope: TenantScope, user: AuthUser): Promise<InviteDto[]> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const invites = await tx.tenantInvite.findMany({
        where: { tenantId: scope.tenantId },
        select: inviteSelect,
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return invites.map(toDto);
    });
  }

  revoke(scope: TenantScope, user: AuthUser, inviteId: string): Promise<InviteDto> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const { count } = await tx.tenantInvite.updateMany({
        where: { id: inviteId, tenantId: scope.tenantId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      const invite = await tx.tenantInvite.findFirst({ where: { id: inviteId, tenantId: scope.tenantId }, select: inviteSelect });
      if (!invite) throw Errors.notFound('Join code');
      if (count > 0) {
        await tx.auditEvent.create({
          data: {
            tenantId: scope.tenantId,
            actorUserId: user.userId,
            action: 'tenant.invite.revoked',
            targetType: 'tenant_invite',
            targetId: invite.id,
          },
        });
      }
      return toDto(invite);
    });
  }

  /**
   * Joins the workspace behind a code. Joining twice returns the existing membership without using the
   * code again. Unknown, expired, used-up, and revoked codes all fail the same way.
   */
  async redeem(user: AuthUser, rawCode: string): Promise<{ workspace: WorkspaceDto; joined: boolean }> {
    if (!user.emailVerified) throw Errors.emailNotVerified();
    const code = normalizeInviteCode(rawCode);
    if (!code) throw this.invalid(user, 'INVITE_MALFORMED');

    const invite = await this.db.run({ userId: user.userId, inviteCode: code }, (tx) =>
      tx.tenantInvite.findUnique({ where: { code }, select: { ...inviteSelect, tenantId: true } }),
    );
    if (!invite || inviteStatus(invite) !== 'ACTIVE') throw this.invalid(user, 'INVITE_UNUSABLE', invite?.tenantId);

    const join = () =>
      this.db.run({ tenantId: invite.tenantId, userId: user.userId }, async (tx) => {
        const tenant = await tx.tenant.findUniqueOrThrow({ where: { id: invite.tenantId }, select: workspaceSelect });
        const existing = await tx.tenantMembership.findUnique({
          where: { tenantId_userId: { tenantId: invite.tenantId, userId: user.userId } },
          select: { role: true, status: true },
        });
        if (existing?.status === 'ACTIVE') return { workspace: { ...tenant, role: existing.role }, joined: false };
        if (existing) throw Errors.forbidden('Your access to this learning space is suspended. Contact its administrator.');

        // Consume one use atomically; a concurrent redemption of the last use loses here.
        const consumed = await tx.tenantInvite.updateMany({
          where: {
            id: invite.id,
            revokedAt: null,
            expiresAt: { gt: new Date() },
            ...(invite.maxUses === null ? {} : { useCount: { lt: invite.maxUses } }),
          },
          data: { useCount: { increment: 1 } },
        });
        if (consumed.count === 0) throw Errors.inviteInvalid();

        await tx.tenantMembership.create({ data: { tenantId: invite.tenantId, userId: user.userId, role: invite.role } });
        await tx.auditEvent.create({
          data: {
            tenantId: invite.tenantId,
            actorUserId: user.userId,
            action: 'tenant.member.joined',
            targetType: 'tenant_invite',
            targetId: invite.id,
            metadata: { role: invite.role },
          },
        });
        return { workspace: { ...tenant, role: invite.role }, joined: true };
      });

    try {
      return await join();
    } catch (error) {
      // Two simultaneous redemptions by the same person: the loser sees the winner's membership.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return join();
      throw error;
    }
  }

  /** The workspace's people with their roles (Classroom-style "People"). Administrators only. */
  members(scope: TenantScope, user: AuthUser): Promise<MemberDto[]> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const memberships = await tx.tenantMembership.findMany({
        where: { tenantId: scope.tenantId },
        select: { role: true, status: true, createdAt: true, user: { select: { id: true, displayName: true, email: true } } },
        orderBy: { createdAt: 'asc' },
        take: 500,
      });
      return memberships.map((membership) => ({
        userId: membership.user.id,
        displayName: membership.user.displayName,
        email: membership.user.email,
        role: membership.role,
        status: membership.status,
        joinedAt: membership.createdAt,
      }));
    });
  }

  private invalid(user: AuthUser, reasonCode: string, tenantId?: string) {
    // Repeated failures from one account are a code-guessing signal for monitoring.
    this.securityEvents.emit({
      action: 'tenant.invite.redeem_failed',
      category: 'authorization',
      outcome: 'failure',
      severity: 3,
      reasonCode,
      ...(tenantId ? { tenantId } : {}),
      actor: { id: user.userId, type: 'user' },
    });
    return Errors.inviteInvalid();
  }
}
