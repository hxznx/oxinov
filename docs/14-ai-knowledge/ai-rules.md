# AI feature rules

The rules for building AI features into Oxinov products, in short form. They are about AI inside the products, not about coding assistants; assistants follow [AGENTS.md](../../AGENTS.md). No AI feature runs in production today ([current state](../04-architecture/current-state.md)).

**Status:** Current · **Owner:** Founder · **Last reviewed:** 2026-09-29

Source: [AGENTS.md](../../AGENTS.md) section 6.5, [AI strategy](../01-company/ai-strategy.md), [AI architecture](../04-architecture/ai-architecture.md), [AI governance](../09-security/ai-governance.md), and the [AI roadmap](../11-planning/ai-roadmap.md).

## Must

- Route every AI feature through the backend AI gateway, using model aliases rather than provider model names in product code.
- Authorize before retrieval and before every tool call, with the same tenant and role rules as the API.
- Version prompts and evaluations, and keep evaluation sets that include prompt injection, unsupported claims, and cross-tenant identifiers.
- Record metadata-only telemetry: no raw prompts or personal data.
- Let AI propose drafts only through typed, authorized actions that a person approves.

## Never

- Give an AI component direct production SQL, shell access, secrets, or the power to publish, refund, pay out, change accounts or roles, or cross tenants.
- Send restricted or personal data to a model without an approved data-use decision.
- Start a learner-facing tutor before the gateway, the evaluation harness, the approved content pipeline, and tenant-isolation tests work.

Skills: [oxinov-ai-feature](../../.claude/skills/oxinov-ai-feature/SKILL.md), [oxinov-security](../../.claude/skills/oxinov-security/SKILL.md), [oxinov-research](../../.claude/skills/oxinov-research/SKILL.md).
