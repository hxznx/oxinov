# Current state of the platform

**Updated:** 2026-09-26. **Owner:** lead engineer, with the founder for decisions. This page records what actually runs today, verified in production or CI, and when each part moves to its scale-out design. Other documents describe the target; where they differ from this page, this page describes today and the linked ADR describes the change. Update it in the same change as any runtime, data, security, or cost change.

## Products and sites

| Address | What it is | State |
| --- | --- | --- |
| `oxinov.com` | Company website: static Next.js export on S3 behind CloudFront | Live; SEO complete ([docs/marketing/seo](../marketing/seo/README.md)); Google Search Console and Bing verified |
| `id.oxinov.com` | One Oxinov account (Keycloak, email one-time code) | Live; sign-in emails through Amazon SES (sandbox until production access is granted) |
| `app.oxinov.com` | Account portal and product launcher (`platform-web`, `platform-api`) | Live, foundation only |
| `edu.oxinov.com` | Oxinov Edu (`lms-web`, `lms-api`) | Live, in development: courses, video and audio lessons, timed quizzes and mock exams, assignments, notes, resources, class stream, join codes ([Edu web](../../frontend/products/lms-web/README.md)) |
| `hr.oxinov.com` | Unified Oxinov HR: managed recruitment and direct hiring | Consolidated FRD and product record only; nothing is built or public until its unified release gate closes (ADR-025) |
| `market.`, `services.oxinov.com` | Oxinov Market, Services Market | Draft charters and proposed FRDs only; nothing is built until each release gate is approved |
| Future or undecided | Oxinov Studio, Oxinov JP, Oxinov Tech | Proposed discovery FRDs only; definitions and release gates remain open, with no runtime or production address |

## Runtime (ADR-017, ADR-018)

| Layer | Today | At scale (trigger in the [DevOps roadmap](../devops/ROADMAP.md)) |
| --- | --- | --- |
| Compute | One EC2 `t3a.medium` (2 vCPU, 4 GiB + 2 GiB swap), Mumbai, running k3s v1.36 with Traefik and Let's Encrypt; no SSH (Systems Manager only) | Amazon EKS across two Availability Zones |
| Packaging | One shared Helm chart (`devops/kubernetes/helm/oxinov`), Helm 4; one `oxinov` release | One release and namespace per product plane (ADR-019) |
| Services | Eight, registered once in [`services.yaml`](../engineering/SERVICE-CATALOG.md): `lms-api`, `platform-api`, `edu-web`, `platform-web`, `keycloak`, `mail-relay`, `migrate` (Helm hook job), `backup` (nightly CronJob) | Same images and chart |
| Website | S3 + CloudFront (PriceClass_200) with a CloudFront Function router | Same |
| Database | PostgreSQL 18.6 as a StatefulSet on the encrypted disk; separate `lms` and `platform` databases and roles; row-level security with a non-bypass request role (ADR-006) | Amazon RDS for PostgreSQL (Multi-AZ when an availability commitment exists) |
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

There is no staging environment. Delivery changes are rehearsed on a throwaway local k3s (`devops/kubernetes/scripts/rehearse-local.sh`) with the production versions; staging arrives in DevOps roadmap Phase 4, when a second developer joins or the first school pays (ADR-021).

## Security controls in production

| Control | State |
| --- | --- |
| Access | Keycloak administrators sign in with a password and an authenticator-app code; realm automation uses the `oxinov-automation` service account. No SSH and no long-lived AWS keys: GitHub OIDC roles for CI and deploy, the instance role for the server, Systems Manager for administration |
| Network | Only 80/443 open; HTTPS with HSTS; Keycloak admin console and master realm not served publicly; deny-by-default Kubernetes network policies; only pods that call AWS reach instance metadata (IMDSv2, hop limit 2) |
| Workloads | Non-root numeric users, no Linux capabilities, read-only root filesystems where possible, resource limits |
| Data | Encrypted EBS, S3 (block public access), Kubernetes Secrets encrypted at rest, customer-managed KMS key for email events; tenant isolation in the API plus PostgreSQL row-level security, tested with two tenants |
| Supply chain | Pinned versions with checksums or digests, immutable image tags, Trivy gates, Dependabot |
| Account monitoring | CloudTrail (all regions, log-file validation, KMS-encrypted, 365 days in `oxinov-cloudtrail-614130400110`) and GuardDuty in Mumbai (foundational plus S3 data events and on-demand malware scans), both since 2026-09-26 (`starter/security.tf`); medium-or-higher findings and any CloudTrail tampering are emailed to the operations mailbox |
| Recovery | Nightly `pg_dumpall` to S3 (30 days), daily encrypted disk snapshots (7 days), CloudWatch recover and reboot actions, automatic security updates |
| Not yet in place | AWS Config, WAF, SIEM, CodeQL and dependency review (need GitHub Advanced Security); see the [security roadmap](../security/SECURITY.md#roadmap) for costs and triggers |

## Observability

Production has CloudWatch alarms (instance and system status with automatic recovery, SES bounce and complaint rates), Kubernetes health checks, the post-release smoke test, and structured JSON logs read through `oxctl`. The Prometheus, Alertmanager, and Grafana stack under `monitoring/` runs locally and in CI checks, not in production: on a 4 GiB node it would crowd out the applications. OpenTelemetry tracing and a hosted metrics backend come with ADR-019 step 5 ([observability](../devops/OBSERVABILITY.md)).

## Cost

Budget: US$50 a month, with Terraform-managed alerts at 85%, 100%, and forecast 100% (`cost.tf`). Estimated spend is about US$46–48 a month, most of it the server; details and savings in [cost optimization](../devops/COST-OPTIMIZATION.md).

## Technology in use

| Area | Versions |
| --- | --- |
| Languages and tooling | TypeScript 5.9, Node.js 22, pnpm 12.6 (strict catalog), Turborepo, Python 3.12 for repository tools |
| Frontend | Next.js 16.3 (App Router; static export for `oxinov.com`), React 19.3, Tailwind CSS 4.3, `@oxinov/design-system` tokens |
| Backend | NestJS 11.2, Prisma 7.10, class-validator 0.15, AWS SDK v3, `@oxinov/server-kit` (hardening, health, metrics) |
| Data and identity | PostgreSQL 18.6, Keycloak 26.7 |
| Platform | k3s v1.36, Helm 4.3, Traefik, Terraform 1.16, GitHub Actions, Trivy, Dependabot |

## Known gaps, in priority order

1. SES production access: requested 2026-09-28 (transactional, Mumbai), AWS review pending. Until approved, SES sends only to verified addresses, so new accounts with outside addresses (for example Gmail) get no code (seen in the mail-relay log as `MessageRejected`).
2. Upload malware scanning before public sign-up (security roadmap #3).
3. Single node: a host failure means minutes of downtime and restores lose up to 24 hours (ADR-017); acceptable until a paying school needs an availability commitment.
4. No paid checkout, certificates, mobile apps, or worker and chat services yet ([backlog](../planning/TASKS.md)).
5. Production metrics and tracing (OpenTelemetry, ADR-019 step 5).
