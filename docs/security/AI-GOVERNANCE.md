# AI governance and safety

## Purpose

This policy controls AI used by Oxinov staff, products, learners, customers, and automated jobs. It adapts the NIST AI Risk Management Framework's govern, map, measure, and manage functions and covers the major risks in the OWASP Top 10 for LLM Applications 2025.

This document is an engineering and operating policy. Nepal counsel must review privacy, consumer, education, employment, financial, intellectual-property, and sector obligations before the relevant public launch. The [Privacy Act, 2075](https://lawcommission.gov.np/content/12261/the-privacy-act-2075/) is part of that review.

## Non-negotiable rules

1. Every AI feature has an accountable product owner, data steward, technical owner, risk tier, approved purpose, users, data classes, model/prompt versions, budget, evaluation, and kill switch.
2. Products use the AI gateway. No browser, mobile app, ad hoc script, or unreviewed service calls a model provider with company or customer data.
3. Tenant and product authorization occurs before retrieval and before every tool call. The model never chooses or supplies trusted identity or tenant context.
4. AI output is untrusted input. Validate, encode, authorize, and review it before displaying it as fact or using it in another system.
5. Generated material is a draft unless its use-case release record explicitly permits automated delivery.
6. Customer content is not used to train shared models by default. A change requires an explicit opt-in contract, data and rights review, deletion method, and separate ADR.
7. Raw prompts, responses, documents, private messages, exam answers, secrets, and personal data are excluded from standard logs and SOC events.
8. Active exam questions, hidden answer keys, confidential rubrics, payment credentials, KYC documents, passwords, tokens, private keys, and production secrets are prohibited model inputs unless a narrowly scoped use case and review explicitly permits the relevant data class.
9. Users receive a clear AI disclosure where an output could be mistaken for a human decision or authoritative fact. High-impact users can request review or correction.
10. A feature stops when a critical safety, privacy, authorization, tenant, rights, or uncontrolled-cost threshold is breached.

## Risk tiers

| Tier | Typical examples | Required controls |
| --- | --- | --- |
| 1: Assistive | Internal summaries, metadata, brainstorming, draft copy | Approved data; disclosure; owner; budget; basic evaluation; human review before publication |
| 2: Grounded advisory | Knowledge assistant, learner tutor, support drafts, translation | Tier 1 plus RAG citations, access filters, refusal policy, language testing, feedback and escalation |
| 3: High impact | Grading assistance, job matching, fraud or security triage, agriculture advice, customer-affecting recommendations | Tier 2 plus named domain approver, human decision, explanation/evidence, appeal, enhanced monitoring, periodic bias and drift review |
| 4: Prohibited initially | Autonomous payments/refunds, role or entitlement changes, user suspension, production deletion, unsupervised external messages or publishing, physical robot control, biometric surveillance, safety-critical medical/legal/financial decisions | Not allowed. A future exception needs executive, security, privacy/legal, domain, and architecture approval plus a separate safety case |

## Intake record

Before experimentation, record:

- problem, users, present baseline, measurable benefit, and rejected non-AI alternative;
- product owner, technical owner, data steward, domain reviewers, and support/on-call owner;
- risk tier and affected people;
- input, output, source, tenant, product, sensitivity, rights, retention, location, and deletion for each data class;
- launch languages and accessibility needs;
- model aliases, candidate providers/regions, prompt and retrieval design, tools, and fallback;
- quality, safety, fairness, privacy, security, latency, availability, and cost thresholds;
- evaluation dataset provenance and protected test cases;
- human review, disclosure, feedback, appeal, incident, rollback, and shutdown procedures.

## Data controls

- Classify data before it reaches the gateway: public, internal, confidential, restricted, or prohibited for the feature.
- Use approved and licensed sources. Preserve attribution, licence, consent, version, effective date, and deletion lineage.
- Remove unnecessary identifiers and secrets. Prefer representative synthetic data in development.
- Keep production customer content out of developer prompts, issue trackers, examples, and model evaluations.
- Segregate tenant retrieval indexes or namespaces and enforce storage-level and query-level filters.
- Delete embeddings, chunks, caches, evaluation copies, and provider-side artifacts when the source or tenant data is deleted.
- Document every processing Region. Cross-Region routing is a data-flow decision, not only a performance setting.
- Review each provider's data-use and retention conditions for the exact API, feature, model, and mode.

## Evaluation standard

### Required test groups

- normal tasks representing real frequency and difficulty;
- each launch language and important dialect or script;
- incomplete, ambiguous, conflicting, stale, and out-of-scope sources;
- direct and indirect prompt injection, jailbreaks, encoded instructions, system-prompt requests, and malicious retrieved documents;
- personal data, secrets, private messages, exam answers, and another tenant's identifiers;
- unauthorized tool calls, altered parameters, repeated actions, and excessive loops;
- harmful, discriminatory, manipulative, or confidently false output;
- provider timeout, throttling, guardrail failure, retriever failure, invalid schema, and cost exhaustion.

### Release evidence

Save the immutable evaluation definition and results with the model/inference profile, prompt, guardrail, retrieval pipeline, tool schemas, data snapshot, locale, and code release. Model-based judges may assist triage but do not replace domain or affected-user review for Tier 3.

For RAG, measure correctness, completeness, helpfulness, faithfulness, citation precision and coverage, harmfulness, refusal behavior, and retrieval quality. AWS lists related measures in [Bedrock knowledge-base evaluation](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-eval-retrieve.html).

## Human oversight

- The reviewer sees the source evidence, AI disclosure, affected object, and material differences from current state.
- Approval is a deliberate authenticated action; inactivity is not approval.
- The proposer and approver are different people for production security actions, financial actions, account restrictions, and model/policy changes.
- Store reviewer, timestamp, safe decision summary, model/prompt versions, and resulting application action.
- Provide correction and appeal paths for grading, eligibility, job, marketplace, or other high-impact recommendations.
- Monitor automation bias through override, disagreement, and sampled blind-review analysis.

## Security controls

Use the [OWASP LLM Top 10](https://genai.owasp.org/llm-top-10/) as the minimum threat checklist:

| Risk area | Oxinov control |
| --- | --- |
| Prompt injection | Separate instructions from data, input/output guardrails, untrusted retrieval, adversarial tests, no implicit tool authority |
| Sensitive information disclosure | Minimize/redact inputs, deny prohibited classes, response scanning, metadata-only logs, access-scoped RAG |
| Supply chain | Approved models/dependencies, pinned versions, provenance, vulnerability review, model/provider change gate |
| Data/model poisoning | Approved source owners, ingestion quarantine, lineage, integrity/version checks, rollback |
| Improper output handling | Typed schemas, escaping, validation, application authorization, no generated code/URL/SQL execution |
| Excessive agency | No tools by default, allowlist, least privilege, step/time/cost limits, preview, approval, idempotency |
| System prompt leakage | No secrets in prompts; disclosure of a prompt must not grant authority; deny unnecessary prompt exposure |
| Vector/embedding weakness | Tenant/product isolation, metadata filters, deletion tests, injection tests, retrieval evaluation |
| Misinformation | Grounded sources, citations, calibrated refusal, domain review, freshness controls, user correction |
| Unbounded consumption | Input/output caps, concurrency and rate limits, quotas, budgets, timeouts, loop limits, alerts |

[Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-how.html) adds provider-level checks, but application authorization, data isolation, validation, evaluation, and human oversight remain Oxinov responsibilities.

## Change management

A new model version, provider, processing Region, system prompt, guardrail, tool schema, retriever, embedding model, source corpus, risk tier, or automated action is a controlled change. It requires impact review and a representative regression evaluation. Production configuration references immutable published versions and supports rollback.

## Incident response

Immediately disable the affected feature or tool when there is suspected cross-tenant disclosure, secret exposure, unauthorized action, harmful high-impact output, uncontrolled spend, corrupted retrieval, or provider data-policy breach.

Preserve safe metadata and source/application records without copying sensitive prompts into the SOC system. Follow the relevant privacy, tenant isolation, account, payment, or security runbook; notify the owner and incident commander; assess provider deletion and affected-party duties; correct or withdraw affected outputs; and require a new release gate before reactivation.

## Review cadence

- Dashboard and budget review: weekly during a pilot, monthly after stabilization.
- Sampled quality and safety review: weekly for Tier 2 and Tier 3 at launch, then risk-based.
- Access, tool, model, prompt, source, and retention review: quarterly and after material changes.
- Threat model and incident exercise: at least twice yearly for customer-facing AI.
- Policy review: annually or when law, provider terms, business model, or system capability changes.

## Framework references

- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [NIST Generative AI Profile, NIST AI 600-1](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)
- [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)
- [Amazon Bedrock data protection](https://docs.aws.amazon.com/bedrock/latest/userguide/data-protection.html)
- [Amazon Bedrock data retention](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
- [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-how.html)

