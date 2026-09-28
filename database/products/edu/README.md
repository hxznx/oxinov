# Oxinov Edu database

Everything the Edu PostgreSQL database needs, owned by the [Edu API](../../../backend/products/edu-api/README.md).
The [product record](../../../docs/02-products/edu/README.md) links the rest of the product.

| Folder | Contents |
| --- | --- |
| [migrations/](migrations/README.md) | Reviewed, timestamp-ordered migrations. Never edit one after it is merged: Prisma checksums them. |
| [policies/](policies/README.md) | Row-level security design, the local application role, and the tenant isolation test. |
| [prisma/](prisma/README.md) | Prisma schema and client generation (output in the API's `src/generated/`). |
| [seeds/](seeds/README.md) | Deterministic development and test data. |

Every tenant-owned record carries an immutable `tenant_id`, enforced by API authorization, PostgreSQL RLS,
and automated allowed and denied cross-tenant tests. Production applies these migrations through the
`migrate` image (`backend/workers/migrate/edu.config.ts`).

## Assistant skills

Coding assistants working here follow [oxinov-database](../../../.claude/skills/oxinov-database/SKILL.md), [oxinov-security](../../../.claude/skills/oxinov-security/SKILL.md), [oxinov-testing](../../../.claude/skills/oxinov-testing/SKILL.md). All rules and skills: [AI knowledge](../../../docs/14-ai-knowledge/README.md).
