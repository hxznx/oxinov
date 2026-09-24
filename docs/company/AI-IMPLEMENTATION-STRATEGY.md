# Oxinov AI implementation strategy

**Status:** Proposed company strategy  
**Date:** 2026-09-24  
**Decision owner:** To be assigned  
**Applies to:** Oxinov Platform, Oxinov Edu, future Oxinov products, internal operations, and R&D

## Executive decision

Build one governed AI capability for the whole company. Products call it through an internal **AI gateway**; browser and mobile clients never call a model provider directly. Use **Amazon Bedrock first** for generative AI and retrieval-augmented generation (RAG). Use **Amazon SageMaker AI later** for predictive, computer-vision, anomaly-detection, and custom models when a validated use case needs training or deeper control.

Start with two narrow, reviewable use cases:

1. An internal knowledge assistant grounded only in approved company documents.
2. An Oxinov Edu authoring copilot that creates drafts for instructors to review.

Do not train a foundation model, launch a general autonomous agent, or build every proposed AI product in the first release. RAG, prompt design, evaluation, and human review should be exhausted before fine-tuning is approved.

## Why this approach

- Amazon Bedrock provides managed access to foundation models, Guardrails, Knowledge Bases, evaluation, and agent capabilities without Oxinov operating model infrastructure.
- SageMaker AI is appropriate for custom training, classical machine learning, vision, time-series, and MLOps. It adds cost and operating work that the first generative use cases do not need.
- A provider-neutral gateway keeps domain code independent of one model vendor and provides a single place for access control, tenant isolation, safety, cost attribution, audit, and shutdown.
- Small pilots create the evaluation data and operating experience needed for later customer-facing features.

The service choice follows the [AWS Bedrock or SageMaker decision guide](https://docs.aws.amazon.com/decision-guides/latest/decision-guides/bedrock-or-sagemaker.html). The technical boundary is defined in the [AI platform architecture](../architecture/AI-PLATFORM-ARCHITECTURE.md).

## Business outcomes

AI work must improve a measured business or learner outcome. A demo is not a launch reason.

| Outcome | First measure | Initial target for a pilot |
| --- | --- | --- |
| Faster course production | Median time from brief to instructor-approved draft | At least 30% less time with no quality regression |
| Better knowledge access | Answer success on an approved internal question set | At least 85% grounded correctness and required citations |
| Useful learner support | Tutor helpfulness and learning check improvement | Improvement over the non-AI baseline; no exam-answer leakage |
| Lower support effort | Human handling time for supported queries | At least 20% less time after review overhead |
| Controlled cost | Cost per accepted task by product and tenant | Within the approved per-task and monthly budget |
| Safe operation | Critical data, authorization, or tenant-isolation incidents | Zero |

Targets are hypotheses until the owner approves a baseline, evaluation set, and budget.

## Use-case portfolio

### Recommended sequence

| Order | Use case | Value | Risk | Launch condition |
| --- | --- | --- | --- | --- |
| 1 | Internal policy and engineering knowledge assistant | High | Low to medium | Approved sources, citations, access filters, staff pilot |
| 2 | LMS course, quiz, rubric, summary, and feedback drafts | High | Medium | Instructor approval; licensed sources; no automatic publishing |
| 3 | Transcripts, subtitles, translation drafts, and media metadata | High | Medium | Native-speaker sampling by language and rights review |
| 4 | Learner tutor grounded in published course content | High | Medium | Citation and refusal thresholds; exam boundary tests; escalation path |
| 5 | Customer-support answer drafts | Medium | Medium | Read-only context, human send approval, privacy controls |
| 6 | Assignment and short-answer grading assistance | Medium | High | Rubric evidence, instructor decision, appeal and audit trail |
| 7 | SOC analyst assistant | Medium | High | Read-only SIEM access, evidence links, analyst approval, no response execution |
| 8 | Media-production workflow assistance | Medium | Medium | Rights metadata, review, watermark/disclosure where required |
| 9 | IoT, robotics, agriculture, and equipment prediction | High | High | Separate dataset, safety case, SageMaker/edge pilot, domain owner |

### Sector opportunities

| Oxinov area | Appropriate AI | Technology direction |
| --- | --- | --- |
| Education and LMS | Authoring drafts, grounded tutor, adaptive practice suggestions, translation, transcripts, feedback assistance | Bedrock through AI gateway; RAG on approved content; speech adapters |
| AI products | Governed document Q&A, workflow assistants, evaluation services, customer AI API | Reuse the gateway as the platform boundary; approve each product separately |
| Engineering, cloud, and cyber | Code/document assistance, cloud knowledge search, SOC triage summaries | Bedrock; read-only tools first; analyst or engineer approval |
| Media and studio | Transcripts, captions, localization drafts, scripts, asset metadata | Speech/media adapters plus Bedrock; rights and review controls |
| Robotics and IoT | Anomaly detection, vision, predictive maintenance, edge inference | SageMaker AI and AWS IoT Greengrass; deterministic control remains outside the LLM |
| AgriTech | Sensor and image analysis, disease or yield models, grounded advisory drafts | SageMaker AI and edge/cloud pipelines; agronomist validation for advice |
| Research and space | Document search, experiment analysis, geospatial model assistance | Restricted RAG or task-specific ML with dataset and licence review |

## Language and speech plan

Oxinov Edu needs Japanese, Korean, Chinese, Nepali, English, Russian, Arabic, and Spanish. Model capability must be tested by **language, dialect, task, and learner level** rather than inferred from a provider's general multilingual claim.

As of this review:

- [Amazon Translate's language table](https://docs.aws.amazon.com/translate/latest/dg/what-is-languages.html) lists Japanese, Korean, Chinese, English, Russian, Arabic, and Spanish, but does not list Nepali.
- [Amazon Transcribe's language table](https://docs.aws.amazon.com/transcribe/latest/dg/supported-languages.html) lists Nepali (`ne-NP`) and the other target languages, although feature support differs by language.
- [Amazon Polly's language table](https://docs.aws.amazon.com/polly/latest/dg/supported-languages.html) lists several target languages but does not list Nepali.

Therefore:

- Implement translation, speech-to-text, text-to-speech, and pronunciation scoring as separate provider ports.
- Do not label generic speech recognition confidence as pronunciation proficiency.
- Build native-speaker evaluation sets for every launched language.
- Provide a human-review workflow and a fallback provider for language gaps.
- Keep active exam answers and confidential question banks out of tutor retrieval.

## Operating model

One person may hold several roles while the company is small, but each role must be named.

| Role | Accountability |
| --- | --- |
| Executive sponsor | Approves budget, risk appetite, and stop/continue decisions |
| AI product owner | Owns use-case outcome, scope, users, and launch decision |
| AI platform lead | Owns gateway, provider adapters, reliability, evaluation plumbing, and cost controls |
| Data steward | Approves sources, classifications, rights, retention, and deletion |
| Domain reviewer | Defines truth and quality for education, language, cyber, agriculture, or another field |
| Security and privacy owner | Threat model, access review, incident response, legal-review coordination |
| Operations and FinOps owner | Service quotas, dashboards, budgets, on-call, and cost attribution |

The governance lifecycle is defined in [AI governance](../security/AI-GOVERNANCE.md).

## Investment rules

- Approve a use case before choosing a model.
- Record the baseline process, expected benefit, risk tier, data sources, user group, owner, budget, and stop threshold.
- Use model aliases such as `text-fast`, `text-quality`, `embedding`, `vision`, and `speech`; keep vendor model IDs out of domain code.
- Route all use through application inference profiles or an equivalent tagged provider construct.
- Set per-user, per-tenant, per-feature, and company-wide limits.
- Cache safe reusable results, cap input and output size, and reject unbounded batch work.
- Track cost per successful task, not only total tokens.
- Re-evaluate the selected model when its version, region, price, or safety behavior changes.

AWS documents application inference profiles and request metadata for [cost allocation](https://docs.aws.amazon.com/bedrock/latest/userguide/cost-mgmt-application-inference-profiles.html). Request metadata must use stable internal categories and never contain personal data or secrets.

## Success scorecard

Every production AI feature reports:

- business outcome and adoption;
- grounded correctness, completeness, faithfulness, citation precision, and refusal quality where applicable;
- human acceptance, edit, override, and appeal rates;
- safety block and false-block rates;
- quality by language and customer segment;
- p50 and p95 latency, availability, provider errors, and fallback rate;
- input, output, and cached token usage, estimated cost, and cost per accepted result;
- retrieval hit quality and stale-source rate;
- confirmed data, authorization, or tenant-isolation incidents.

[Amazon Bedrock evaluation](https://docs.aws.amazon.com/bedrock/latest/userguide/evaluation.html) supports automatic, human, and model-based evaluation. Oxinov's release decision must still be based on its own representative cases and domain reviewers.

## Go/no-go gate

An AI feature may launch only when:

1. a product owner and operating owner are named;
2. the data inventory, rights, retention, processing regions, and privacy review are recorded;
3. evaluation cases represent each launch language and important failure mode;
4. the feature meets approved quality and safety thresholds;
5. tenant, role, prompt-injection, tool-authorization, and data-leakage tests pass;
6. user disclosure, review, correction, appeal, and support paths exist where applicable;
7. budgets, quotas, latency objectives, fallback behavior, monitoring, and alerts are active;
8. a kill switch, rollback procedure, incident runbook, and responsible on-call contact exist;
9. high-impact outputs remain human decisions; and
10. the release gate is saved with model, prompt, retriever, guardrail, dataset, and evaluation versions.

## First decision to make

Name an AI product owner and approve a 90-day foundation pilot with the internal knowledge assistant and LMS authoring copilot. Do not begin a learner-facing tutor until the gateway, evaluation harness, approved content pipeline, and tenant-isolation tests are working.

## Research basis

- [Amazon Bedrock overview](https://aws.amazon.com/documentation-overview/bedrock/)
- [AWS decision guide: Amazon Bedrock or SageMaker AI](https://docs.aws.amazon.com/decision-guides/latest/decision-guides/bedrock-or-sagemaker.html)
- [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-how.html)
- [Amazon Bedrock Knowledge Bases](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-how-it-works.html)
- [Amazon Bedrock evaluation](https://docs.aws.amazon.com/bedrock/latest/userguide/evaluation.html)
- [Amazon SageMaker AI training](https://docs.aws.amazon.com/sagemaker/latest/dg/train-model.html)
- [Amazon SageMaker MLOps](https://docs.aws.amazon.com/en_en/sagemaker/latest/dg/mlops.html)
- [AWS IoT Greengrass ML inference](https://docs.aws.amazon.com/greengrass/v2/developerguide/perform-machine-learning-inference.html)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)
- [Nepal Privacy Act, 2075](https://lawcommission.gov.np/content/12261/the-privacy-act-2075/)

