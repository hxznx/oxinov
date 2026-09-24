import type { KitRequest } from '@oxinov/server-kit';
import type { AccountStatus, TrustLevel } from '../generated/prisma/enums';

/** The signed-in person, resolved from a verified identity token plus PostgreSQL. */
export interface AccountUser {
  readonly userId: string;
  readonly authSubject: string;
  readonly email: string | null;
  readonly emailVerified: boolean;
  readonly status: AccountStatus;
  readonly trustLevel: TrustLevel;
}

export interface PlatformRequest extends KitRequest {
  user?: AccountUser;
}

export interface PolicyRef {
  policyId: string;
  version: number;
}
