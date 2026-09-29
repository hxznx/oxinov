# Database

PostgreSQL is the transactional system of record. The approved target separates the shared
`platform/` database from independently owned `products/<slug>/` databases, each with the same
`prisma/`, `migrations/`, `seeds/` and `policies/` shelves. Oxinov Edu's database is
[products/edu](products/edu/README.md).

Every tenant-owned product record and operation carries and verifies `tenant_id`. Services use
only their owned database or schema and communicate across boundaries through versioned APIs and
events. Only controlled backend and CI tasks may apply migrations or seeds; frontend applications
cannot import anything from this folder.

## Assistant skills

Coding assistants working here follow [oxinov-database-architecture](../.claude/skills/oxinov-database-architecture/SKILL.md), [oxinov-access-control](../.claude/skills/oxinov-access-control/SKILL.md), [oxinov-database](../.claude/skills/oxinov-database/SKILL.md), [oxinov-multi-tenancy](../.claude/skills/oxinov-multi-tenancy/SKILL.md), [oxinov-security](../.claude/skills/oxinov-security/SKILL.md), [oxinov-testing](../.claude/skills/oxinov-testing/SKILL.md). All rules and skills: [AI knowledge](../docs/14-ai-knowledge/README.md).
