---
name: oxinov-rds
description: Plan, provision, migrate to, and operate Amazon RDS for PostgreSQL at Oxinov - when to leave the in-cluster PostgreSQL (the roadmap triggers and cost), engine and version, Single-AZ versus Multi-AZ versus Multi-AZ DB cluster, read replicas and lag, private DB subnets and security groups, database roles and credentials, TLS and KMS, automated backups, PITR, snapshots and restore tests, RPO and RTO, RDS Proxy and connection budgets, parameter groups, monitoring and Database Insights, maintenance and upgrades, Terraform with deletion safeguards, the cutover runbook, incidents, and cost. Use when a task mentions RDS, managed PostgreSQL, database high availability, point-in-time recovery, or moving the database off the node.
---

# Amazon RDS for PostgreSQL at Oxinov

Act as a senior AWS database platform engineer for Ox Inov Pvt. Ltd. RDS is critical stateful infrastructure connecting application, network, identity, secrets, storage, backups, monitoring, and recovery. "Managed" does not mean maintenance-free: AWS runs the hardware, patching mechanics, backups, and failover; Oxinov still owns schema, queries, users, permissions, network, connection behavior, backup policy, recovery, capacity, and cost.

Related skills: oxinov-database-architecture (schema, integrity, queries, migrations), oxinov-database, oxinov-devops-architecture, oxinov-terraform, oxinov-aws, oxinov-scaling, oxinov-secrets-and-crypto, oxinov-keycloak, oxinov-server. Sources: [scalability strategy](../../../docs/04-architecture/scalability.md) (step 3), [DevOps roadmap](../../../docs/10-devops/devops-roadmap.md) (Phase 5), [cloud architecture](../../../docs/04-architecture/cloud-architecture.md), [cost optimization](../../../docs/10-devops/cost-optimization.md), [backup and recovery](../../../docs/10-devops/backup-recovery.md), [database design](../../../docs/05-data/database-design.md), [NFR](../../../docs/03-requirements/nfr.md) (NFR-05, NFR-18). Decisions: ADR-001, ADR-017, ADR-018, ADR-021.

**When uncertain, prioritize:** data integrity, security, recoverability, correctness, availability, simplicity, observability, maintainability, performance, scalability, cost. Never trade integrity or recoverability for cost, and never remove backups to save money.

**Check current AWS documentation** before any version-sensitive statement: engine versions available in `ap-south-1`, instance classes, Multi-AZ DB cluster support, RDS Proxy features, Database Insights modes and pricing, IAM authentication limits, Blue/Green support, and the Terraform AWS provider's resource fields (the stacks pin the provider version in `versions.tf`).

## 1. Today: Oxinov does not use RDS

| Item | Now |
| --- | --- |
| Engine | PostgreSQL 18.6 (`postgres:18.6-alpine`, pinned by digest) as a StatefulSet in k3s, on the node's encrypted EBS disk |
| Databases | `oxinov_lms` (Edu; renamed `oxinov_edu` at the ADR-027 cutover), `oxinov_platform`, `keycloak`, on one instance |
| Roles | Owner `oxinov` (migrations), `oxinov_app`, `oxinov_platform_app` (request roles that cannot bypass row-level security), `keycloak` |
| Extensions | None (`gen_random_uuid()` is built in) |
| Backups | Nightly `pg_dumpall` to S3 (30 days) and daily disk snapshots (7 days); no point-in-time recovery; objectives RPO 24 hours and RTO 4 hours (proposed, NFR-05) |
| Availability | One node in one Availability Zone; no standby (ADR-017) |
| Network | One VPC `10.40.0.0/16` with one public subnet; the database has no route from the internet (cluster-internal Service only) |
| Chart switch | `postgres.enabled: true` and `postgres.host: postgres` in `values.yaml`; the comment says to set `enabled: false` and point `host` at RDS when the roadmap says so. With it off, the in-cluster `backup` job also turns off |

Do not describe RDS as live, and do not create it early: it is scalability step 3.

## 2. When to move (roadmap Phase 5 triggers)

Move only when a trigger is true and the owner approves the cost:

- a paying school needs an availability commitment;
- the node stays above 70% CPU or memory at peak for two weeks (first try the bigger-node step);
- restores take longer than 30 minutes, or the data outgrows nightly dumps;
- more than one region or product needs isolation.

The roadmap estimates managed data at about **US$60-120 a month extra**, against a total budget of US$50 today. Verify current pricing for the chosen class, storage, backups, Multi-AZ, and Proxy before presenting a plan.

## 3. Architecture decision (answer before provisioning)

Engine and why (PostgreSQL, ADR-001: RLS, constraints, JSON, full-text; no reason to change); exact major version available in `ap-south-1` (match 18 or plan an upgrade); workload and size; growth; peak connections; read/write ratio; RPO and RTO; Multi-AZ or not; replicas; cross-region copies (the cloud architecture names Hyderabad for encrypted backup copies); RDS Proxy; authentication and secrets; VPC, subnets, and security groups; encryption keys; backup retention; monitoring; migration method; deletion safeguards; monthly cost.

| Model | Use at Oxinov |
| --- | --- |
| Single-AZ instance | First move when the trigger is restore time or capacity, not availability; cheapest; still gains automated backups and PITR |
| Multi-AZ DB instance | When an availability commitment is signed; the standby is for failover only, not reads |
| Multi-AZ DB cluster (writer plus two readable standbys) | Only for a stronger availability or read-capacity need; verify engine, version, and Region support first |
| Read replicas | Only for measured read load (reports, analytics); mind replication lag; read your own writes from the writer |

Multi-AZ is availability, not backup: corruption replicates. One RDS instance serves the three databases at first; a product or tenant gets its own instance only through the isolation-tier decision (ADR-019), never one instance per customer by default.

## 4. Network

- A DB subnet group of **private** subnets in at least two Availability Zones (needed even for Single-AZ). Today there is only one public subnet, so this is a Terraform network change.
- `publicly_accessible = false`, always.
- Security group: PostgreSQL 5432 inbound **only from the node's security group** (later the EKS node or pod groups), never `0.0.0.0/0`, never a developer's home IP.
- The node reaches RDS privately inside the VPC. Administrative access goes through the node with `oxctl shell` (Systems Manager); no bastion, no public endpoint.
- Keep the node and RDS in the same Region; place them to avoid cross-AZ chatter where possible.

## 5. Identity, credentials, and encryption

- Three layers stay separate: AWS IAM controls the RDS resource; database roles control connections; the product APIs control business authorization.
- The RDS master user is for administration only; create the same roles as today (`oxinov` owner for migrations, `oxinov_app`, `oxinov_platform_app`, `keycloak`) with the same grants. `rds_superuser` is not a true superuser, but the request roles must still not own tables and must not bypass RLS; re-run the policy tests after the move.
- Credentials: generated by the owner or by RDS-managed secrets, stored in Parameter Store (today's mechanism) or Secrets Manager if rotation is needed, rendered into the `oxinov-app` Secret; never in Git, images, values files, Terraform source, or CI logs. Terraform state can still contain sensitive values: keep the state bucket restricted.
- IAM database authentication is optional; evaluate its connection-rate limits before using it for request traffic.
- TLS required (`rds.force_ssl`) with certificate verification in the connection string; never disable verification to make a connection work.
- Storage encryption with KMS on creation (it cannot be added later); a customer-managed key only if governance needs it, with a protected key policy and deletion window. Snapshots and replicas inherit encryption.

## 6. Backup, PITR, and recovery

- Automated backups with a retention that covers the RPO and the investigation window (at least 7 days; match the 30 days of today's dumps if the owner wants parity); PITR within that window restores to a **new** instance, so plan the cutover of `postgres.host`.
- Manual snapshots before major migrations, engine upgrades, and risky releases, with their own retention; cross-region snapshot copies to Hyderabad when DR requires it.
- `deletion_protection = true`, a final snapshot on deletion (never `skip_final_snapshot = true` for production), and `prevent_destroy` on the Terraform resource.
- Restore runbook: pick the recovery point → restore to a new instance → apply subnet group, security group, parameter group, and encryption settings → validate schema, data, RLS policies, and row counts → switch the chart's `postgres.host` → smoke test → resume. Restores need the owner's approval.
- A backup counts only after a restore test; measure the real RTO quarterly (NFR-05).

## 7. Connections and RDS Proxy

- Budget connections: pods × Prisma pool size (default about `2 × CPU + 1` per pod, not configured today) + migrations + Keycloak's pool + backups + administration, below `max_connections` (which depends on the instance memory) with headroom. Set `connection_limit` in each `DATABASE_URL` when replicas grow.
- Clients connect by the RDS DNS endpoint, reconnect after failover, and never cache IPs.
- RDS Proxy only when connection counts are large or spiky (many pods, EKS, serverless). Verify how it handles the transaction-local `set_config(..., true)` that `DatabaseContext` uses for row-level security (session pinning), and test RLS through the proxy before relying on it. The proxy is not authorization.
- Timeouts: connection, pool acquisition, and statement timeouts; bounded retries with backoff for transient errors (failover, network), never blind retries of non-idempotent business operations (use the idempotency rules in oxinov-backend-architecture).

## 8. Configuration, monitoring, and maintenance

- Parameter group managed in Terraform: `rds.force_ssl=1`, `log_min_duration_statement` for slow queries, `pg_stat_statements` if query analysis is needed (check RDS support), autovacuum left on; know which parameters need a reboot.
- Storage: gp3 sized for growth plus maintenance headroom, storage autoscaling with a maximum, alarms before the limit.
- Instance class: measure CPU, memory, connections, and working set; burstable classes (t4g) only while load is low and credits are watched.
- Monitoring: CloudWatch (`CPUUtilization`, `DatabaseConnections`, `FreeStorageSpace`, `FreeableMemory`, read and write latency, IOPS, `ReplicaLag`), Database Insights for load and top SQL (check mode and cost), logs exported to CloudWatch Logs with a retention period, RDS events to the existing SNS alert path. Alarms: storage low, connections near the limit, sustained CPU, replica lag, failover, backup failure.
- Maintenance window at the lowest-traffic time for Nepal and South Asia; minor-version auto-upgrade decided deliberately (security fixes versus validation); major upgrades rehearsed on a restored copy with a snapshot first, Blue/Green where supported.
- Tag with the existing default tags (`Project`, `Environment`, `Stack`, `ManagedBy = terraform`) plus a data classification once one is defined; names like `oxinov-production-postgres`.
- CloudTrail records API actions on RDS (who changed or deleted what); it does not audit SQL. Confirm a trail exists (see oxinov-devops-architecture).

## 9. Terraform ownership

Terraform (`production/starter`, or a new `production/data` stack) owns the DB subnet group, security group, parameter group, KMS key if any, the instance, backup settings, alarms, and Proxy. Migrations and seeds stay with Prisma and the Helm `migrate` job; Terraform never manages tables. Flow: `fmt` → `validate` → saved `plan` with the monthly cost → the owner's "yes apply". Keep application CI and infrastructure changes separate.

## 10. Migration runbook from the in-cluster database

1. **Decide** the trigger, model, class, version, and cost; write an ADR superseding the relevant part of ADR-017.
2. **Build** the network (private DB subnets in two AZs), security group, parameter group, and instance through Terraform; enable backups and deletion protection.
3. **Prepare** roles and grants on RDS matching today's; store credentials in Parameter Store.
4. **Rehearse** on a copy: restore the latest `pg_dumpall` (or per-database `pg_dump`) into a test RDS instance; run migrations (`prisma migrate deploy` must report nothing pending), `db:test-policies`, the integration tests against it, Keycloak startup, and measure the dump and restore time.
5. **Validate** row counts per table, key aggregates, constraints, sequences, RLS policies, encodings, and time zones.
6. **Cut over** in a maintenance window approved by the owner: `oxctl backup`; stop writers (scale `edu-api`, `platform-api`, and `keycloak` to 0; sign-in is down during the window); dump and restore; validate; set `postgres.enabled: false` and `postgres.host` to the RDS endpoint and the new database URLs in Parameter Store; release; `oxctl smoke`; sign in and check a learner's data.
7. **Rollback** within the window: point `postgres.host` back and scale the StatefulSet up (the old volume is untouched until the owner approves its removal).
8. **Afterwards**: keep the old volume and the last dumps until the owner approves deletion; update current state, backup and recovery, cost optimization, the runbooks, and the changelog.

For large databases or small downtime budgets, logical replication or AWS DMS can shorten the window; decide that in the ADR.

## 11. Incidents

Diagnose before restarting: RDS events and status, the application's errors, connections versus the limit, locks and long transactions (`pg_stat_activity`, `pg_locks`), top SQL, storage, replica lag. Connection exhaustion: find leaks, pool sizes, and replica counts before raising limits. High CPU: top SQL and plans before resizing. Storage: growth source and autoscaling maximum. Unavailable: failover state, security groups, DNS, credentials, Proxy. Record every action with UTC times.

## 12. Never

Expose RDS publicly or to `0.0.0.0/0`; connect applications as the master user; put credentials in code, images, values, Terraform source, or frontends; commit Terraform state; delete a production instance or snapshot casually; disable backups, encryption, TLS verification, or deletion protection; treat Multi-AZ as a backup or replicas as lag-free; ignore connection limits; hardcode IPs; use schema auto-sync; run a destructive migration without analysis; skip restore tests; create RDS before its trigger and the owner's approval.

## Reference target (not today)

```text
Users → Route 53 → CloudFront/ALB → EKS (private subnets, 2+ AZs) → app pods
      → RDS Proxy (if justified) → RDS PostgreSQL Multi-AZ (private DB subnets, KMS, TLS)
      → automated backups + PITR, snapshot copies to Hyderabad
Operations: Terraform · CI/CD · CloudWatch · Database Insights · alarms to SNS · restore runbooks
```

Use it as the destination for the scale-out steps, never as a starting point.
