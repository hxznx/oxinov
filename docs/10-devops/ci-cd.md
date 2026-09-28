# CI/CD pipeline

**Rule (owner requirement, 2026-09-26; ADR-018, NFR-17):** every push to `main` that passes CI reaches
production automatically. Nobody deploys by hand; a manual run exists only for forced rebuilds and
emergencies. Keep `main` always releasable.

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

## Continuous integration (`.github/workflows/ci.yml`, every push and pull request)

| Job | Checks |
|---|---|
| `scaffold` | Documentation map, requirement IDs, workspace boundaries, Compose and monitoring files |
| `api` | Edu API type check, lint, unit tests, migrations on PostgreSQL 18, Prisma drift, row-level-security tests, integration tests with object storage, build |
| `platform-api` | Same for the platform API |
| `platform-web`, `edu-web`, `company-web` | Type checks, unit tests, builds (and the shared `web-auth` tests) |
| `terraform` | `terraform fmt`, `validate` for every stack, CloudFront router tests |
| `delivery` | Mail relay tests, then `devops/scripts/check-delivery.sh`: shellcheck, release-planner tests, Helm lint, Kubernetes schema (`kubeconform`), Terraform format |
| `edu-api-image` | Production image build and Trivy image scan |

`.github/workflows/security.yml` scans the repository (vulnerabilities, secrets, misconfiguration) with
Trivy on every push and weekly. Dependabot (`.github/dependabot.yml`) opens grouped weekly updates for npm,
GitHub Actions, base images, and Terraform providers; they pass the same CI and deploy like any change.
CodeQL and dependency review need GitHub Advanced Security on this private repository (a paid decision).

## Continuous deployment (`.github/workflows/deploy-production.yml`)

Starts automatically when CI succeeds for a push to `main` (never for pull requests or forks).

1. **Plan:** `devops/scripts/release-plan.sh` compares the commit with the running release (read from the
   node) and lists the images whose inputs changed. Documentation-only pushes stop here.
2. **Images:** each changed image is built with layer caching, scanned with Trivy (HIGH or CRITICAL with a
   fix fails the release; reviewed, expiring exceptions only in the image's own `.trivyignore`), and pushed
   to ECR with the commit SHA as an immutable tag.
3. **Chart:** the Helm chart is packaged as `0.1.0-g<sha>` and pushed to ECR as an OCI artifact.
4. **Release:** over Systems Manager (no SSH), the node runs `bootstrap-node.sh` (idempotent), pulls the
   chart, and runs `helm upgrade --rollback-on-failure --wait` with one tag per service. Migrations run as
   a hook before the new code starts. The node then checks the three public names through Traefik.
5. **Smoke test:** `devops/scripts/smoke-test.sh` checks the sites, sign-in discovery and redirect, that the
   admin console stays closed, HTTPS redirects, and HSTS.
6. **Rollback:** a failed upgrade, node check, or smoke test restores the previous Helm revision
   automatically; the run fails and shows why.

Manual run (Actions → Deploy production → Run workflow, or `oxctl deploy`): `--all` rebuilds every image;
`--realm` re-applies the sign-in realm settings.

AWS access is keyless everywhere: GitHub OIDC for the deploy role (limited to the ECR repositories and to
running the deploy script on the one node) and the node's instance role for S3, SES, ECR, and Parameter
Store. Terraform changes are never applied by CI: the owner sees a saved plan and replies "yes apply".

The company website (`deploy-company-web.yml`) deploys the same way to S3 and CloudFront on every push that
changes it.

## Next steps

Branch protection with required checks and pull-request merges, image signing and SBOM (cosign), nightly
rescans of running images, staging with automatic promotion, and delivery metrics are phased in the
[DevOps roadmap](devops-roadmap.md).
