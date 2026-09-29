---
name: oxinov-database
description: Make a change to an Oxinov PostgreSQL database step by step - Prisma schema, a new SQL migration with constraints and indexes, row-level security policies and grants, enums, backfills, seeds, tenant isolation tests, the drift check, and the documents to update, for the edu and platform databases. Use for any change under database/; plan larger designs first with oxinov-database-architecture.
---

# Changing an Oxinov database

Design first with the **oxinov-database-architecture** skill for a new table, relationship, money or personal data, large-table change, or anything touching tenancy; it holds the conventions, decision process, and review checklists. Rules: [database rules](../../../docs/14-ai-knowledge/database-rules.md). Sources: [database design](../../../docs/05-data/database-design.md), [migration strategy](../../../docs/05-data/migration-strategy.md).

## Where things are

| Plane | Database | Schema | Migrations | Policy tests | Scripts package |
| --- | --- | --- | --- | --- | --- |
| Edu | `oxinov_lms` (renamed `oxinov_edu` only by the [ADR-027 cutover](../../../docs/10-devops/runbooks/edu-rename-cutover.md)) | `database/products/edu/prisma/schema.prisma` | `database/products/edu/migrations/<timestamp>_<name>/migration.sql` | `database/products/edu/policies/tenant_isolation_test.sql` | `@oxinov/edu-api` |
| Platform | `oxinov_platform` | `database/platform/prisma/schema.prisma` | `database/platform/migrations/...` | `database/platform/policies/` | `@oxinov/platform-api` |

## Conventions to copy (details in oxinov-database-architecture)

`snake_case` names; `uuid` keys with `gen_random_uuid()`; `tenant_id` plus a composite unique `(tenant_id, id)` and composite foreign keys between tenant tables; `ON DELETE RESTRICT`; `NOT NULL` by default; named `CHECK` constraints (`<table>_<rule>`); `timestamptz`; money as integer minor units plus a checked ISO currency; Prisma default index names; no soft delete.

## Steps

1. **Plan the release steps.** Migrations run before new pods start, and a rollback keeps the new schema, so the running image must work with it. Renames, drops, and new `NOT NULL` columns on existing data take several releases (expand → migrate → contract).
2. **Edit the Prisma schema** (`@@map` and `@map` to `snake_case`, relations, `@@unique`, `@@index`).
3. **Write a new migration folder** with a UTC timestamp later than every existing one, for example `20260929000100_<what>`. Never edit, rename, or delete a merged migration.
4. **Put the constraints in SQL:** foreign keys with the delete rule, unique constraints, `CHECK` constraints for formats, ranges, and non-negative money, and indexes for the queries you will run.
5. **For every new tenant-scoped table**, in the same migration:
   - `tenant_id`, the composite key, and composite foreign keys to other tenant tables
   - `GRANT` only the needed operations to the request role (`oxinov_app` or `oxinov_platform_app`); append-only tables get `SELECT, INSERT`
   - `ENABLE` and `FORCE ROW LEVEL SECURITY`
   - policies with `app_current_tenant_id()`, `app_current_user_id()`, and `app_is_tenant_staff()` (copy the latest Edu migration's pattern)
6. **Enums:** adding a value is its own migration; removing or renaming one is a multi-release change.
7. **Large tables:** avoid long locks (constraints `NOT VALID` then `VALIDATE`; check whether `CREATE INDEX CONCURRENTLY` can run in the migration runner). Put data backfills in a separate, batched, idempotent step.
8. **Policy tests:** the request role sees and writes its own tenant's rows and cannot see or write another tenant's.
9. **Regenerate the client:** `pnpm --filter @oxinov/edu-api prisma:generate`.
10. **Seeds** (`database/products/edu/seeds`): synthetic data only; never run in production.
11. **Update documents:** [database design](../../../docs/05-data/database-design.md), the [data model](../../../docs/05-data/data-model.md) and ERD if the model changed, [data retention](../../../docs/05-data/data-retention.md) for new personal data, and the changelog, marking any irreversible step.

## Check

```bash
docker compose up -d postgres
pnpm edu:migrate
pnpm --filter @oxinov/edu-api exec prisma migrate diff --from-config-datasource --to-schema ../../../database/products/edu/prisma/schema.prisma --exit-code
pnpm --filter @oxinov/edu-api db:test-policies
pnpm --filter @oxinov/edu-api test:integration
```

The `migrate diff` command is CI's drift check and must report no difference. Integration tests drop and recreate the schema, so their database name must end in `_test`. For an important query, check its plan locally with `EXPLAIN (ANALYZE, BUFFERS)` on realistic data.

## Never

- `prisma migrate reset`, `db push`, or any destructive command against a shared or production database.
- Rename the Edu database `oxinov_lms` outside the ADR-027 cutover runbook.
- A tenant or personal-data table without row-level security.
- Check-then-insert instead of a unique constraint, or floats for money.
- Delete or restore production data without the owner's explicit approval.
