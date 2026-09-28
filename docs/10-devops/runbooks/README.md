# Runbooks

Step-by-step procedures for planned production changes. Each one states its downtime, its approvals, how to verify it, and how to roll it back. Day-to-day operation (deploy, logs, backups, rollback) is in the [production runbook](../../../devops/kubernetes/README.md), and security incidents follow the [SOC runbooks](../../../security/soc/runbooks/README.md).

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

| Runbook | When |
| --- | --- |
| [Edu rename cutover](edu-rename-cutover.md) | Renaming the last three `lms` production identifiers to `edu` (ADR-027) |
