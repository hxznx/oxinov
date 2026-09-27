# Database design

**Updated:** 2026-09-26 (ADR-001, ADR-006, ADR-021). Entities: [data model](data-model.md).

## Today

- **PostgreSQL 18** is the system of record. In production it runs as a StatefulSet on the node's encrypted disk (ADR-018); locally and in CI it runs in Docker. Amazon RDS replaces it at scale-out with the same migrations.
- **One database per plane:** `oxinov_platform` and the Edu database `oxinov_lms` (renamed `oxinov_edu` at the ADR-027 cutover), each with an owner role for migrations and a request role for the application. The request role never bypasses row-level security.
- **Tenant isolation:** shared tables with `tenant_id`, tenant-scoped keys and indexes, API membership checks, and row-level security. Tenant context is set transaction-locally (`set_config(..., true)` in `database-context.service.ts`), so it cannot leak across pooled connections; integration tests cover allowed and denied paths with two tenants.
- **Migrations:** Prisma 7 migrations, reviewed SQL, applied once per release by the `migrate` Helm hook before new code starts; CI applies them to a fresh database and fails on schema drift.
- **Search:** PostgreSQL (catalogue search) until scale or analytics needs OpenSearch.
- **Files are not in the database:** media and resources are in private S3; the database stores keys, sizes, types, and ownership (ADR-021).
- **No cache or queue store yet** (ADR-021); PostgreSQL remains the source of truth when one is added.

## Backup and recovery

| Measure | Retention | Recovery point |
| --- | --- | --- |
| Nightly `pg_dumpall` CronJob to the private backups bucket | 30 days | Up to 24 hours |
| Daily encrypted EBS snapshots | 7 days | Up to 24 hours |

Recovery time target is 4 hours (NFR-05). Restore steps are in the production runbook; a restore is rehearsed quarterly.

## Performance rules

- Index every foreign key and every column used in a tenant-scoped filter or sort, with `tenant_id` first.
- Paginate every list (cursor or keyset for large tables); never load unbounded lists.
- Avoid N+1 queries: use Prisma `include`/`select` deliberately and review query counts in integration tests for hot paths.
- Keep transactions short; no network calls inside a transaction.
- Use `EXPLAIN (ANALYZE, BUFFERS)` before adding an index in production; enable `pg_stat_statements` when production metrics arrive.
- Money in integer minor units; timestamps in UTC (`timestamptz`).

## Later

Dedicated PostgreSQL per tenant or regulated product (ADR-019 step 7), read replicas, and connection pooling (PgBouncer or RDS Proxy) are added only for a measured need, each with an ADR.
