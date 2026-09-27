import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { Errors } from '../common/errors';
import type { AppRequest, AuthUser, TenantScope } from '../common/request';

export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext): AuthUser => {
  const user = context.switchToHttp().getRequest<AppRequest>().user;
  if (!user) throw Errors.unauthenticated();
  return user;
});

/** Tenant scope established by TenantGuard. Using it on an unguarded route is a programming error. */
export const CurrentTenant = createParamDecorator(
  (_: unknown, context: ExecutionContext): TenantScope => {
    const tenant = context.switchToHttp().getRequest<AppRequest>().tenant;
    if (!tenant) throw new Error('CurrentTenant used on a route without TenantGuard');
    return tenant;
  },
);
