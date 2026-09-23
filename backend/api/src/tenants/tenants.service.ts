import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Errors } from '../common/errors';
import type { AuthUser, TenantScope } from '../common/request';
import { DatabaseContext } from '../database/database-context.service';
import { Prisma } from '../generated/prisma/client';
import type { CreateTenantDto, WorkspaceDto } from './tenants.dto';

// Addresses reserved for the platform itself.
const RESERVED_SLUGS = new Set([
  'admin', 'api', 'app', 'auth', 'billing', 'docs', 'help', 'mail', 'oxinov', 'platform',
  'status', 'support', 'verify', 'www',
]);

const workspaceSelect = {
  id: true,
  slug: true,
  name: true,
  status: true,
  primaryColor: true,
  timeZone: true,
  defaultLocale: true,
} as const;

@Injectable()
export class TenantsService {
  constructor(private readonly db: DatabaseContext) {}

  /** Workspaces where the caller has an ACTIVE membership (FR-TENANT-1601). */
  listForUser(user: AuthUser): Promise<WorkspaceDto[]> {
    return this.db.run({ userId: user.userId }, async (tx) => {
      const memberships = await tx.tenantMembership.findMany({
        where: { userId: user.userId, status: 'ACTIVE' },
        select: { role: true, tenant: { select: workspaceSelect } },
        orderBy: { createdAt: 'asc' },
      });
      return memberships.map(({ role, tenant }) => ({ ...tenant, role }));
    });
  }

  get(scope: TenantScope, user: AuthUser): Promise<WorkspaceDto> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { id: scope.tenantId },
        select: workspaceSelect,
      });
      if (!tenant) throw Errors.notFound('Workspace');
      return { ...tenant, role: scope.role };
    });
  }

  /**
   * Creates a workspace owned by the caller. Retrying with the same address returns the
   * workspace the caller already owns instead of creating a duplicate (idempotent creation).
   */
  async create(
    user: AuthUser,
    input: CreateTenantDto,
  ): Promise<{ workspace: WorkspaceDto; created: boolean }> {
    if (!user.emailVerified) throw Errors.emailNotVerified();
    if (RESERVED_SLUGS.has(input.slug)) throw Errors.slugUnavailable();

    const existing = await this.findOwnedBySlug(user, input.slug);
    if (existing) return { workspace: existing, created: false };

    const tenantId = randomUUID();
    try {
      const workspace = await this.db.run({ tenantId, userId: user.userId }, async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            id: tenantId,
            slug: input.slug,
            name: input.name,
            primaryColor: input.primaryColor ?? null,
            timeZone: input.timeZone ?? 'UTC',
            defaultLocale: input.defaultLocale ?? 'en',
            createdByUserId: user.userId,
          },
          select: workspaceSelect,
        });
        await tx.tenantMembership.create({
          data: { tenantId, userId: user.userId, role: 'OWNER' },
        });
        await tx.auditEvent.create({
          data: {
            tenantId,
            actorUserId: user.userId,
            action: 'tenant.created',
            targetType: 'tenant',
            targetId: tenantId,
          },
        });
        return { ...tenant, role: 'OWNER' as const };
      });
      return { workspace, created: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // A concurrent retry by the same owner may have won the race.
        const winner = await this.findOwnedBySlug(user, input.slug);
        if (winner) return { workspace: winner, created: false };
        throw Errors.slugUnavailable();
      }
      throw error;
    }
  }

  private findOwnedBySlug(user: AuthUser, slug: string): Promise<WorkspaceDto | null> {
    return this.db.run({ userId: user.userId }, async (tx) => {
      const membership = await tx.tenantMembership.findFirst({
        where: { userId: user.userId, role: 'OWNER', status: 'ACTIVE', tenant: { slug } },
        select: { role: true, tenant: { select: workspaceSelect } },
      });
      return membership ? { ...membership.tenant, role: membership.role } : null;
    });
  }
}
