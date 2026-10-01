# Current state of the platform

What runs today, verified in production or CI, and where each part goes when it scales out. Read it before any change; update it in the same change as any runtime, data, security, or cost change.

**Status:** Current · **Owner:** Engineering lead (the founder decides) · **Last reviewed:** 2026-09-28

Other documents describe the target design. Where they differ from this page, this page describes today and the linked ADR describes the change.

## Products and sites

| Address | What it is | State |
| --- | --- | --- |
| `oxinov.com` | Company website: static Next.js export on S3 behind CloudFront | Live; SEO complete ([SEO](../13-marketing/seo/README.md)); Google Search Console and Bing verified |
| `id.oxinov.com` | One Oxinov account (Keycloak, email one-time code) | Live; sign-in emails through Amazon SES (sandbox until production access is granted) |
| `app.oxinov.com` | Account portal and product launcher (`platform-web`, `platform-api`) | Live, foundation only |
| `edu.oxinov.com` | Oxinov Edu (`edu-web`, `edu-api`) | Live, in development: courses, video and audio lessons, timed quizzes and mock exams, assignments, notes, resources, class stream, join codes, course completion and certificates with public verification ([Edu web](../../frontend/products/edu-web/README.md)) |
| `hr.oxinov.com` | Unified Oxinov HR: managed recruitment and direct hiring | Consolidated FRD and product record only; nothing is built or public until its unified release gate closes (ADR-025) |
| `market.`, `services.oxinov.com` | Oxinov Market, Oxinov Services Market | Draft charters and proposed FRDs only; nothing is built until each release gate is approved |
| Future or undecided | Oxinov Studio, Oxinov JP, Oxinov Tech | Proposed discovery FRDs only; definitions and release gates remain open, with no runtime or production address |

## Runtime (ADR-017, ADR-018)

| Layer | Today | At scale (trigger in the [DevOps roadmap](../10-devops/devops-roadmap.md)) |
| --- | --- | --- |
| Compute | One EC2 `t3a.medium` (2 vCPU, 4 GiB + 2 GiB swap), Mumbai, running k3s v1.36 with Traefik and Let's Encrypt; no SSH (Systems Manager only) | Amazon EKS across two Availability Zones |
| Packaging | One shared Helm chart (`devops/kubernetes/helm/oxinov`), Helm 4; one `oxinov` release | One release and namespace per product plane (ADR-019) |
| Services | Eight, registered once in `services.yaml` ([service catalog](../08-engineering/service-catalog.md)): `lms-api`, `platform-api`, `edu-web`, `platform-web`, `keycloak`, `mail-relay`, `migrate` (Helm hook job), `backup` (nightly CronJob). The `lms-api` entry builds image `oxinov/lms-api` and runs as the Helm workload `edu-api` until the [ADR-027 cutover](../10-devops/runbooks/edu-rename-cutover.md) | Same images and chart |
| Capacity | One replica per service (`values-production.yaml`). Production memory requests are checked in CI against a 3,300 MiB budget (`memoryBudgetMi`); priority classes `critical`, `core`, and `growth` decide what the node keeps under memory pressure (ADR-022) | A second node, RDS, or EKS only when the budget cannot hold the live products or an availability commitment needs it (ADR-022) |
| Website | S3 + CloudFront (PriceClass_200) with a CloudFront Function router | Same |
| Database | PostgreSQL 18.6 as a StatefulSet on the encrypted disk; separate `oxinov_lms` (Edu; renamed `oxinov_edu` at the ADR-027 cutover) and `oxinov_platform` databases and roles; row-level security with a non-bypass request role (ADR-006) | Amazon RDS for PostgreSQL (Multi-AZ when an availability commitment exists) |
| Files | Private, versioned S3 bucket; uploads and playback through short-lived presigned URLs; video served as uploaded (no adaptive streaming yet, ADR-021) | CloudFront signed URLs; HLS transcoding when learners need it (ADR-021) |
| Cache and queues | None. Nothing needs them yet (ADR-021) | Redis-compatible cache or SQS when a measured need appears; events through SNS/SQS (ADR-019) |
| Email | Amazon SES through `mail-relay` (instance role, no keys); configuration set with bounce and complaint suppression, events to an encrypted SNS topic, reputation alarms | Same |
| Secrets | Generated on the server into SSM Parameter Store SecureStrings, rendered into an encrypted Kubernetes Secret | Same, or Secrets Manager where rotation is needed (ADR-021) |

## Delivery

| Stage | Today |
| --- | --- |
| CI (`.github/workflows/ci.yml`, every push) | Documentation and boundary validation; type check, lint, unit and PostgreSQL integration tests for the APIs (real PostgreSQL 18 and S3-compatible storage); migration drift check; web builds and static-export tests; Terraform `fmt` and `validate` for every stack; Prometheus, Alertmanager, and Grafana config checks; Trivy image scan |
| Security (`.github/workflows/security.yml`, every push and weekly) | Scaffold security rules; Trivy scan of the repository for vulnerabilities, secrets, and misconfiguration |
| Website (`deploy-company-web.yml`) | Every push to `main`: build, test, sync to S3, invalidate CloudFront |
| Production (`deploy-production.yml`) | After green CI on `main`: `release-plan.sh` rebuilds only changed images, Trivy gates HIGH/CRITICAL, immutable ECR tags, `helm upgrade --rollback-on-failure --wait`, public smoke test, automatic rollback (NFR-17) |
| Dependencies | Dependabot weekly groups for npm, Actions, Docker, and Terraform; pnpm strict catalog; one lockfile |
| Infrastructure | Terraform 1.16 with S3 state and lockfile; stacks `bootstrap`, `production/edge`, `production/starter`; every apply follows a saved plan and the owner's "yes apply" |
| Stale item | `.github/workflows/deploy.yml` ("Deployment preflight (deployment not configured)", staging) predates the production pipeline and is due for removal or retargeting |

There is no staging environment. Delivery changes are rehearsed on a throwaway local k3s (`devops/kubernetes/scripts/rehearse-local.sh`) with the production versions. Staging arrives in DevOps roadmap Phase 4, when a second developer joins or the first school pays (ADR-021).

## Security controls in production

| Control | State |
| --- | --- |
| Access | Keycloak administrators sign in with a password and an authenticator-app code; realm automation uses the `oxinov-automation` service account. No SSH and no long-lived AWS keys: GitHub OIDC roles for CI and deploy, the instance role for the server, Systems Manager for administration |
| Network | Only 80/443 open; HTTPS with HSTS; Keycloak admin console and master realm not served publicly; deny-by-default Kubernetes network policies; only pods that call AWS reach instance metadata (IMDSv2, hop limit 2) |
| Workloads | Non-root numeric users, no Linux capabilities, read-only root filesystems where possible, resource limits |
| Data | Encrypted EBS, S3 (block public access), Kubernetes Secrets encrypted at rest, customer-managed KMS key for email events; tenant isolation in the API plus PostgreSQL row-level security, tested with two tenants |
| Supply chain | Pinned versions with checksums or digests, immutable image tags, Trivy gates, Dependabot |
| Account monitoring | CloudTrail (all regions, log-file validation, KMS-encrypted, 365 days in `oxinov-cloudtrail-614130400110`) and GuardDuty in Mumbai (foundational plus S3 data events and on-demand malware scans), both since 2026-09-26 (`starter/security.tf`); medium-or-higher findings and any CloudTrail tampering are emailed to the operations mailbox |
| Recovery | Nightly `pg_dumpall` to S3 (30 days; dumps before 2026-10-01 are empty because of a since-fixed CronJob bug), daily encrypted disk snapshots (7 days), CloudWatch recover and reboot actions, automatic security updates |
| Not yet in place | AWS Config, WAF, SIEM, CodeQL and dependency review (need GitHub Advanced Security); see the [security roadmap](../09-security/security-baseline.md#roadmap) for costs and triggers |

## Observability

| Signal | Today |
| --- | --- |
| Alarms | CloudWatch: instance and system status with automatic recovery; SES bounce and complaint rates |
| Health | Kubernetes startup, liveness, and readiness checks; the post-release smoke test |
| Logs | Structured JSON logs, read through `oxctl logs` |
| Metrics and traces | Not in production. The Prometheus, Alertmanager, and Grafana stack under `monitoring/` runs locally and in CI checks only, because on a 4 GiB node it would crowd out the applications. OpenTelemetry arrives with ADR-019 step 5 ([observability](../10-devops/observability.md)) |

## Cost

The budget is US$50 a month, with Terraform-managed alerts at 85%, 100%, and forecast 100% (`cost.tf`). Estimated spend is about US$46–48 a month, most of it the server. Line items and savings are in [cost optimization](../10-devops/cost-optimization.md).

## Technology in use

| Area | Versions |
| --- | --- |
| Languages and tooling | TypeScript 5.9, Node.js 22, pnpm 12.6 (strict catalog), Turborepo, Python 3.12 for repository tools |
| Frontend | Next.js 16.3 (App Router; static export for `oxinov.com`), React 19.3, Tailwind CSS 4.3, `@oxinov/design-system` tokens |
| Backend | NestJS 11.2, Prisma 7.10, class-validator 0.15, AWS SDK v3, `@oxinov/server-kit` (hardening, health, metrics) |
| Data and identity | PostgreSQL 18.6, Keycloak 26.7 |
| Platform | k3s v1.36, Helm 4.3, Traefik, Terraform 1.16, GitHub Actions, Trivy, Dependabot |

## Known gaps, in priority order

1. **SES production access:** requested 2026-09-28 (transactional, Mumbai); AWS review pending. Until it is approved, SES sends only to verified addresses, so new accounts with outside addresses (for example Gmail) get no code (seen in the mail-relay log as `MessageRejected`).
2. **Upload malware scanning** before public sign-up (security roadmap #3).
3. **Single node:** a host failure means minutes of downtime, and restores lose up to 24 hours (ADR-017). This is acceptable until a paying school needs an availability commitment.
4. **Not live yet:**
   - Paid checkout: the Khalti and eSewa checkout (ADR-023) is built but off in production (`payments.mode: sandbox`, no seller workspace in `payments.sellerTenantIds`).
   - Mobile apps, and the worker and chat services (placeholder folders only) ([backlog](../11-planning/tasks.md)).
5. **Production metrics and tracing** (OpenTelemetry, ADR-019 step 5).
