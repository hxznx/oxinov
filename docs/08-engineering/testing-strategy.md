# Testing strategy

**Updated:** 2026-09-26. Tests prove behaviour, including failure paths; they never merely mirror implementation details.

## In place (run in CI on every push)

| Layer | Tools | Covers |
| --- | --- | --- |
| Unit | Jest (APIs, server-kit, mail relay), Node test runner (web packages) | Scoring, entitlements, role rules, validation, configuration |
| Integration | Jest against real PostgreSQL 18 and S3-compatible storage (SeaweedFS) | Migrations, transactions, row-level security, allowed and denied cross-tenant paths with two tenants, media uploads |
| Database policies | `db:test-policies` SQL tests as the request role | RLS cannot be bypassed |
| Schema drift | Prisma migrate against a fresh database | Migrations match the schema |
| Static site | Node test runner on the exported `oxinov.com` | Every route, one `h1`, alt text, links, honest product status, no trackers, SEO metadata and structured data |
| Delivery | `release-plan.test.sh`, ShellCheck, `helm lint`, `kubeconform`, CloudFront router tests | Release planning, scripts, chart, and edge routing |
| Infrastructure | `terraform fmt` and `validate` for every stack | Configuration errors |
| Security | Trivy (images, repository, secrets, IaC), security-event schema tests | Known vulnerabilities, leaked secrets, sensitive fields |
| Production | Post-release smoke test with automatic rollback | The live release answers on every public host |

## Next

| Add | Why | When |
| --- | --- | --- |
| Playwright end-to-end tests for sign-in, join with a code, enrol, watch a lesson, take a timed exam, submit an assignment | Journeys break between layers | Next Edu milestone |
| OpenAPI contract and backward-compatibility check (ADR-019 step 6) | Clients break silently | With the generated client |
| Accessibility checks (axe) in end-to-end tests | WCAG 2.2 AA regressions | With Playwright |
| Load test (k6) against an agreed profile | Know the node's limits before a school depends on it | Before the first paying school |
| Quarterly restore test from the nightly dump | Backups only count if they restore | Quarterly (NFR-05) |
| Payment webhook, certificate, and mobile tests | New features | With those features |

## Rules

- Changes to tenant isolation, money, or exams need PostgreSQL integration tests for both allowed and denied paths.
- Tests use synthetic data only; never production data.
- A flaky test is fixed or removed the same week, not retried until green.
- Security tests exercise each detection rule with matching and non-matching synthetic events when the SIEM arrives.
