import type { KitRequest } from '@oxinov/server-kit';
import type { TenantRole } from '../generated/prisma/enums';

export { pathParam, routePath } from '@oxinov/server-kit';

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

export interface AppRequest extends KitRequest {
  user?: AuthUser;
  tenant?: TenantScope;
}
