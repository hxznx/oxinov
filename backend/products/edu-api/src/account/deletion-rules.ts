/**
 * Account deletion rules (FR-PRIV-3202, FR-AUTH-104). Pure functions, unit-tested.
 */

/** The owner's choice: a deletion request waits 14 days and can be cancelled until then. */
export const DELETION_WAIT_DAYS = 14;
const DAY = 24 * 60 * 60 * 1000;

/** The word a person types to confirm, so a slip of the finger never starts a deletion. */
export const DELETION_CONFIRM_WORD = 'DELETE';

export function deletionDate(requestedAt: Date): Date {
  return new Date(requestedAt.getTime() + DELETION_WAIT_DAYS * DAY);
}

/** Why a person cannot ask for deletion now, or null when they can. */
export function deletionProblem(input: { confirm: string; ownsWorkspaces: string[] }): string | null {
  if (input.confirm.trim() !== DELETION_CONFIRM_WORD) return `Type ${DELETION_CONFIRM_WORD} to confirm.`;
  if (input.ownsWorkspaces.length > 0) {
    return `You own ${input.ownsWorkspaces.join(', ')}. Make another member the owner (Studio › Team and roles) before deleting your account.`;
  }
  return null;
}

export type DeletionState = 'NONE' | 'SCHEDULED' | 'CANCELLED';

export function deletionState(request: { deleteAfter: Date; cancelledAt: Date | null; completedAt: Date | null } | null): DeletionState {
  if (!request || request.completedAt) return 'NONE';
  return request.cancelledAt ? 'CANCELLED' : 'SCHEDULED';
}

/** Name shown on a revoked certificate after its holder deleted their account. */
export const DELETED_HOLDER = 'Deleted account';
export const DELETED_CERTIFICATE_REASON = 'The holder deleted their account.';
