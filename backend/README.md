# Backend

Server-side code is separated into `gateway/`, the shared `platform-api/`, platform `workers/`,
and independently owned `products/`, one folder per product component named `<slug>-api`,
`<slug>-worker` or `<slug>-chat`. Oxinov Edu (`edu`) has `products/edu-api/` implemented and
`products/edu-worker/` and `products/edu-chat/` planned.

Backend processes enforce tenant membership and may use approved shared packages. Platform code
must not import product business logic, and one product must never read another product's
database. See [the Edu API](products/edu-api/README.md) and the
[target structure](../docs/08-engineering/company-project-structure.md).

## Assistant skills

Coding assistants working here follow [oxinov-backend-architecture](../.claude/skills/oxinov-backend-architecture/SKILL.md), [oxinov-access-control](../.claude/skills/oxinov-access-control/SKILL.md), [oxinov-secure-input-output](../.claude/skills/oxinov-secure-input-output/SKILL.md), [oxinov-backend](../.claude/skills/oxinov-backend/SKILL.md), [oxinov-mvc](../.claude/skills/oxinov-mvc/SKILL.md), [oxinov-api-design](../.claude/skills/oxinov-api-design/SKILL.md), [oxinov-validation](../.claude/skills/oxinov-validation/SKILL.md), [oxinov-multi-tenancy](../.claude/skills/oxinov-multi-tenancy/SKILL.md), [oxinov-events-and-jobs](../.claude/skills/oxinov-events-and-jobs/SKILL.md), [oxinov-new-service](../.claude/skills/oxinov-new-service/SKILL.md), [oxinov-testing](../.claude/skills/oxinov-testing/SKILL.md). All rules and skills: [AI knowledge](../docs/14-ai-knowledge/README.md).
