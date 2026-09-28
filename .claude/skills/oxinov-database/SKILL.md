---
name: oxinov-database
description: Change an Oxinov PostgreSQL schema - Prisma schema, SQL migrations, row-level security policies, grants, seeds, and tenant isolation tests for edu or platform databases. Use for any change under database/.
---

# Oxinov database changes

Rules: [database rules](../../../docs/14-ai-knowledge/database-rules.md). Sources: [database design](../../../docs/05-data/database-design.md), [migration strategy](../../../docs/05-data/migration-strategy.md).

## Where things are

| Plane | Schema | Migrations | Policy tests | Scripts package |
| --- | --- | --- | --- | --- |
| Edu | `database/products/edu/prisma/schema.prisma` | `database/products/edu/migrations/<timestamp>_<name>/migration.sql` | `database/products/edu/policies/tenant_isolation_test.sql` | `@oxinov/edu-api` |
| Platform | `database/platform/prisma/schema.prisma` | `database/platform/migrations/...` | `database/platform/policies/` | `@oxinov/platform-api` |

## Steps

1. **Plan the expand → migrate → contract steps.** The image that runs now must keep working after this migration, because migrations run before new pods start and a rollback keeps the new schema. Renames and drops take at least two releases.
2. **Edit the Prisma schema.**
3. **Write a new migration folder** named with a UTC timestamp later than every existing one, for example `20260929000100_<what>`. Put the SQL in `migration.sql`. Never touch an existing migration.
4. **For every new tenant-scoped table**, in the same migration:
   - a `tenant_id` column and foreign keys
   - `GRANT` only the needed privileges to the request role (`oxinov_app` or `oxinov_platform_app`)
   - `ENABLE` and `FORCE ROW LEVEL SECURITY`
   - policies using `app_current_tenant_id()`, `app_current_user_id()`, and `app_is_tenant_staff()` (see the latest Edu migration for the pattern)
5. **Add policy tests** to the policies SQL file: the request role sees its own tenant's rows and cannot see or write another tenant's.
6. **Regenerate the client**: `pnpm --filter @oxinov/edu-api prisma:generate`.
7. **Seed data** (`database/products/edu/seeds`) only with synthetic data.
8. **Update** [database design](../../../docs/05-data/database-design.md) and the data model if the model changed.

## Check

```bash
docker compose up -d postgres
pnpm edu:migrate
pnpm --filter @oxinov/edu-api exec prisma migrate diff --from-config-datasource --to-schema ../../../database/products/edu/prisma/schema.prisma --exit-code
pnpm --filter @oxinov/edu-api db:test-policies
pnpm --filter @oxinov/edu-api test:integration
```

The `migrate diff` command is CI's drift check; it must report no difference.

## Never

- `prisma migrate reset`, `db push`, or any destructive command against a shared or production database.
- Rename the Edu database `oxinov_lms` outside the [ADR-027 cutover runbook](../../../docs/10-devops/runbooks/edu-rename-cutover.md).
- Add a table without row-level security when it holds tenant or personal data.
