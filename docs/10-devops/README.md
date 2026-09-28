# 10 · DevOps

How code reaches production and how production is operated. Every push to `main` that passes CI deploys automatically (ADR-018), so read the relevant page before changing delivery. Day-to-day commands and the server procedure are in the [production runbook](../../devops/kubernetes/README.md).

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

| Document | Purpose |
| --- | --- |
| [Developer setup](dev-setup.md) | Run the stack locally |
| [Environments](environments.md) | Local, CI, and production, and why there is no staging yet |
| [CI/CD](ci-cd.md) | The pipeline from push to verified release |
| [Deployment](deployment.md) | How a release is built, rolled out, and verified |
| [Rollback](rollback.md) | Returning to the previous release |
| [Backup and recovery](backup-recovery.md) | Nightly dumps, disk snapshots, and restores |
| [Observability](observability.md) | Metrics, logs, probes, and alarms |
| [Cost optimization](cost-optimization.md) | The US$50 monthly budget and every resource's cost |
| [DevOps roadmap](devops-roadmap.md) | Phases and the triggers for scaling out |
| [Runbooks](runbooks/README.md) | Step-by-step procedures for planned production changes |
