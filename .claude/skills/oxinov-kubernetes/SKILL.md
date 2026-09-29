---
name: oxinov-kubernetes
description: Change Oxinov's Kubernetes deployment - the shared Helm chart, workloads, probes, resources and the memory budget, network policies, secrets references, ingress, and priority classes on the single k3s node. Use for any change under devops/kubernetes or to a service's runtime settings.
---

# Oxinov Kubernetes (k3s and the shared Helm chart)

Public hosts, TLS, replicas, disruption budgets, autoscaling, and troubleshooting unreachable apps are in the oxinov-ingress-tls skill. Plan larger or cross-cutting infrastructure changes first with the oxinov-devops-architecture skill (tool ownership, today's production against the reference architecture, and the production safety rules).

Rules: [DevOps rules](../../../docs/14-ai-knowledge/devops-rules.md), [AGENTS.md](../../../AGENTS.md) section 8. Source: [production runbook](../../../devops/kubernetes/README.md). Decisions: ADR-017, ADR-018, ADR-019, ADR-022.

## The setup

- One EC2 node running k3s with Traefik and Let's Encrypt; namespace `oxinov`; one Helm release `oxinov`.
- Chart: `devops/kubernetes/helm/oxinov` - `values.yaml` (defaults), `values-production.yaml` (one replica each), `templates/workloads.yaml` (the services), `templates/platform.yaml` (PostgreSQL, migrate, backup), `templates/priority.yaml`, `_helpers.tpl`.
- Scripts: `devops/kubernetes/scripts/deploy.sh` (release), `bootstrap-node.sh` (node setup), `rehearse-local.sh` (throwaway local k3s).

## Every workload must have

| Concern | Setting |
| --- | --- |
| Identity | uid/gid 1000 (PostgreSQL 70), `runAsNonRoot`, no privilege escalation, all capabilities dropped, `RuntimeDefault` seccomp |
| Filesystem | Read-only root; writable paths only as `emptyDir` listed in `writablePaths` |
| Resources | Measured requests and a memory limit; production requests fit `memoryBudgetMi` (3,300 MiB), checked in CI |
| Priority | `critical`, `core`, or `growth`, which decides what the node keeps under memory pressure (ADR-022) |
| Probes | Startup, liveness, readiness on `/health/live` and `/health/ready` (TCP for non-HTTP) |
| Network | Deny-by-default ingress; callers listed in `allowFrom`; instance metadata only for `edu-api`, `mail-relay`, `backup` |
| Exposure | Only web apps and Keycloak get a public host through the Ingress; APIs never do |
| Secrets | Environment references to the `oxinov-app` Secret; never in values files |

## Steps

1. Change the chart values or templates; do not add one-off manifests.
2. If a service is added or renamed, change `services.yaml` first and run `python scripts/service_catalog.py`.
3. Measure memory with `oxctl status` before raising requests; state the new total against the budget.
4. Check:

   ```bash
   bash devops/scripts/check-delivery.sh
   bash devops/kubernetes/scripts/rehearse-local.sh
   ```

   The rehearsal installs the chart on a throwaway local k3s with production versions and checks migrations, routes, the realm, and a forced rollback. Set `REHEARSAL_NAME` and `REHEARSAL_HTTPS_PORT` if another session may be rehearsing; two clusters do not fit in 8 GB of memory.
5. Push only when asked. A chart change deploys without an image build; `deploy.sh` runs `helm upgrade --rollback-on-failure --wait` and the smoke test.

## Never

- `kubectl edit`, `kubectl apply`, or `helm upgrade` by hand against production outside `oxctl` and the pipeline, except the steps of an approved runbook.
- Add a second replica, a new node, or a managed service without the owner's approval and a stated cost.
