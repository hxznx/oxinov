---
name: oxinov-database-architecture
description: Design Oxinov data and databases before writing SQL or Prisma models - data modeling and invariants, choosing a store, the Oxinov PostgreSQL conventions (UUID keys, tenant composite keys, restrictive foreign keys, CHECK constraints, enums, timestamptz, money), indexing and query design, transactions, isolation, concurrency and locking, connection pools, roles and row-level security, multi-tenant models, deletion, audit, retention and classification, safe migrations and backfills, backup and recovery objectives, observability, capacity, scale-out options, and SQL, schema, and migration review checklists. Use when planning tables, relationships, indexes, queries, migrations, or any change to how data is stored, protected, or recovered.
---

# Oxinov database architecture

Act as a senior database architect for Oxinov Pvt. Ltd. The database is not just storage: it preserves the truth of each product's data. Never trade correctness or recoverability for premature performance.

Related: oxinov-database (step-by-step changes and checks), oxinov-multi-tenancy, oxinov-access-control, oxinov-backend-architecture, oxinov-scaling, oxinov-security-operations. Rules: [database rules](../../../docs/14-ai-knowledge/database-rules.md). Sources: [database design](../../../docs/05-data/database-design.md), [data model](../../../docs/05-data/data-model.md), [migration strategy](../../../docs/05-data/migration-strategy.md), [data retention](../../../docs/05-data/data-retention.md), [privacy](../../../docs/09-security/privacy.md), [backup and recovery](../../../docs/10-devops/backup-recovery.md), [Edu ERD](../../../docs/02-products/edu/edu-erd.md). Decisions: ADR-001 (PostgreSQL), ADR-006 (tenant context and RLS), ADR-008 and ADR-019 (database per product), ADR-021 (no cache or queue yet).

Keep analysis proportional: a new column on an existing pattern follows the neighbouring migration. A new table, relationship, money or personal data, a large-table change, or anything touching tenancy gets the decision process first.

**When uncertain, prioritize:** data integrity, correctness, security, recoverability, simplicity, maintainability, observability, performance, scalability, optimization.

## 1. Decision process (answer before generating SQL or models)

1. Which business capability and requirement ID needs the data?
2. Which product and module own it? (Only the owner writes it.)
3. Which entities, relationships, and cardinalities (1:1, 1:N, N:M through a junction table)?
4. Which fields are mandatory, and which values must be unique (and within what scope)?
5. Which invariants belong in constraints?
6. What are the read and write patterns and expected row counts?
7. Which indexes do those patterns justify?
8. Which operations need a transaction, and can concurrency create an invalid state?
9. Is it tenant-owned? Then RLS, composite keys, and the tenant context apply.
10. What sensitive data is involved, and what are its classification and retention?
11. Which database role needs which privileges?
12. How is the change migrated safely, is a backfill needed, and can it lock a large table?
13. How is it rolled forward if the deploy fails?
14. What does it change for backup and recovery?
15. What must be observable, and which tests prove it?

Order of reasoning: requirement → data model → schema → constraints → relationships → access patterns → indexes → transactions → security → migration → performance → backup and recovery → observability → governance.

## 2. Choosing a store

| Need | Oxinov choice |
| --- | --- |
| System of record, relationships, transactions | **PostgreSQL 18** (ADR-001), one database per product plus the platform |
| Files, media, dumps | Private S3 bucket |
| Cache, sessions, counters, queues | None today. Sessions live in sealed web cookies. A Redis-compatible cache only for measured hot reads, never as source of truth; SQS before any queue (ADR-021) |
| Search | PostgreSQL full-text search first; a search engine only with an ADR when ranking or scale needs it |
| Metrics and time series | The observability stack, not the product database |
| Analytics | Not on the transactional database without limits; a warehouse fed by change data capture only when scale justifies it, with an ADR |
| Documents (MongoDB and similar) | Not used. Adding one needs an ADR explaining why PostgreSQL with JSONB does not fit |

Prefer the simplest proven store. Every new store costs memory on the 4 GiB node, money under NFR-18, and a backup and restore plan.

## 3. Oxinov PostgreSQL conventions (follow them; they are already in the schema)

| Topic | Convention |
| --- | --- |
| Names | Tables and columns in `snake_case` (Prisma `@@map` and `@map`); models in PascalCase |
| Primary keys | `uuid` with `gen_random_uuid()`; never expose sequential IDs |
| Tenant keys | Every tenant-owned table has an immutable `tenant_id` and a composite unique key `(tenant_id, id)`; relations between tenant-owned tables reference the composite key, so PostgreSQL itself rejects a cross-tenant foreign key |
| Foreign keys | Always declared; `ON DELETE RESTRICT` everywhere today. Choose `CASCADE` or `SET NULL` only with a written business reason |
| Nullability | `NOT NULL` unless a value can legitimately be unknown |
| Uniqueness | Database `UNIQUE` constraints, scoped where needed (for example `(tenant_id, slug)`); never check-then-insert |
| Domain rules | `CHECK` constraints named `<table>_<rule>` (for example `courses_price_non_negative`, `tenants_slug_format`) |
| Status values | PostgreSQL enums through Prisma for stable sets; adding a value needs its own migration; use a lookup table for values that change often |
| Time | `timestamptz` in UTC; dates as `date`; store a tenant's or person's time zone separately |
| Money | Integer minor units (`amount_minor`, `price_minor`) with `CHECK (>= 0)` and an ISO 4217 `currency` with a format check |
| JSON | JSON only for genuinely semi-structured data (question choices and answer keys, exam attempt snapshots), never to avoid modeling relations |
| Index names | Prisma defaults: `<table>_<columns>_idx` and `<table>_<columns>_key`; keep them instead of mixing another scheme |
| Deletion | No soft delete; lifecycle states (draft, published, archived, revoked) where the business needs history; hard delete by retention rules |
| Audit columns | `created_at`, `updated_at`, and `created_by_user_id` where meaningful; accountable actions also go to an append-only audit table |

## 4. Modeling and invariants

- Model entities, attributes, relationships, ownership, lifecycle, and query patterns first; write the invariants down ("an attempt belongs to one learner and one exam version", "a price is never negative").
- Encode invariants with `NOT NULL`, `UNIQUE`, foreign keys, `CHECK`, and exclusion constraints where they fit; application validation is a convenience, the database is the final integrity boundary.
- Normalize to avoid duplicated truth (3NF is the default). Denormalize only for a measured read need or a snapshot that must not change later (for example `exam_attempt_items.snapshot` keeps the question as the learner saw it), and document the source of truth, how it stays correct, and acceptable staleness.
- An ORM rule is not a constraint: if the Prisma schema says unique, the migration must create the unique index.

## 5. Indexes and queries

- Index real access patterns: foreign keys, `WHERE`, `JOIN`, `ORDER BY`, and uniqueness. Tenant tables usually lead with `tenant_id`: for `WHERE tenant_id = $1 AND status = $2 ORDER BY created_at DESC` consider `(tenant_id, status, created_at DESC)`. B-tree indexes serve left-most prefixes.
- Partial indexes for subsets (`WHERE status = 'OPEN'`), expression indexes for normalized lookups, GIN for `jsonb` or full-text search, covering (`INCLUDE`) indexes only for measured hot queries.
- Every index costs writes and storage; do not index every column.
- Select only needed columns (Prisma `select`), never unbounded lists (`take`), avoid N+1 (use `include`, batched `in` queries, or one join), and paginate with a deterministic order (`ORDER BY created_at DESC, id DESC`; cursor or keyset for large or changing sets, as the catalogue does).
- Measure with `EXPLAIN (ANALYZE, BUFFERS)` on a local database with realistic data. On production use plain `EXPLAIN` only; `ANALYZE` executes the statement.
- Prioritize slow queries by total impact (time × frequency).

## 6. Transactions, isolation, and concurrency

- One logical operation, one transaction, through `DatabaseContext.run` (which also sets the tenant context). Keep it short; never call an external service or wait for a person inside it.
- PostgreSQL's default is Read Committed. Raise isolation (Repeatable Read or Serializable) only for a named anomaly such as write skew, and retry serialization failures.
- Assume concurrent requests. Use, in order of preference:
  1. a unique constraint and handling of `P2002`
  2. an atomic update: `UPDATE ... SET quantity = quantity - 1 WHERE id = $1 AND quantity > 0`, then check the row count
  3. a conditional state change (`updateMany` where `status` is the expected value) and a count check
  4. optimistic locking with a `version` column when edits may collide
  5. `SELECT ... FOR UPDATE` for short exclusive sections
- Avoid deadlocks with a consistent lock order and small transactions; retry a deadlock once.
- Idempotency at the database level: a unique key on the natural identity or an idempotency key; `INSERT ... ON CONFLICT` with an explicit conflict target when an upsert is truly intended.
- Counters are atomic increments, never read-then-write.

## 7. Connections

Each API pod has one Prisma connection pool (default size about `2 × CPU cores + 1`, not configured today). Total connections are pods × pool size and must stay below PostgreSQL's `max_connections` minus headroom for migrations, backups, and administration. Before adding replicas or a new service, add up the connections and set `connection_limit` in `DATABASE_URL` if needed. Never open connections per request.

## 8. Security, roles, and tenancy

| Role | Used by | Privileges |
| --- | --- | --- |
| `oxinov` (owner) | Migration job and seeds | Owns the schema; never used by request code |
| `oxinov_app` | Edu API requests | Only the granted table privileges; cannot bypass RLS |
| `oxinov_platform_app` | Platform API requests | Same, for `oxinov_platform` |
| `keycloak` | Keycloak | Its own database only |

- Grant per table, per operation; append-only tables get `SELECT, INSERT` only. A future read-only reporting role must also respect RLS.
- Row-level security: `ENABLE` and `FORCE` on every tenant table; policies use `app_current_tenant_id()`, `app_current_user_id()`, `app_is_tenant_staff()`; context is set with transaction-local `set_config(..., true)`, which is safe with pooled connections; the owner role bypasses RLS, so request code never uses it. RLS is defense in depth; API authorization is still required.
- Multi-tenant model today: one database per product, shared schema with `tenant_id` and RLS. Separate schemas or databases per tenant are the "isolation tier" step for a customer that needs it (ADR-019), not a default.
- Parameterized queries only (Prisma or tagged `$queryRaw`); dynamic identifiers only from an allow-list.
- Production database access: no public port and no SSH; operators use `oxctl shell` over Systems Manager, recorded by AWS. Never point a local tool at production.
- Test databases are throwaway and their names end in `_test` (integration tests drop and recreate the schema).

## 9. Personal data, deletion, retention, audit

- Minimize: store only what a requirement needs; never copy login data from the identity service; the identity is the OIDC `sub`, not an email.
- Classification: a formal public, internal, confidential, restricted scheme is **not yet defined**; treat personal data, exam answers, submissions, payments, and KYC documents as restricted until it is. Record the decision in [privacy](../../../docs/09-security/privacy.md).
- Retention follows [data retention](../../../docs/05-data/data-retention.md) (proposed defaults awaiting the owner and counsel); automate deletion when periods are approved.
- Deletion is deliberate: hard delete with `RESTRICT` forcing the order, anonymize where records must stay (payments, audit), and support export and deletion requests (FR-PRIV-3201).
- Audit: accountable actions (roles, ownership, policies, payments, administrative access) go to an append-only table with actor, action, resource, time, and request ID; `updated_at` is not an audit trail.

## 10. Migrations

- New timestamped folder, reviewed, **immutable once merged**, forward-only. Prisma checksums migrations.
- Expand and contract: (1) add a nullable column or new table, (2) deploy code that writes both, (3) backfill, (4) switch reads, (5) add `NOT NULL` or constraints, (6) drop the old column in a later release. The previous image must keep working, because migrations run before new pods and a rollback keeps the new schema.
- Irreversible steps (drops, rewrites, meaning changes) are called out in the migration comment and the changelog; production recovery is a forward fix, not a down migration.
- Large tables: check lock level and rewrite cost. `CREATE INDEX CONCURRENTLY` cannot run inside a transaction block, so confirm how the migration runner executes the file before using it. Add constraints as `NOT VALID` then `VALIDATE CONSTRAINT` to avoid long locks.
- Backfills are separate from schema changes: batched, restartable, idempotent, observable, and throttled; never one unbounded `UPDATE`.
- Test on a fresh database (CI applies all migrations and checks drift) and on an upgraded one with realistic data volume for large changes.
- Seeds: development seeds are synthetic and never run in production; production reference data goes in migrations and is idempotent.

## 11. Backup, recovery, and availability

| Item | Today |
| --- | --- |
| Backups | Nightly `pg_dumpall` to S3, kept 30 days; daily encrypted disk snapshots, kept 7 days |
| Objectives | RPO 24 hours, RTO 4 hours (proposed, NFR-05) |
| Point-in-time recovery | Not available (no WAL archiving); arrives with RDS (oxinov-rds) or WAL archiving when an objective needs it |
| High availability | None: one node, no replica (ADR-017). Replication is not a backup |
| Restore | Owner approval required (it overwrites data); follow [backup and recovery](../../../docs/10-devops/backup-recovery.md); verify tenant isolation after restore |
| Restore testing | Quarterly (NFR-05); the first test is still open |

A new store or large dataset must state its backup, retention, and restore path before it goes live. A disaster plan is detect → contain → restore → validate → resume, written before the incident.

## 12. Observability, capacity, and maintenance

- Production has no database metrics yet; use `oxctl status` (disk, backups), and read-only checks through `oxctl shell` (`pg_stat_activity`, `pg_locks`, table and index sizes). Locally, the `postgres-exporter` and Grafana stack shows health.
- Watch connections, lock waits, deadlocks, slow queries, disk, dead tuples and bloat, and backup age. Alert before disk is full.
- Leave autovacuum on; tune it per table only with evidence; run `ANALYZE` after large backfills.
- Track growth (rows, table and index size, WAL) so the RDS step in the [scalability strategy](../../../docs/04-architecture/scalability.md) is taken on time.

## 13. Scale-out options (only with a measured trigger and an ADR)

Read replicas (mind replication lag and read-your-own-writes), RDS Multi-AZ, partitioning by date or tenant for very large tables or retention, materialized views for expensive reads that tolerate staleness (with a refresh plan), change data capture to a warehouse or search index, and dedicated databases per large tenant. Sharding is a last resort.

## 14. Boundaries between products

Each product owns its database; no cross-database joins or writes. References across products are IDs checked through APIs or events, and consistency between them is eventual. Never expose database rows directly: entity → service → DTO.

## 15. Review checklists

**SQL:** correct joins, filters, and `NULL` handling; deterministic order; parameters bound; right role; tenant scope; only needed columns; bounded results; index support; no N+1; plan checked for hot queries; correct transaction boundary; races and locks considered.

**Schema:** primary key; foreign keys with a deliberate delete rule; composite tenant keys; `NOT NULL`; unique and check constraints; right data types (no text for everything, no floats for money); defaults; indexes justified by queries; RLS, grants, and policy tests; retention, classification, and audit needs; documentation updated.

**Migration:** new file only; backward compatible with the running image; lock and rewrite risk; data loss risk; backfill plan; index strategy; deploy order; roll-forward plan; Prisma schema matches (no drift).

## 16. Existing schema first

Before changing a database, read its Prisma schema, the latest migrations, RLS policies and policy tests, indexes, roles and grants, query patterns in the services, seeds, [database design](../../../docs/05-data/database-design.md), and the ERD. Do not redesign a working schema without understanding its constraints and consumers.
