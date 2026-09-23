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
