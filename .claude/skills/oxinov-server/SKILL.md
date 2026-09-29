---
name: oxinov-server
description: Operate the Oxinov production server - the single k3s node, oxctl commands for status, logs, deploy, rollback, backups, and cost, Systems Manager access, capacity checks, and incident handling. Use when checking production, investigating a problem, or when something is down.
---

# Operating the Oxinov server

Plan larger or cross-cutting infrastructure changes first with the oxinov-devops-architecture skill (tool ownership, today's production against the reference architecture, and the production safety rules).

Rules: [DevOps rules](../../../docs/14-ai-knowledge/devops-rules.md), [AGENTS.md](../../../AGENTS.md) section 9. Sources: [production runbook](../../../devops/kubernetes/README.md), [backup and recovery](../../../docs/10-devops/backup-recovery.md), [rollback](../../../docs/10-devops/rollback.md), [observability](../../../docs/10-devops/observability.md).

## The server

One EC2 `t3a.medium` (2 vCPU, 4 GiB plus 2 GiB swap) in Mumbai, running k3s. No SSH and no inbound ports except 80 and 443. The stack uses about 3 GiB of the 4 GiB. Public hosts: `edu.oxinov.com`, `app.oxinov.com`, `id.oxinov.com`.

## `oxctl` (`devops/scripts/oxctl`)

Needs the AWS CLI signed in by the owner (`aws sso login`), the Session Manager plugin, the GitHub CLI, and `jq` or Python 3.

| Need | Command | Changes production? |
| --- | --- | --- |
| What runs, memory, disk, backups | `oxctl status`, `oxctl release`, `oxctl history` | No |
| Logs and warnings | `oxctl logs <service> [lines]`, `oxctl events` | No |
| Public checks | `oxctl smoke` | No |
| Follow a release | `oxctl watch` | No |
| Services | `oxctl services` | No |
| Cost and infrastructure | `oxctl cost`, `oxctl plan` | No |
| Shell on the node | `oxctl shell` | Possibly; only for approved runbook steps |
| Keycloak admin console | `oxctl keycloak-admin` (tunnel to the `keycloak` Service; stop any local Keycloak on port 8080 first) | Possibly |
| Deploy | `oxctl deploy [--all] [--realm]` | Yes; only when asked |
| Roll back | `oxctl rollback` | Yes |
| Backups | `oxctl backup`, `oxctl backups` | `backup` writes a new dump |

## Checking health

1. `oxctl status`: every workload ready, memory and disk headroom, latest backup age.
2. `oxctl events` and `oxctl logs <service>` for anything not ready.
3. `oxctl smoke` for the public view.

## Incident steps

1. **Stabilize.** If the last release caused it, `oxctl rollback` (migrations are backward compatible by design). Do not fix forward under pressure.
2. **Diagnose** with status, events, logs, and CloudWatch alarms. Record times in UTC.
3. **Tell the owner** what users see, what you did, and what comes next. Do not guess root causes.
4. **Fix** through the normal pipeline, with a test that would have caught it.
5. **Record** it in the [changelog](../../../docs/11-planning/changelog.md), and in `security/soc/incidents/` for security events.

## Needs the owner's approval

Restoring data (it overwrites data), deleting anything, scaling up or adding nodes, and any runbook step marked for approval (for example the [ADR-027 cutover](../../../docs/10-devops/runbooks/edu-rename-cutover.md)).

## Known limits

Single node: a host failure means minutes of downtime, and a restore can lose up to 24 hours of data (ADR-017). SES is in sandbox until AWS approves production access, so codes reach only verified addresses.
