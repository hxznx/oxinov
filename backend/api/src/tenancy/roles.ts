import type { TenantRole } from '../generated/prisma/enums';

// Higher roles include the permissions of lower ones within the same tenant (FR-AUTH-102).
const RANK: Record<TenantRole, number> = {
  LEARNER: 1,
  INSTRUCTOR: 2,
  ADMIN: 3,
  OWNER: 4,
};

export function hasRole(actual: TenantRole, required: TenantRole): boolean {
  return RANK[actual] >= RANK[required];
}

/** Instructors and above may see unpublished catalog content in their tenant. */
export function canAuthor(role: TenantRole): boolean {
  return hasRole(role, 'INSTRUCTOR');
}
