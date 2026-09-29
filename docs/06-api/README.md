# 06 · API

Contracts shared by every Oxinov API: how requests authenticate, how errors are reported, and how versions evolve. Each service keeps its own OpenAPI description current.

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

| Document | Purpose |
| --- | --- |
| [API specification](api-spec.md) | Resources, conventions, pagination, and idempotency |
| [API authentication](api-auth.md) | Tokens, audiences, and authorization on every protected request |
| [API errors](api-errors.md) | Stable error codes and response shape |
| [API versioning](api-versioning.md) | `/v1` paths and additive-first changes |

## Assistant skills

Coding assistants working here follow [oxinov-access-control](../../.claude/skills/oxinov-access-control/SKILL.md), [oxinov-secure-input-output](../../.claude/skills/oxinov-secure-input-output/SKILL.md), [oxinov-api-design](../../.claude/skills/oxinov-api-design/SKILL.md), [oxinov-validation](../../.claude/skills/oxinov-validation/SKILL.md), [oxinov-backend](../../.claude/skills/oxinov-backend/SKILL.md). All rules and skills: [AI knowledge](../14-ai-knowledge/README.md).
