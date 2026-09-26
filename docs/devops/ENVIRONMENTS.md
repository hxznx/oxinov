# Environments

**Updated:** 2026-09-26 (ADR-021).

| Environment | Purpose | Where | Data |
| --- | --- | --- | --- |
| Local | Development | Docker Compose on the developer's machine ([setup](DEV-SETUP.md)) | Synthetic seeds only |
| CI | Every push: tests against real PostgreSQL 18 and S3-compatible storage, builds, scans | GitHub Actions, recreated per run | Synthetic, discarded |
| Rehearsal | Delivery changes (chart, node scripts): install, routes, realm, forced rollback | Throwaway local k3s with the production versions (`rehearse-local.sh`) | Synthetic |
| Production | Customers and all launched products | One k3s node in AWS Mumbai; `oxinov.com` on S3 and CloudFront | Protected, backed up nightly |
| Staging | Not in place (ADR-021) | Arrives in [DevOps roadmap](ROADMAP.md) Phase 4 (second developer or first paying school), with automatic promotion | Sanitized or synthetic |

Rules:

- The same immutable image moves from CI to production; nothing is rebuilt for an environment.
- Production data never leaves production: no copies to laptops, CI, or tests. Test data never enters production.
- Environment differences live in Helm values and Parameter Store, never in images.
- Payment providers run in test mode everywhere except production.
- Security events: local and CI use synthetic events only; production events go to production-only storage when the SIEM arrives.
