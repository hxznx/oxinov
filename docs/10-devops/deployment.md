# Deployment architecture

**Updated:** 2026-09-26 (ADR-017, ADR-018, ADR-021). Runbook: [devops/kubernetes/README.md](../../devops/kubernetes/README.md). Pipeline: [CI/CD](ci-cd.md). Rollback: [ROLLBACK.md](rollback.md). Current facts: [CURRENT-STATE.md](../04-architecture/current-state.md).

## Today: one k3s node, deployed on every green `main`

| Part | How it works |
| --- | --- |
| Server | EC2 `t3a.medium` in Mumbai (`devops/terraform/environments/production/starter`), encrypted gp3 disk, Elastic IP, security group open on 80/443 only, no SSH (Systems Manager), IMDSv2 |
| Kubernetes | k3s with Traefik (HTTP to HTTPS, Let's Encrypt), local-path storage, network policies, and encrypted Secrets; installed and converged by `devops/kubernetes/scripts/bootstrap-node.sh` before every release |
| Services | The eight services in [`services.yaml`](../08-engineering/service-catalog.md), packaged by the shared Helm chart `devops/kubernetes/helm/oxinov` (`values-production.yaml` sizes it for 4 GiB) |
| Data | PostgreSQL StatefulSet on the encrypted disk; files in private S3; nightly dump to S3 and daily disk snapshots |
| Website | `oxinov.com` is a static export in S3 behind CloudFront, deployed by `deploy-company-web.yml` (`production/edge` stack) |
| Images | Built by GitHub Actions, scanned with Trivy, pushed to ECR with immutable commit-SHA tags; the chart is published to ECR as an OCI artifact |
| Access | GitHub Actions assumes a deploy role through OIDC and runs the deploy script on the node through Systems Manager |

A release: CI passes on `main` → `release-plan.sh` picks changed images → build, scan, push → `deploy.sh` on the node: bootstrap check, `helm upgrade --rollback-on-failure --wait` with the `migrate` hook first → public checks through Traefik → smoke test from GitHub → automatic rollback on any failure (NFR-17).

## At scale: Amazon EKS

When a trigger in the [DevOps roadmap](devops-roadmap.md) is met, the same images, chart, and scripts move to Amazon EKS across two Availability Zones with RDS for PostgreSQL, a load balancer, CloudFront and AWS WAF in front of the apps, private subnets, and GitOps (Argo CD). Staging and preview environments arrive earlier, in roadmap Phase 4. Terraform owns all of it; a reviewed saved plan and the owner's "yes apply" precede every production change.

## Local and rehearsal

Docker Compose is the developer entry point ([local setup](dev-setup.md)). Delivery changes are rehearsed with `bash devops/scripts/check-delivery.sh` and, for the chart or node scripts, `bash devops/kubernetes/scripts/rehearse-local.sh`, a throwaway local k3s with the production versions (install, routes, realm, and a forced rollback).

## Monitoring and security operations

Production uses CloudWatch alarms, Kubernetes health checks, and the release smoke test; the Prometheus and Grafana configuration runs locally until OpenTelemetry arrives (ADR-021, [observability](observability.md)). The SOC pipeline stays separate from operational monitoring; its first production steps are a CloudTrail trail and GuardDuty ([security roadmap](../09-security/security-baseline.md#roadmap)).

## Known stale item

`.github/workflows/deploy.yml` ("Deployment preflight (deployment not configured)", `environment: staging`) predates the production pipeline; it is due for removal or retargeting.
