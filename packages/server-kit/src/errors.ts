/**
 * Stable API errors (docs/api/ERROR-HANDLING.md). Clients branch on `code`, never on `message`.
 * Each API adds its own codes; renaming a code is a breaking API change.
 */
export class DomainError<Code extends string = string> extends Error {
  constructor(
    readonly code: Code,
    readonly status: number,
    message: string,
    /** Extra machine-readable fields returned to the client, e.g. the required trust level. */
    readonly details?: Record<string, string | number | boolean | string[]>,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

/** Errors shared by every Oxinov API. */
export const CommonErrors = {
  unauthenticated: () => new DomainError('UNAUTHENTICATED', 401, 'Sign in to continue.'),
  forbidden: (message = 'You do not have permission to do this.') => new DomainError('FORBIDDEN', 403, message),
  /** Used for missing objects and for other owners' objects alike, so IDs are not disclosed. */
  notFound: (resource: string) => new DomainError('RESOURCE_NOT_FOUND', 404, `${resource} was not found.`),
  conflict: (message: string) => new DomainError('CONFLICT', 409, message),
} as const;
