# Migration strategy

This guide outlines how schema changes are managed, tested, and deployed for PostgreSQL databases across all Oxinov products.

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

## 1. Schema management

- **Location**: Keep the Prisma schema under `database/products/<slug>/prisma/`.
- **Migrations**: Keep schema changes in reviewed, numbered, timestamp-ordered migrations under `database/products/<slug>/migrations/`.
- **Immutability**: Once a migration is merged into `main`, it is immutable. Do not edit merged migrations, as this will break checksum validation and halt deployments.

## 2. Deployment and CI/CD

- **Validation**: CI applies migrations to a fresh PostgreSQL container and a database seeded with the previous release schema to check for drift and errors.
- **Pre-upgrade Hook**: Migrations run as a Helm pre-upgrade hook before the new application code starts.
- **No Destructive Commands**: Never use `db push` or destructive reset commands (`prisma migrate reset`) against the production environment.
- **Rollback Safety**: Application image rollbacks must remain safe against the newly migrated schema. Ensure backward compatibility. If not possible, a documented forward fix is required.

## 3. The expand-then-contract pattern

For breaking or incompatible changes, always use the expand-and-contract pattern across multiple releases. This guarantees zero-downtime deployments and safe rollbacks.

1. **Expand**: Add the new fields or tables. Deploy the updated schema. Update the application to write to both old and new fields, but continue reading from the old fields.
2. **Migrate**: Run a backfill script or background worker to copy existing data from the old fields to the new fields.
3. **Contract**: Update the application to read and write exclusively using the new fields. Finally, drop the old fields in a subsequent schema migration.

## 4. Operational rules

- **Backups**: Automatically back up the production database before applying migrations.
- **Metrics**: Record the migration version and execution duration.
- **Security Check**: Test tenant Row-Level Security (RLS) and pooled-connection behavior thoroughly after any policy changes to ensure tenant isolation remains intact.
