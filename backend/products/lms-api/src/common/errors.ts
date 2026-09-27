/**
 * Stable API error codes (docs/06-api/api-errors.md). Clients branch on `code`, never on
 * `message`. Add codes deliberately; renaming one is a breaking API change.
 */
export type ErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'RESOURCE_NOT_FOUND'
  | 'CONFLICT'
  | 'EMAIL_NOT_VERIFIED'
  | 'SLUG_UNAVAILABLE'
  | 'PAYMENT_REQUIRED'
  | 'NOT_FOR_SALE'
  | 'PAYMENT_UNAVAILABLE'
  | 'NOT_ENTITLED'
  | 'COURSE_NOT_AVAILABLE'
  | 'ATTEMPT_LIMIT_REACHED'
  | 'ATTEMPT_EXPIRED'
  | 'ATTEMPT_CLOSED'
  | 'EXAM_NOT_AVAILABLE'
  | 'INVITE_INVALID'
  | 'MEDIA_UNAVAILABLE'
  | 'MEDIA_NOT_UPLOADED'
  | 'MEDIA_INVALID'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

import { DomainError as KitDomainError } from '@oxinov/server-kit';

/** Edu API errors use the shared envelope; `code` is limited to the codes above. */
export class DomainError extends KitDomainError<ErrorCode> {}

export const Errors = {
  unauthenticated: () => new DomainError('UNAUTHENTICATED', 401, 'Sign in to continue.'),
  forbidden: (message = 'You do not have permission to do this.') =>
    new DomainError('FORBIDDEN', 403, message),
  /** Used for missing objects and for other tenants' objects alike, so IDs are not disclosed. */
  notFound: (resource: string) =>
    new DomainError('RESOURCE_NOT_FOUND', 404, `${resource} was not found.`),
  conflict: (message: string) => new DomainError('CONFLICT', 409, message),
  emailNotVerified: () =>
    new DomainError('EMAIL_NOT_VERIFIED', 403, 'Verify your email address before continuing.'),
  slugUnavailable: () =>
    new DomainError('SLUG_UNAVAILABLE', 409, 'That workspace address is already taken.'),
  paymentRequired: () =>
    new DomainError('PAYMENT_REQUIRED', 402, 'This course must be purchased before enrolling.'),
  notForSale: (message = 'This course cannot be bought here yet.') => new DomainError('NOT_FOR_SALE', 409, message),
  paymentUnavailable: (message = 'Payment is not available right now. Try again in a few minutes.') =>
    new DomainError('PAYMENT_UNAVAILABLE', 503, message),
  notEntitled: () =>
    new DomainError('NOT_ENTITLED', 403, 'You need access to this course first.'),
  courseNotAvailable: () =>
    new DomainError('COURSE_NOT_AVAILABLE', 409, 'This course is not open for enrollment.'),
  attemptLimitReached: () =>
    new DomainError('ATTEMPT_LIMIT_REACHED', 409, 'No attempts remain for this exam.'),
  attemptExpired: () =>
    new DomainError('ATTEMPT_EXPIRED', 409, 'The time limit for this attempt has passed.'),
  attemptClosed: () =>
    new DomainError('ATTEMPT_CLOSED', 409, 'This attempt has already been submitted.'),
  examNotAvailable: () =>
    new DomainError('EXAM_NOT_AVAILABLE', 409, 'This exam is not available.'),
  /** One answer for unknown, expired, used-up, and revoked codes, so codes cannot be probed. */
  inviteInvalid: () =>
    new DomainError('INVITE_INVALID', 404, 'This join code is not valid or has expired.'),
  mediaUnavailable: () =>
    new DomainError('MEDIA_UNAVAILABLE', 503, 'Video and audio storage is not available right now.'),
  mediaNotUploaded: () =>
    new DomainError('MEDIA_NOT_UPLOADED', 409, 'The file has not finished uploading. Upload it again.'),
  mediaInvalid: (message: string) => new DomainError('MEDIA_INVALID', 422, message),
} as const;
