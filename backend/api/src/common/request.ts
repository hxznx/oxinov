import type { Request } from 'express';
import type { TenantRole } from '../generated/prisma/enums';

/** Authenticated caller, resolved from a verified identity token plus PostgreSQL. */
export interface AuthUser {
  readonly userId: string;
  readonly authSubject: string;
  readonly email: string | null;
  readonly emailVerified: boolean;
}

/** Tenant context established only after an active membership was verified. */
export interface TenantScope {
  readonly tenantId: string;
  readonly role: TenantRole;
}

export interface AppRequest extends Request {
  requestId: string;
  user?: AuthUser;
  tenant?: TenantScope;
}

/** Matched Express route pattern, or undefined when no handler matched. `req.route` is untyped. */
export function routePath(request: Request): string | undefined {
  const route: unknown = request.route;
  if (typeof route !== 'object' || route === null) return undefined;
  const path: unknown = (route as { path?: unknown }).path;
  return typeof path === 'string' ? path : undefined;
}

/** A single path parameter; Express 5 types allow arrays for wildcard segments, which we reject. */
export function pathParam(request: Request, name: string): string | undefined {
  const value: unknown = request.params[name];
  return typeof value === 'string' ? value : undefined;
}
