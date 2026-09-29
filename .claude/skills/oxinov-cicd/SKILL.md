---
name: oxinov-cicd
description: Change Oxinov continuous integration and delivery - GitHub Actions workflows, delivery bash scripts, the release planner, image builds and scans, automatic deploy and rollback, and the smoke test. Use for any change under .github/workflows or devops/scripts, or to understand what a push to main will do.
---

# Oxinov CI/CD

Plan larger or cross-cutting infrastructure changes first with the oxinov-devops-architecture skill (tool ownership, today's production against the reference architecture, and the production safety rules).

Rules: [DevOps rules](../../../docs/14-ai-knowledge/devops-rules.md), [AGENTS.md](../../../AGENTS.md) section 7. Source: [CI/CD](../../../docs/10-devops/ci-cd.md), [deployment](../../../docs/10-devops/deployment.md), [rollback](../../../docs/10-devops/rollback.md).

## The pipeline

| Stage | File | Does |
| --- | --- | --- |
| CI | `.github/workflows/ci.yml` | Job `scope` (`devops/scripts/ci-scope.sh`: documentation-only changes since the last green CI on `main` skip the heavy jobs), then `scaffold` (docs, catalogs, boundaries), `api`, `platform-api`, `platform-web`, `edu-web`, `company-web`, `terraform`, `delivery`, `edu-api-image` |
| Security | `.github/workflows/security.yml` | Trivy repository scan, weekly and on push |
| Website | `.github/workflows/deploy-company-web.yml` | Build, test, S3 sync, CloudFront invalidation |
| Production | `.github/workflows/deploy-production.yml` | Runs after green CI on `main`: release plan, image builds and scans, chart push, release |
| Release plan | `devops/scripts/release-plan.sh` | Rebuilds only images whose `services.yaml` inputs changed |
| Release | `devops/kubernetes/scripts/deploy.sh` over Systems Manager | `helm upgrade --rollback-on-failure --wait`, host checks, automatic rollback |
| Verify | `devops/scripts/smoke-test.sh` | Public checks; a failure rolls the release back |

`.github/workflows/deploy.yml` is a stale preflight due for removal or retargeting.

## What a push to `main` does

| Changed | Effect |
| --- | --- |
| A service's inputs | That image is rebuilt, scanned, and rolled out |
| Lockfile, root `package.json`, `tsconfig.json`, Dockerfile | Every Node image is rebuilt |
| Chart, node scripts, `services.yaml` | Deploy without builds |
| `devops/keycloak/configure-realm.sh` | Production realm re-applied |
| A migration | Runs before new pods; must suit the running image |
| `frontend/company-web` | Website only |
| Terraform | Nothing; applied by hand after "yes apply" |
| Docs only | CI only |

## Steps for a pipeline change

1. Put the logic in a bash script under `devops/scripts/` or `devops/kubernetes/scripts/`: `set -euo pipefail`, idempotent, `shellcheck`-clean, no secrets in output. The workflow only calls it.
2. Mark new scripts executable in Git: `git update-index --chmod=+x <file>`.
3. Pin every action, tool, and image by version and SHA-256 or digest. No `latest`.
4. Use GitHub OIDC roles for AWS; never add long-lived keys as repository secrets.
5. Add or update a test (for example `devops/scripts/release-plan.test.sh`).
6. Check:

   ```bash
   bash devops/scripts/check-delivery.sh
   ```

   It checks executable bits, ShellCheck, release-planner tests, `helm lint`, `kubeconform`, and Terraform format. Chart, node-script, or realm changes also need `bash devops/kubernetes/scripts/rehearse-local.sh`.

## Actions minutes are limited

The owner runs on GitHub's free Actions allowance. Keep pushes few and meaningful (batch documentation commits), never add jobs that run on every push without need, and keep the `scope` gate working when you add a job: heavy jobs get `needs: scope` and `if: needs.scope.outputs.code == 'true'`. If jobs fail with "The job was not started because recent account payments have failed or your spending limit needs to be increased", nothing ran: tell the owner; it is a billing state, not a code failure.

## Watching a run

`gh run list --branch main --limit 5` (check the result of **every** workflow for the newest commit, not just the first line), `gh run view <id> --log-failed`, and `oxctl watch` for the release. Never weaken a gate (tests, Trivy, drift check) to make a run pass.
