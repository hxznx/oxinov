# Prisma schema

`schema.prisma` is the ORM model for the API. It is aligned with the canonical data documents and
generates the client into `backend/products/lms-api/src/generated/prisma`
(`pnpm --filter @oxinov/lms-api prisma:generate`).

Prisma cannot express partial unique indexes, CHECK constraints, roles, or row-level security.
Those live in the numbered SQL migrations under `../migrations/`; see `../policies/README.md`.
Prisma configuration (schema and migrations paths) is in `backend/products/lms-api/prisma.config.ts`.
