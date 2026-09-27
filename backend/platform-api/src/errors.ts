import { CommonErrors, DomainError } from '@oxinov/server-kit';

/** Platform API errors (docs/06-api/api-errors.md). Renaming a code is a breaking API change. */
export const Errors = {
  ...CommonErrors,
  /** FR-TRUST-2303: the client shows the listed policies and retries the original action. */
  policyAcceptanceRequired: (policies: string[]) =>
    new DomainError('POLICY_ACCEPTANCE_REQUIRED', 403, 'Accept the current Oxinov policies to continue.', {
      policies,
    }),
  accountSuspended: () =>
    new DomainError('ACCOUNT_SUSPENDED', 403, 'This Oxinov account is suspended. Contact support to appeal.'),
  policyVersionOutdated: (policies: string[]) =>
    new DomainError('POLICY_VERSION_OUTDATED', 409, 'A newer version of a policy is available. Review it and try again.', {
      policies,
    }),
  emailNotVerified: () =>
    new DomainError('EMAIL_NOT_VERIFIED', 403, 'Verify your email address before continuing.'),
} as const;
