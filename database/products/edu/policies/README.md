# PostgreSQL policies

Tenant isolation is enforced twice: by API membership checks and by PostgreSQL row-level
security (RLS). Every tenant-owned table must fail closed when tenant context is absent or invalid.

## Where things live

| File | Purpose |
| --- | --- |
| `../migrations/20260924000200_tenant_isolation/migration.sql` | Canonical RLS policies, context functions, the `oxinov_app` role grants, and constraints Prisma cannot express. Policies ship only through reviewed migrations. |
| `tenant_isolation_test.sql` | Database-level isolation tests, run as `oxinov_app` (`pnpm --filter @oxinov/edu-api db:test-policies`). |
| `local-app-role.sh` | Local Docker init script that gives `oxinov_app` a login password. |

## Model

- Request code connects as `oxinov_app`: not superuser, no `BYPASSRLS`, no DDL, and no `DELETE` on
  `audit_events`. Migrations and seeds use the owner role.
- Each API transaction sets `app.tenant_id`, `app.user_id`, and (during sign-in) `app.auth_subject`
  with `set_config(..., true)`, which is transaction-local and cannot leak across pooled connections.
- Tenant-owned tables use one policy: `tenant_id = app_current_tenant_id()` for reads and writes.
  `FORCE ROW LEVEL SECURITY` applies it to the table owner too.
- `tenant_memberships` additionally lets a user read their own memberships in any tenant, which is
  how the workspace list works. `tenants` and `user_profiles` are visible only through the active
  tenant or the caller's own memberships.
- Composite foreign keys `(tenant_id, x_id) → (tenant_id, id)` make cross-tenant references
  impossible even inside a correctly scoped transaction.
- `provider_events` is a global webhook ledger with no RLS; only signature-verified webhook
  handlers may write to it.

## Adding a table

1. Add `tenantId` plus `@@unique([tenantId, id])` in `database/products/edu/prisma/schema.prisma`, and reference
   other tenant-owned tables through `(tenantId, …)` composite relations.
2. In the same migration: `ENABLE` and `FORCE ROW LEVEL SECURITY`, create the `_tenant_isolation`
   policy, and `GRANT` only the privileges `oxinov_app` needs.
3. Extend `tenant_isolation_test.sql`; its catalog check fails if any `tenant_id` table lacks forced RLS.
