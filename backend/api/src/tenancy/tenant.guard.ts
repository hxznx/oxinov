import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Errors } from '../common/errors';
import type { AppRequest } from '../common/request';
import { DatabaseContext } from '../database/database-context.service';
import type { TenantRole } from '../generated/prisma/enums';
import { SecurityEventsService } from '../observability/security-events.service';
import { hasRole } from './roles';

const ROLE_KEY = 'oxinov:min-role';

/** Minimum tenant role for a route. Defaults to LEARNER (any active member). */
export const RequireRole = (role: TenantRole) => SetMetadata(ROLE_KEY, role);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Establishes tenant context for routes under /v1/tenants/:tenantId. The caller must hold an
 * ACTIVE membership in that tenant; a supplied tenant ID alone proves nothing (FR-TENANT-1605).
 * Non-members get the same 404 as a nonexistent tenant, so tenant IDs cannot be probed.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly db: DatabaseContext,
    private readonly securityEvents: SecurityEventsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AppRequest>();
    const user = request.user;
    if (!user) throw Errors.unauthenticated();

    const tenantId = request.params.tenantId;
    if (!tenantId || !UUID.test(tenantId)) throw Errors.notFound('Workspace');

    const membership = await this.db.run({ tenantId, userId: user.userId }, (tx) =>
      tx.tenantMembership.findFirst({
        where: { tenantId, userId: user.userId, status: 'ACTIVE' },
        select: { role: true },
      }),
    );

    const requestInfo = {
      correlation_id: request.requestId,
      route: request.route?.path as string | undefined,
      method: request.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    };

    if (!membership) {
      this.securityEvents.emit({
        action: 'tenant.cross_access.denied',
        category: 'tenant_isolation',
        outcome: 'failure',
        severity: 8,
        reasonCode: 'TENANT_MEMBERSHIP_MISMATCH',
        tenantId,
        actor: { id: user.userId, type: 'user' },
        request: requestInfo,
        target: { type: 'tenant', id: tenantId },
      });
      throw Errors.notFound('Workspace');
    }

    const required =
      this.reflector.getAllAndOverride<TenantRole>(ROLE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'LEARNER';

    if (!hasRole(membership.role, required)) {
      this.securityEvents.emit({
        action: 'authorization.denied',
        category: 'authorization',
        outcome: 'failure',
        severity: 3,
        reasonCode: 'ROLE_INSUFFICIENT',
        tenantId,
        actor: { id: user.userId, type: 'user', role: membership.role },
        request: requestInfo,
        attributes: { required_role: required },
      });
      throw Errors.forbidden();
    }

    request.tenant = { tenantId, role: membership.role };
    return true;
  }
}
