# 05 · Data

How Oxinov stores, isolates, changes, and deletes data. PostgreSQL is the system of record (ADR-001); each product owns its database, roles, and migrations. Product entity diagrams live with their product, for example the [Edu ERD](../02-products/edu/edu-erd.md).

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

| Document | Purpose |
| --- | --- |
| [Database design](database-design.md) | Databases, roles, row-level security, and tenant context |
| [Data model](data-model.md) | Core entities and their ownership |
| [Migration strategy](migration-strategy.md) | Forward-only, reviewed, immutable migrations in expand, migrate, contract steps |
| [Data retention](data-retention.md) | How long each kind of data is kept, and how it is deleted or exported |

## Assistant skills

Coding assistants working here follow [oxinov-database-architecture](../../.claude/skills/oxinov-database-architecture/SKILL.md), [oxinov-access-control](../../.claude/skills/oxinov-access-control/SKILL.md), [oxinov-database](../../.claude/skills/oxinov-database/SKILL.md), [oxinov-multi-tenancy](../../.claude/skills/oxinov-multi-tenancy/SKILL.md). All rules and skills: [AI knowledge](../14-ai-knowledge/README.md).
