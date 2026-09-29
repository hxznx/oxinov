# Platform database (`database/platform`)

PostgreSQL schema for the Oxinov platform control plane, used only by `backend/platform-api`.

| Path | Purpose |
| --- | --- |
| `prisma/schema.prisma` | Accounts, policy versions, append-only acceptances, product catalogue, entitlements, audit history |
| `migrations/` | Numbered migrations: schema, owner isolation (RLS, `oxinov_platform_app` role, constraints), product catalogue |
| `seeds/dev_seed.sql` | Local and test data only; never load into staging or production |
| `policies/owner_isolation_test.sql` | Database-level isolation tests run as the application role |
| `policies/local-app-role.sh` | Local Docker init: creates `oxinov_platform` and the request role login |

Organizations, KYC, plans, and the payments ledger arrive in later Phase 2 slices, each with its own migration and isolation tests.

## Assistant skills

Coding assistants working here follow [oxinov-database-architecture](../../.claude/skills/oxinov-database-architecture/SKILL.md), [oxinov-access-control](../../.claude/skills/oxinov-access-control/SKILL.md), [oxinov-database](../../.claude/skills/oxinov-database/SKILL.md), [oxinov-platform-integration](../../.claude/skills/oxinov-platform-integration/SKILL.md), [oxinov-security](../../.claude/skills/oxinov-security/SKILL.md), [oxinov-testing](../../.claude/skills/oxinov-testing/SKILL.md). All rules and skills: [AI knowledge](../../docs/14-ai-knowledge/README.md).
