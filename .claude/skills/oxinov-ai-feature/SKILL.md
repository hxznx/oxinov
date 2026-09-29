---
name: oxinov-ai-feature
description: Plan or build AI features inside Oxinov products - the planned backend AI gateway with model aliases, authorization before retrieval and tools, versioned prompts and evaluations, metadata-only telemetry, the phased AI roadmap, and the governance gates. Use when a task adds a model call, chatbot, copilot, recommendation, or any AI capability to a product.
---

# AI features in Oxinov products

Rules: [AI feature rules](../../../docs/14-ai-knowledge/ai-rules.md). Sources: [AI strategy](../../../docs/01-company/ai-strategy.md), [AI architecture](../../../docs/04-architecture/ai-architecture.md), [AI governance](../../../docs/09-security/ai-governance.md), [AI roadmap](../../../docs/11-planning/ai-roadmap.md), milestone prompt [IMPLEMENT-AI-FOUNDATION](../../../prompts/IMPLEMENT-AI-FOUNDATION.md). Decision: ADR-014 (Bedrock-first, implementation gated).

## Today

**No AI feature runs, and no AI code or AWS AI resource exists.** Phase 0 of the AI roadmap (owner, decisions, evaluation sets) has not started. Do not add a model call to a product before the foundation exists.

## Order of work

1. **Phase 0, decisions (owner):** name the AI product owner, the approved data, the model aliases, and the budget. Record them.
2. **Foundation:** the backend AI gateway (one service, model aliases, per-tenant quotas, metadata-only telemetry), the evaluation harness, and tenant-isolation tests. Follow `prompts/IMPLEMENT-AI-FOUNDATION.md` as one milestone.
3. **Staff pilots first:** draft-only helpers (for example the Edu authoring copilot) where a person approves every output.
4. **Learner-facing features** only after the gateway, evaluations, the approved content pipeline, and isolation tests work.

## Rules for any AI feature

- Every call goes through the gateway using a model alias, never a provider model name in product code.
- Authorize before retrieval and before every tool call, with the product's tenant and role rules.
- AI proposes drafts through typed actions a person approves; it never gets SQL, shell, secrets, publishing, refunds, payouts, account or role changes, or cross-tenant access.
- Prompts and evaluation sets are versioned; evaluations include prompt injection, unsupported claims, missing sources, secret requests, and cross-tenant identifiers (50 or more cases per pilot).
- Telemetry records metadata only: no raw prompts, answers, or personal data.
- Content: never generate or copy official exam questions without rights; label practice material as practice.
- State the monthly cost against the budget; AI spend needs the owner's approval.

## Checks

Evaluation pass rates recorded against the release gate, tenant-isolation tests for retrieval, and a security review (oxinov-security) before any pilot.
