# Migration strategy

Keep the Prisma schema under `database/products/edu/prisma/` and schema changes in reviewed, numbered migrations under `database/products/edu/migrations/`. CI applies them to a fresh PostgreSQL container and a database seeded with the previous release schema. Use expand-then-contract for incompatible changes: add fields, deploy compatible readers/writers, backfill, then remove old fields in a later release.

Back up production before migrations; never use `db push` or destructive resets there. Record migration version and duration. App image rollback must remain safe against the migrated schema; otherwise use a documented forward fix. Test tenant RLS and pooled-connection behavior after policy changes.
