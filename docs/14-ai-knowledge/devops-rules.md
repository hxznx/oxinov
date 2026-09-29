# DevOps rules

The rules for delivery, infrastructure, Kubernetes, and the production server, in short form. Read them before you change a workflow, a script, the chart, Terraform, or anything on the node.

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

Source: [AGENTS.md](../../AGENTS.md) sections 3, 7, 8, and 9, [CI/CD](../10-devops/ci-cd.md), [deployment](../10-devops/deployment.md), [rollback](../10-devops/rollback.md), [backup and recovery](../10-devops/backup-recovery.md), [cost optimization](../10-devops/cost-optimization.md), and the [production runbook](../../devops/kubernetes/README.md). Decisions: ADR-017, ADR-018, ADR-019, ADR-021.

## Delivery

- Every push to `main` that passes CI deploys to production. Keep `main` releasable, and push only when the person asked.
- Every repeatable stage is a tested bash script in `devops/scripts/` or `devops/kubernetes/scripts/`; workflow YAML only wires scripts together.
- Build once: one immutable image per commit SHA moves through every step. No `latest` tags; pin base images, tools, and charts.
- Rehearse delivery changes with `bash devops/scripts/check-delivery.sh`, and chart, node-script, or realm changes also with `bash devops/kubernetes/scripts/rehearse-local.sh`.
- Register services once in `services.yaml`, then run `python scripts/service_catalog.py`.

## Infrastructure

- Terraform owns every AWS resource. Never create, change, or delete AWS resources in the console or with ad-hoc CLI writes.
- Run `fmt`, `validate`, and a saved `plan`; show the plan with its monthly cost; apply only after the owner's "yes apply" for that plan.
- An emergency console change is imported into Terraform the same day.

## Kubernetes

- Every workload in `devops/kubernetes/helm/oxinov` runs as non-root, with a read-only root, dropped capabilities, realistic requests and a memory limit, three probes, and deny-by-default ingress.
- Production memory requests must fit the budget checked in CI (`memoryBudgetMi`, 3,300 MiB).
- Secrets come from the `oxinov-app` Secret as environment references, never from values files.

## The server

- Configuration is code: never change the node by hand without writing the change into the scripts or Terraform.
- Use `oxctl` for status, logs, deploys, rollbacks, and backups.
- In an incident, stabilize first (`oxctl rollback`), then diagnose, communicate, fix through the pipeline, and record.

## Cost

- All of AWS stays within US$50 a month (NFR-18). State the monthly cost of any new resource; no always-on spend without a roadmap trigger and the owner's approval.

Skills: [oxinov-devops-architecture](../../.claude/skills/oxinov-devops-architecture/SKILL.md), [oxinov-cicd](../../.claude/skills/oxinov-cicd/SKILL.md), [oxinov-docker](../../.claude/skills/oxinov-docker/SKILL.md), [oxinov-kubernetes](../../.claude/skills/oxinov-kubernetes/SKILL.md), [oxinov-terraform](../../.claude/skills/oxinov-terraform/SKILL.md), [oxinov-aws](../../.claude/skills/oxinov-aws/SKILL.md), [oxinov-ansible](../../.claude/skills/oxinov-ansible/SKILL.md), [oxinov-server](../../.claude/skills/oxinov-server/SKILL.md), [oxinov-observability](../../.claude/skills/oxinov-observability/SKILL.md), [oxinov-scaling](../../.claude/skills/oxinov-scaling/SKILL.md), [oxinov-rds](../../.claude/skills/oxinov-rds/SKILL.md).
