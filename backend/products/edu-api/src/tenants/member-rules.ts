/**
 * Who may change a member's role or access (FR-AUTH-102; design screen 22, "Team and roles"). Pure so the
 * rules are unit-tested; the service also counts owners inside the same transaction.
 */
import type { TenantRole } from '../generated/prisma/enums';
import { hasRole } from '../tenancy/roles';

export type MemberStatus = 'ACTIVE' | 'SUSPENDED';

export interface MemberChange {
  actorUserId: string;
  actorRole: TenantRole;
  target: { userId: string; role: TenantRole; status: MemberStatus };
  role?: TenantRole;
  status?: MemberStatus;
  /** Active owners in the workspace before the change. */
  activeOwners: number;
}

/** Why the change is refused, or null when it is allowed. */
export function memberChangeProblem(change: MemberChange): string | null {
  const { actorUserId, actorRole, target } = change;
  const role = change.role ?? target.role;
  const status = change.status ?? target.status;
  if (!hasRole(actorRole, 'ADMIN')) return 'Only administrators can change members.';
  if (actorUserId === target.userId) return 'You cannot change your own role or access. Ask another owner.';
  const touchesLeaders = hasRole(target.role, 'ADMIN') || hasRole(role, 'ADMIN');
  if (touchesLeaders && actorRole !== 'OWNER') return 'Only the owner can change administrators and owners.';
  const losesOwner = target.role === 'OWNER' && target.status === 'ACTIVE' && (role !== 'OWNER' || status !== 'ACTIVE');
  if (losesOwner && change.activeOwners <= 1) return 'A workspace needs at least one active owner.';
  return null;
}
