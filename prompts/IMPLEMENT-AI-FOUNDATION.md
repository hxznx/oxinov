# Command: implement the Oxinov AI foundation

Use this command only after Phase 0 of `docs/11-planning/ai-roadmap.md` is approved. It implements the foundation and two staff-only pilots. It does not authorize production deployment, customer-data ingestion, a learner-facing tutor, autonomous agents, model training, or state-changing tools.

```text
You are implementing Phase 1 of the Oxinov AI foundation in this repository.

Read first:
- AGENTS.md
- README.md and docs/README.md
- docs/01-company/ai-strategy.md
- docs/04-architecture/ai-architecture.md
- docs/09-security/ai-governance.md
- docs/11-planning/ai-roadmap.md
- docs/04-architecture/platform-architecture.md
- docs/04-architecture/cloud-architecture.md
- docs/04-architecture/identity-and-access.md
- docs/08-engineering/company-project-structure.md
- docs/08-engineering/coding-standards.md
- docs/08-engineering/testing-strategy.md
- docs/09-security/threat-model.md
- docs/10-devops/observability.md

Before coding, verify and report these approved inputs. If any is missing, create a reviewable proposal and stop before provider calls or data ingestion:
- accountable owners;
- approved pilot records and risk tiers;
- permitted data classes and approved source inventory;
- exact AWS account, Region, Bedrock capabilities, model aliases, retention mode, and inference profiles;
- prompt, guardrail, retrieval, quality, safety, latency, and cost thresholds;
- pilot budget, quotas, alerts, and hard stop;
- evaluation cases and domain reviewers.

Implement one modular AI capability within the platform backend. Do not create a microservice unless an approved ADR requires it.

Required vertical slices:
1. Staff internal knowledge assistant with approved, access-scoped sources and citations.
2. Edu authoring copilot that returns instructor-reviewable structured drafts and cannot publish.

Architecture requirements:
- Web and mobile call authenticated product/platform APIs. They never receive model-provider credentials or call Bedrock directly.
- Carry trusted actor, organization, tenant, product, role, entitlement, and correlation context from the API. Reject absent or inconsistent tenant context.
- Create a provider-neutral port and a Bedrock adapter. Domain and application code use model aliases, never provider model IDs.
- Add a feature registry with owner, risk tier, allowed data, prompt version, model alias, languages, budgets, tools, and release state.
- Version prompts and structured response schemas. Validate every model output before it crosses the application boundary.
- Apply input and output guardrails and treat retrieved content and output as untrusted.
- Create an approved-source ingestion path with quarantine, file validation, malware-scan boundary, rights/classification metadata, versioning, tenant/product scope, publication state, deletion, and re-index records.
- Enforce tenant/product/source authorization before retrieval and in the index query. Add allowed and denied two-tenant tests.
- Exclude active exam content, answer keys, hidden rubrics, private messages, KYC/payment material, secrets, and prohibited data classes.
- Expose no model tools in the initial release. Define a typed tool port for future work with default deny.
- Implement timeouts, bounded retries, circuit breaker, input/output/token/concurrency limits, per-user/tenant/feature/company budgets, and an emergency kill switch.
- Fail safely to the non-AI workflow.
- Standard logs and SOC events contain metadata only. Never include raw prompts, responses, retrieved chunks, personal identifiers, private messages, exam answers, or secrets.
- Attach stable low-cardinality product, feature, team, and environment attribution. Do not use personal data in AWS request metadata or metric labels.

Evaluation requirements:
- Build a repeatable offline runner tied to model, prompt, guardrail, retriever, dataset, locale, and code versions.
- Cover representative normal cases, missing/conflicting sources, direct and indirect injection, system-prompt requests, encoded attacks, sensitive-data requests, other-tenant identifiers, invalid output, timeout, throttling, guardrail failure, and budget exhaustion.
- Measure task acceptance plus grounded correctness, faithfulness, citation quality, refusal, safety, latency, and cost where applicable.
- Require a human-reviewed release report; do not let a model judge be the only Tier 2 or Tier 3 approver.

Observability and security requirements:
- Add OpenTelemetry spans and Prometheus metrics with bounded labels.
- Add Grafana panels for requests/outcomes, stage latency, tokens, estimated cost, budgets, guardrails, validation, retrieval, and evaluation trend.
- Emit versioned SOC events for prompt injection blocked, cross-tenant retrieval denied, sensitive input/output blocked, tool authorization denied, and AI budget abuse.
- Add runbooks for provider outage, suspected data leakage, retrieval poisoning, uncontrolled spend, and emergency feature shutdown.

Testing requirements:
- Unit-test policy, routing, budget, validation, and redaction rules.
- Integration-test the Bedrock adapter through a deterministic fake; live provider tests are opt-in and never run in ordinary CI.
- Test allowed and denied tenant/source paths, deletion, stale source rejection, injection, invalid schema, logging redaction, quotas, hard stop, and kill switch.
- Keep tests deterministic and do not store real prompts, personal data, secrets, copyrighted exam content, or customer documents in fixtures.

Delivery:
- Work in small reviewable milestones: contracts/policy, fake provider, evaluation runner, Bedrock adapter, ingestion/RAG, staff APIs, monitoring/SOC, pilot UI.
- Update OpenAPI, migrations, ADRs, acceptance criteria, data flow, threat model, privacy/retention, observability, runbooks, and changelog with each behavior change.
- Run the repository validator, lint, type checks, focused unit/integration tests, and security checks. Report commands, results, remaining risks, and the exact controls still requiring owner approval.
- Do not deploy or enable a customer-facing feature without the documented release gate.
```

