# Database rules

The rules for PostgreSQL, Prisma, and migrations, in short form. Read them before you change a schema, a policy, or a query that crosses tenants.

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

Source: [AGENTS.md](../../AGENTS.md) section 5, [database design](../05-data/database-design.md), [migration strategy](../05-data/migration-strategy.md), [data retention](../05-data/data-retention.md), and [privacy](../09-security/privacy.md). Decisions: ADR-001, ADR-006.

## Ownership

| Plane | Folder | Database | Request role |
| --- | --- | --- | --- |
| Edu | `database/products/edu` | `oxinov_lms` (renamed `oxinov_edu` only through the [ADR-027 cutover](../10-devops/runbooks/edu-rename-cutover.md)) | `oxinov_app` |
| Platform | `database/platform` | `oxinov_platform` | `oxinov_platform_app` |

## Must

- Keep each product's data in its own database; move data between products through APIs or events.
- Carry `tenant_id` (or the owner ID) on every tenant- or owner-scoped row, and enforce it twice: in the API (authorization and the transaction-local `DatabaseContext`) and in PostgreSQL (row-level security with a request role that cannot bypass it).
- Test the allowed and the denied cross-tenant paths.
- Write migrations as timestamp-ordered, reviewed files, forward-only, in expand → migrate → contract steps, so the running image still works with the new schema.
- Keep the Prisma schema identical to the migrations; CI's drift check fails otherwise.
- Use unique constraints instead of check-then-insert.
- Collect the minimum personal data and follow the retention and privacy rules for deletion and export.
- State how any data outside PostgreSQL or S3 is backed up and restored.

## Conventions already in the schema

`snake_case` names; `uuid` keys from `gen_random_uuid()`; `tenant_id` with a composite unique `(tenant_id, id)` and composite foreign keys, so PostgreSQL rejects cross-tenant links; `ON DELETE RESTRICT`; named `CHECK` constraints for formats, ranges, and money; `timestamptz` in UTC; money as integer minor units plus an ISO currency; JSON only for semi-structured data; no soft delete. The full set, with indexing, concurrency, migration, and recovery guidance, is in the oxinov-database-architecture skill.

## Never

- Edit, rename, or delete a migration once it is merged. Prisma checksums them, and an edit breaks every deploy.
- Read another product's database or share tables between products.
- Copy login data out of the identity service.
- Put personal data in logs, metrics labels, security events, fixtures, or prompts.
- Delete or restore production data without the owner's explicit approval.

## Checks

`pnpm edu:migrate`, `pnpm --filter @oxinov/edu-api db:test-policies`, and `pnpm --filter @oxinov/edu-api test:integration` (the platform API has the same scripts).

Skills: [oxinov-database-architecture](../../.claude/skills/oxinov-database-architecture/SKILL.md), [oxinov-database](../../.claude/skills/oxinov-database/SKILL.md), [oxinov-testing](../../.claude/skills/oxinov-testing/SKILL.md).
