# DevOps roadmap

**Owner:** founder (decisions and spend), lead engineer (delivery). **Updated:** 2026-09-26.
Related: [ADR-017 starter hosting and ADR-019 multi-product architecture](../architecture/ADR.md), [AWS architecture](../architecture/AWS-CLOUD-ARCHITECTURE.md),
[CI/CD](CI-CD.md), [rollback](ROLLBACK.md), [backup and recovery](BACKUP-RECOVERY.md), [production runbook](../../devops/kubernetes/README.md).

## Guiding rules

- **Every push to `main` that passes CI reaches production automatically.** People never deploy by hand;
  a manual run exists only for forced rebuilds and emergencies (owner requirement, 2026-09-26).
- Real-world practice over shortcuts: immutable images, infrastructure as code, keyless cloud access,
  health-checked releases with automatic rollback, forward-only migrations, and nothing secret in Git.
- Spend grows only with a trigger (paying schools, measured load, a compliance need), never in advance.
- Each phase ends with written exit criteria; a phase is done when they are verified, not when code exists.

## Where we are

| Area | Status |
|---|---|
| Runtime | One k3s node on the starter server (`t3a.medium`, 4 GiB + 2 GiB swap), shared Helm chart, about US$40/month (ADR-018, owner option 1) |
| CI | Every push: docs, workspace, both APIs with PostgreSQL and object storage, three web apps, Terraform, delivery checks (shellcheck, planner tests, Helm lint, Kubernetes schema); Trivy repository scan; Dependabot weekly |
| Continuous deployment | Every green `main` push: change-based image builds, Trivy, ECR, chart to ECR (OCI), `helm upgrade --rollback-on-failure`, node checks, public smoke test, automatic rollback |
| Rehearsal | `rehearse-local.sh` proves install, migrations, routes, realm, and a forced rollback on local k3s before production |
| Infrastructure as code | Terraform: state bootstrap, `edge` (DNS, website, email records), `starter` (server, backups, ECR, S3, DNS, SES, deploy role, budget) |
| Company website | Continuous deployment to S3 and CloudFront on every push |
| Cost control | Budget US$50/month in Terraform (alerts at 85% and 100% actual, 100% forecast) |

## Phase 1 — Go live with continuous deployment (now)

1. Keycloak 26.7.4 passes the Trivy gate with reviewed, expiring exceptions for upstream libraries (done).
2. Continuous deployment on k3s: planner, node bootstrap, Helm release with automatic rollback, smoke
   test, `oxctl`, `check-delivery.sh`, `rehearse-local.sh`, ADR-018, NFR-17, and the AGENTS.md rules (done).
3. Apply the Terraform additions (backup and chart repositories, budget import) after the owner's "yes apply".
4. First production release through the pipeline; realm configured; sign-in verified end to end with a
   verified address.
5. Request SES production access (owner, text in the runbook), then test a code to a new address.

**Exit:** `edu`, `app`, and `id.oxinov.com` serve over HTTPS; a push to `main` is live in about
15 minutes with no manual step; a deliberately broken release rolls itself back; the nightly backup exists in S3.

## Phase 2 — Safe, boring releases (weeks 2–4, no extra cost)

- **Protect `main`:** changes arrive through pull requests with required CI checks, so "push to main"
  always means "reviewed and green". Squash merges keep one deployable commit per change.
- **Dependency hygiene:** Renovate (or Dependabot) for npm packages, GitHub Actions, and image digests,
  grouped weekly; automerge only patch updates that pass CI.
- **Supply chain:** CodeQL and dependency review on pull requests; SBOM and signed provenance for every
  image (cosign, keyless) and signature verification on the server before starting a release.
- **Nightly security rescan** of the images that are actually running; a new critical finding opens an issue.
- **Migration safety:** a CI check that flags destructive SQL (drop, rename, type change) unless the
  change follows expand-then-contract, so image rollback always stays possible.
- **Deploy notices:** release, rollback, and failure messages to email (and chat when chosen).
- **Delivery metrics (DORA):** deploy frequency, lead time, change failure rate, and time to restore,
  read from workflow history each month.

**Exit:** no direct pushes to `main`; every running image is signed and scanned in the last 24 hours;
the four delivery metrics are reported monthly.

## Phase 3 — See problems before users do (month 2, about US$0–10/month)

- **Uptime checks** every minute from outside AWS on the three public names and sign-in discovery.
- **Logs:** container logs shipped to CloudWatch Logs (30 days) with saved queries for errors and 5xx.
- **Metrics:** host and container metrics plus the existing Prometheus rules (repository `monitoring`
  profile) on a free hosted Grafana tier or CloudWatch, with alerts for disk, memory, restarts, and errors.
- **Service levels:** 99.5% monthly availability for Edu sign-in and lessons at launch, with an error budget.
- **Security events** from the APIs delivered to the SOC pipeline (security/soc).
- **Recovery drill, automated monthly:** restore the latest dump into a throwaway database, run checks, report.

**Exit:** an outage pages the owner within 5 minutes; a restore drill passes every month.

## Phase 4 — Staging and preview environments (when a second developer joins or the first school pays)

- A small staging server (same Terraform module, separate state) receives every `main` commit first;
  production is promoted **automatically** only after staging smoke tests pass, keeping deploys hands-free.
- Preview environments for pull requests that change the web apps (short-lived, torn down on merge).
- Seeded test data and synthetic sign-in checks that use a test mailbox.

**Exit:** a bad commit is stopped in staging without touching production. **Cost:** about +US$15–20/month.

## Phase 5 — Scale out (trigger-based)

**Move when any trigger is true:** a paying school needs an availability commitment; the server stays
above 70% CPU or memory at peak for two weeks; restores take longer than 30 minutes; or more than one
region or product needs isolation.

| Step | What changes | Approximate cost |
|---|---|---|
| Bigger node | Same k3s node resized to `t3a.large` (8 GiB) when memory is the only limit; one Terraform change | +US$30 (or a Savings Plan) |
| Managed data | Amazon RDS PostgreSQL (Multi-AZ when promised), automated backups, copy to Hyderabad; chart `postgres.enabled: false` | +US$60–120 |
| Managed Kubernetes | Amazon EKS with the same chart and images, GitOps (Argo CD), External Secrets, cert-manager, cluster autoscaling, and canary releases (Argo Rollouts), behind CloudFront and WAF | total US$250–400 |

The same images, chart, migrations, and scripts move unchanged; only the cluster changes (ADR-018).

## Phase 6 — More products and mobile (with each product launch)

- New product planes (Market, Jobs, Services) reuse the image targets, release planner, and chart.
- Android: signed `.aab` built in CI and published to the Play internal track, promoted by staged rollout.
- Per-product cost tags and a monthly cost report per product.

## Multi-product architecture track

Runs alongside the phases above so each new product is cheap to add and cannot break the others
([ADR-019](../architecture/ADR.md)). Ordered by value; each item is done when its check passes.

| # | Improvement | When | Done when |
|---|---|---|---|
| 1 | **Release per plane:** `platform` and `edu` Helm releases in their own namespaces, with quotas and network policies | Now, with Phase 1–2 | A deliberately failing Edu release rolls back only Edu; sign-in and the portal stay up |
| 2 | **Service catalog and golden path:** `services.yaml` drives the release planner, CI, chart values, and docs; `oxctl new-service` scaffolds a service | Now, with Phase 2 | Adding a service touches only its own folder and one catalog entry, and it deploys on the next push |
| 3 | **Events between products:** outbox tables, Amazon SNS topics, one SQS queue per consumer, dead-letter queues, all in Terraform | When Market starts | `account.created` and `entitlement.changed` reach a second product; a failed handler retries and lands in the dead-letter queue |
| 4 | **Feature flags:** server-side flags per tenant, plan, or percentage behind OpenFeature | When Market starts | An unfinished feature ships to production switched off and is enabled for one tenant without a deploy |
| 5 | **Shared observability:** OpenTelemetry in `@oxinov/server-kit` and the web apps; trace IDs across services | With Phase 3 | One request can be followed from the portal through sign-in to an API in a single trace |
| 6 | **Contracts and ownership:** versioned OpenAPI with a compatibility check in CI and generated clients; `CODEOWNERS`; a service level per product | With Phase 2–3 | A breaking API change fails CI before merge |
| 7 | **Cost and data isolation:** cost tags per product; a separate database instance and AWS account for regulated products | Tags now; isolation when Market launches | The monthly cost report shows each product; Market data sits outside the shared database |

Keep each product one API (a modular monolith) until a measured need justifies splitting it.

## Always-on work

| Topic | Practice |
|---|---|
| Security | Quarterly access review; rotate session secrets yearly; GuardDuty and CloudTrail when budget allows; no SSH, no long-lived keys |
| Cost | Monthly review against the budget; clean old images and snapshots automatically (already configured) |
| Documentation | Every infrastructure or pipeline change updates this roadmap, the runbook, and the changelog |
| Disaster recovery | Nightly dumps (30 days) and daily snapshots (7 days) today; cross-region copies from Phase 5 |
