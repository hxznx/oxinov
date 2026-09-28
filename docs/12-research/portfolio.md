# Oxinov R&D portfolio

**Status:** Current · **Owner:** Founder · **Last reviewed:** 2026-09-29

## Status and use

This is the decision register for research opportunities. Every item below is a **candidate**, not an approved product, budget, customer pilot, or production capability. Funding starts only after G0-G1 approval under the [R&D operating system](README.md). New product folders and customer-facing pilots remain blocked by the company release gate.

Portfolio decisions use the multidimensional scorecard, evidence quality, hard risk gates, available capacity, and the core/adjacent/frontier balance. Do not rank candidates using enthusiasm or score alone.

## First-wave recommendation

Subject to named owners and budget, the first wave should select no more than three initiatives:

1. `RD-2026-000` because user evidence and usability are the base of every product decision;
2. `RD-2026-001` because it reduces risk in the current platform and NFR-11/NFR-15 obligations; and
3. `RD-2026-002` because it tests whether the first product improves learning, not only software completion.

The recommendation does not authorize implementation. Each lead must complete the project template, scoring evidence, data/IP review, time box, and stop thresholds.

## Candidate register

| ID | Horizon | Theme | Decision question | Smallest decisive evidence | Current readiness | Status |
| --- | --- | --- | --- | --- | --- | --- |
| RD-2026-000 | Core | Cross-product user research and usability foundation | Which shared journeys, language, trust cues, accessibility patterns, and recovery behaviors let Oxinov's priority users succeed with minimal help? | Evidence-backed user needs and a repeatable benchmark for five shared/LMS tasks across representative users, mobile/desktop, English/Nepali, low bandwidth, and accessibility contexts | ORL 1 | Proposed first wave |
| RD-2026-001 | Core | Tenant isolation and authorization assurance | Which automated methods catch cross-tenant defects across API, PostgreSQL RLS, storage, cache, jobs, exports, and AI retrieval before release? | Two-tenant fault-injection test matrix against the implemented LMS slice, with detection rate, false positives, runtime, and missed paths | ORL 2 | Proposed first wave |
| RD-2026-002 | Core | Learning efficacy and adaptive practice | Which feedback and practice sequence improves retention for an initial JLPT N5 skill without overstating official-exam validity? | Consent-approved or synthetic pilot comparing a baseline sequence with one adaptive sequence; predeclared learning measure and content-rights review | ORL 1 | Proposed first wave |
| RD-2026-003 | Core/Adjacent | Nepali and multilingual AI evaluation | Are candidate models reliable, safe, and affordable enough for approved Oxinov drafting and support tasks in Nepali, English, and Japanese? | Licensed evaluation set, non-AI baseline, blinded human rubric, hallucination/privacy/prompt-injection tests, latency, and unit cost | ORL 1 | Proposed first wave |
| RD-2026-004 | Core | Nepal payment and renewal reliability | Which provider-neutral flow remains correct under duplicate, delayed, missing, and out-of-order Khalti/eSewa events and prepaid renewal? | Sandbox event corpus and state-machine simulation proving idempotent ledger and entitlement outcomes; no access from redirect | ORL 2 | Evidence queue |
| RD-2026-005 | Adjacent | Commodity Market agricultural workflow and price-data feasibility | Is there a painful, repeatable transaction problem for a reachable Nepal pilot group, and can Oxinov lawfully obtain useful market-price data? | Structured interviews with a selected cooperative/buyer cohort, observed workflow, source/licence review, and explicit no-build decision criteria | ORL 1 | Blocked by pilot segment and owner |
| RD-2026-006 | Frontier | Low-cost irrigation sensing | Can a safe, low-cost sensor configuration produce sufficiently stable soil-moisture signals for a later AgriTech decision? | Bench or simulated comparison across candidate sensors, calibration drift, power, connectivity, environmental limits, and total cost; no field actuation | ORL 1 | Watchlist |
| RD-2026-007 | Frontier | Earth-observation decision support | Can licensed satellite data add decision value for agriculture or disaster use cases that a reachable partner actually owns? | Desk study plus one historical, non-operational case using licensed data, documented accuracy limits, and regulatory/data-rights review | ORL 1 | Watchlist |

## Project-specific guardrails

### RD-2026-000 — Cross-product user research and usability foundation

- Follow the [user-centred product research and usability standard](user-centered-product-standard.md).
- Do not treat staff opinions, AI-generated personas, feature requests, survey preferences, or analytics alone as proof of user need.
- Recruit for behavior and context, including low-bandwidth mobile use, English and Nepali, disability, low digital confidence, and people who provide or support the service.
- Keep consent, identities, recordings, transcripts, and raw support or analytics data outside Git in restricted storage.
- Baseline sign-in, product/course discovery, enrollment, resume, and assessment-result tasks before setting final improvement targets.
- Transfer the resulting user needs, shared patterns, metrics, and gates into every product charter and release review without creating shared product business logic.

### RD-2026-001 — Tenant isolation and authorization assurance

- Maps to FR-TENANT-1605, NFR-11, NFR-15, ADR-006, and the security threat model.
- Use only synthetic tenants and safe test fixtures.
- A test harness may exercise approved APIs and database policies; it receives no production credentials and cannot bypass RLS.
- Stop if the experiment requires weakening a production control or storing sensitive payloads in SOC events.
- Transfer only with deterministic allowed/denied tests, runtime budget, ownership, CI integration plan, and safe failure diagnostics.

### RD-2026-002 — Learning efficacy and adaptive practice

- Maps to FR-PLAYER-402, FR-ANALYTICS-801, FR-LANG-901, FR-EXAM-1202 through FR-EXAM-1205, NFR-09, and NFR-13 if AI is used.
- Do not copy official JLPT questions or imply official scoring or certification.
- Research involving learners needs informed consent, minimum-age handling, data minimization, accessibility, and an approved analysis plan.
- Do not use high-stakes placement or restrict course access based solely on an experimental model.
- Stop if the learning measure cannot distinguish intervention effect from content difficulty or prior knowledge within the approved sample and time box.

### RD-2026-003 — Nepali and multilingual AI evaluation

- Maps to FR-AI-1701 through FR-AI-1704 and NFR-13.
- Use public, licensed, synthetic, or purpose-approved evaluation data; record language, domain, source, rights, and limitations.
- Compare providers through the platform-neutral AI boundary and version every prompt, model, retrieval source, tool, and safety setting.
- Measure unsupported claims, harmful bias, privacy leakage, prompt injection, tenant separation, latency, cost, and human-review burden.
- Stop or narrow the use case if no candidate beats the non-AI baseline at an acceptable risk and cost.

### RD-2026-004 — Nepal payment and renewal reliability

- Maps to FR-CATALOG-303, FR-MGMT-1402, FR-MOBILE-1503, and ADR-012.
- Use provider sandboxes and synthetic money; do not log credentials or personal payment data.
- Browser redirects never grant access. Provider events are verified and idempotent.
- Separate provider behavior findings from legal, tax, merchant-eligibility, and pricing decisions that require accountable owners.

### RD-2026-005 — Commodity Market agricultural workflow and price-data feasibility

- The Commodity Market charter stays draft. Discovery does not authorize `market-web`, `market-api`, or a market database.
- Record participant consent, compensation, location granularity, and safe handling of contact or farm information.
- Verify rights to every market-price source before collecting or republishing it.
- Stop if the selected segment has no repeated transaction pain, no reachable operating partner, or no lawful data path.

### RD-2026-006 and RD-2026-007 — Frontier options

- Keep spend and scope inside the frontier allocation. Core platform or LMS delivery cannot be delayed to preserve a frontier experiment.
- No automatic irrigation, drone, radio, satellite, or safety-critical operation occurs without dedicated legal, safety, and operating approval.
- Hardware trials require a responsible operator, equipment inventory, site permission, emergency stop or safe-state design, and disposal plan.
- Geospatial outputs state their resolution, date, uncertainty, licence, and prohibited uses; they are not used for safety-critical decisions.

## Register fields for approved work

When an item passes G1, replace its summary-only entry with a linked project record containing:

- sponsor, lead, reviewers, collaborators, and conflicts of interest;
- pillar, product or platform relationship, work class, and related FR/NFR/ADR IDs;
- hypothesis, baseline, measures, thresholds, time box, tranche budget, and stop conditions;
- ORL level, scorecard with evidence, data class, dataset lineage, licences, IP status, and regulatory review;
- artefact and environment locations, access expiry, actual spend, result, reviewer finding, and decision; and
- transfer owner or archive location, with the next review date.

## Portfolio review questions

At every monthly review ask:

1. What decision became easier because of new evidence?
2. Which assumption is still carrying the most risk?
3. What can be stopped, narrowed, combined, or transferred now?
4. Is any initiative stale, unowned, over budget, unsafe, or blocked by rights?
5. Is the horizon mix protecting the platform and LMS while preserving a few real options?
6. Can another qualified person reproduce the most important result?
7. What knowledge, dataset, tool, contract, or partnership can be reused elsewhere?

