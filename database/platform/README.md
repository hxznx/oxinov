# Platform Database Assets (`database/platform`)

PostgreSQL schema, Prisma schema, numbered migrations, deterministic seeds, and Row-Level Security policies for the Oxinov Platform Control Plane (`api.oxinov.com`).

## Tables & Domains
- `users`: Universal identity, authentication provider links, trust level, email verification.
- `organizations` & `organization_members`: Multi-tenant organization hierarchy, roles, invitations.
- `entitlements` & `subscriptions`: Plan ladder, feature flags, usage limits, metering records.
- `payments_ledger` & `escrow_accounts`: Server-verified Khalti/eSewa transactions, escrow milestone holds.
- `kyc_verifications`: Verification records, document metadata, audit history.
- `policy_acceptances`: Immutable audit trail of legal terms accepted by users.
