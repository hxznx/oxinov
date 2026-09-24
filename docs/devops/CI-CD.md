# CI/CD pipeline

The repository uses one pinned pnpm workspace lockfile and Turborepo for dependency-aware tasks.
Current workflows validate documentation, workspace and release-gate boundaries, Compose,
monitoring, and security conventions. The `api` job installs the frozen root lockfile, type-checks,
lints, and unit-tests the LMS API, applies migrations to PostgreSQL 18, fails on Prisma schema
drift, runs SQL RLS tests and API integration tests as `oxinov_app`, then builds. A dependent job
builds the LMS API container and scans it with Trivy for high and critical findings.

As implemented applications arrive, add their lint and formatting, strict TypeScript, contract,
integration, migration, image, and smoke-test gates. Add CodeQL, dependency review, OpenAPI
compatibility, SBOM and provenance, SOC tests, and frontend or mobile accessibility checks before
their release gates.

Release flow: main branch -> immutable images -> staging migration/deploy -> smoke tests -> synthetic monitoring alert -> approved production promotion -> monitoring. Android is built from the same release branch as a signed `.aab` for internal testing, then promoted through Play tracks after store checks. The checked-in `deploy.yml` is intentionally gated until a cloud target and secrets are configured.
