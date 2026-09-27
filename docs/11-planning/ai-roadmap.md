# AI implementation roadmap

## Objective

Establish a safe, measurable AI foundation and prove two valuable use cases before expanding to learner-facing, customer-facing, or physical-world features. This roadmap does not authorize production AWS resources, customer-data processing, or autonomous actions.

## Phase 0: decisions and evidence (days 0-30)

**Outcome:** Oxinov can run a controlled experiment without uncertain ownership or data use.

| Work | Evidence of completion |
| --- | --- |
| Name the executive sponsor, AI product owner, platform lead, data steward, security/privacy owner, domain reviewers, and FinOps owner | Signed owner register and escalation path |
| Approve two pilots: internal knowledge assistant and LMS authoring copilot | Intake record, baseline, users, outcome, risk tier, budget, stop threshold |
| Inventory candidate documents and course sources | Classification, ownership, licence, language, tenant, retention, deletion, approval status |
| Select initial Bedrock model aliases after an `ap-south-1` capability check | Shortlist, Region/retention record, evaluation plan; no model ID in domain code |
| Build representative evaluation sets | At least 50 cases per pilot, expanded for each launch language and critical attack/failure class |
| Set budgets and service quotas | Daily/monthly pilot ceiling, per-user/feature limit, alert and hard-stop owner |
| Complete privacy, threat, and data-flow review | Approved diagrams, controls, Nepal legal-review questions, incident/kill-switch plan |

**Exit gate:** owners, data, evaluation, budget, security controls, and stop conditions are approved. Otherwise stop.

## Phase 1: AI foundation and staff pilot (days 31-90)

**Outcome:** One gateway supports two staff-only draft workflows in non-production and a limited staff pilot.

### Build

- Add the AI gateway module to the platform backend with trusted tenant/actor context.
- Implement a Bedrock provider adapter, model aliases, timeouts, retries, hard budgets, and an emergency disable flag.
- Add versioned prompts, structured outputs, input/output guardrails, and metadata-only telemetry.
- Create the approved-source ingestion pipeline and access-scoped retrieval for the internal assistant.
- Implement an evaluation runner and regression report tied to immutable versions.
- Add Grafana panels for traffic, latency, tokens, estimated cost, guardrail/validation outcomes, and evaluation trend.
- Emit normalized SOC events for injection blocks, cross-tenant retrieval denials, sensitive-data blocks, tool denials, and budget abuse.

### Pilot

- Staff knowledge assistant: answer with citations or refuse; no tools.
- LMS authoring copilot: create course outlines, lesson summaries, practice-question drafts, rubrics, and translations for instructor review; no publishing.

**Exit gate:** zero critical security findings; accepted quality threshold; cost within ceiling; reviewers can correct outputs; kill switch and runbook exercised; product owner approves continuation.

## Phase 2: grounded LMS pilot (months 3-6)

**Outcome:** A small learner group can use a tutor grounded in published course content.

- Restrict retrieval to the learner's tenant, enrolment, published course version, locale, and accessible resources.
- Exclude active attempts, question-bank answers, hidden rubrics, private chats, and instructor-only material.
- Require citations and support “I do not know” behavior.
- Add transcript, subtitle, and translation draft workflows behind language-specific evaluation and review.
- Test Japanese first with the first approved course; add a language only after its evaluation passes.
- Measure learning checks, helpfulness, citation use, refusal quality, safety, accessibility, latency, and cost.

**Exit gate:** learner and instructor review supports benefit; no answer leakage or cross-tenant disclosure; every launched language meets its threshold; support and incident procedures work.

## Phase 3: supervised business workflows (months 6-9)

**Outcome:** AI assists customer support and grading without replacing accountable people.

- Add read-only support context and human-approved response drafts.
- Add rubric-grounded assignment feedback and grading suggestions with instructor decision and learner appeal.
- Introduce a typed, read-only tool registry. State-changing tools remain disabled until their own Tier 3 gate.
- Pilot a read-only SOC analyst assistant that cites alerts, logs, runbooks, and asset records. It does not block traffic, disable accounts, alter infrastructure, or close incidents.
- Add drift, language, fairness, reviewer-disagreement, and cost reviews.

**Exit gate:** review workload is acceptable; outputs remain traceable; no unauthorized action path; product and security owners approve each workflow separately.

## Phase 4: one predictive or edge pilot (months 9-12)

**Outcome:** Oxinov validates one non-LLM use case in robotics, IoT, equipment, or agriculture.

- Select one problem with sensor/image data, an expert owner, measurable baseline, safety boundary, and customer evidence.
- Use SageMaker AI for experiment tracking, training, evaluation, and deployment when custom ML is justified.
- Use AWS IoT Greengrass for approved edge inference when latency, connectivity, privacy, or physical integration needs local processing.
- Keep deterministic safety control outside the model; design manual override and safe state.
- Produce a model card, dataset lineage, edge/cloud monitoring, rollback, and field-test report.

**Exit gate:** measured improvement over the baseline, safe field behavior, supported operations, and a product release decision. Otherwise archive the experiment and evidence.

## First 30-day action list

1. Appoint the seven accountable roles; roles may overlap but ownership may not be blank.
2. Choose the first approved internal document collection and one LMS course-authoring workflow.
3. Record the current time, cost, error, and review baseline for both workflows.
4. Classify and approve the source documents; exclude confidential customer data from the first pilot.
5. Create 50-100 evaluation cases per pilot, including prompt injection, unsupported claims, missing sources, secret requests, and cross-tenant identifiers.
6. Confirm Bedrock model, Guardrails, evaluation, and inference-profile support in Mumbai for the candidates.
7. Approve a small non-production budget, quotas, owner alerts, and a hard stop.
8. Review the [implementation prompt](../../prompts/IMPLEMENT-AI-FOUNDATION.md) and split Phase 1 into small issues.

## Workstreams and dependencies

| Workstream | Depends on | Deliverables |
| --- | --- | --- |
| Product and governance | Executive owner | Intake, risk tier, policy, disclosure, review, launch decision |
| Data and RAG | Data steward and source owners | Approved corpus, lineage, index, deletion and freshness tests |
| AI platform | Platform backend and AWS non-production account | Gateway, adapters, prompts, guardrails, retrieval, usage ledger |
| Evaluation | Domain reviewers and representative cases | Regression suite, thresholds, human-review report |
| Security and privacy | Threat model and data flow | Adversarial tests, SOC events, incident exercise, legal questions |
| FinOps and operations | Tagged profiles, quotas, telemetry | Budgets, dashboards, alerts, cost reconciliation, on-call runbook |
| LMS pilot | Platform foundation and approved course | Authoring copilot, later grounded tutor, instructor/learner review |

## Delivery rules

- Each phase has an explicit stop/continue decision. Work does not advance automatically.
- A product feature receives its own release gate even if the shared gateway is approved.
- Expansion to another language, model, Region, tenant data class, tool, or automated action is a controlled change.
- No future Oxinov product is scaffolded solely to demonstrate AI. It must pass the normal product release gate.
- Progress is reported by accepted business outcomes, quality, safety, reliability, and cost rather than model calls or generated-token volume.

