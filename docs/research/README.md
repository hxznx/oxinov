# Oxinov research and development operating system

## Purpose

This document is the company operating system for turning uncertainty into reusable knowledge, validated technology, and evidence-backed product decisions. It applies across Oxinov Education, AI, Engineering, Services, Robotics and Automation, Media, AgriTech, Space, Research, and Production.

The system permits broad exploration without silently approving a product, production deployment, regulated activity, or new product plane. OxinovLMS and the company-platform foundation remain the delivery priority. Research informs those products and the later portfolio; it does not bypass their requirements, release gates, architecture boundaries, or operating owners.

Oxinov uses the OECD Frascati criteria to distinguish R&D from ordinary delivery. Work is recorded as R&D only when it is novel, creative, uncertain, systematic, and intended to produce transferable or reproducible knowledge. Customer discovery, routine implementation, maintenance, training, and market analysis can support R&D but are not labeled R&D unless they meet those criteria.

## Product foundation decision

Research is the evidence foundation beneath every Oxinov product. Each product maintains two linked streams: user and product research proves the right problem, journey, language, and outcome; technical R&D proves uncertain capabilities. Product research is mandatory even when it does not qualify statistically as R&D.

No material feature enters delivery without a linked, evidence-backed user need, a testable product hypothesis, and defined usability and outcome measures. No product launches without representative end-to-end usability, accessibility, trust, recovery, device, and network evidence. The normative process is the [user-centred product research and usability standard](USER-CENTERED-PRODUCT-STANDARD.md).

## Outcomes

The operating system must produce:

1. fewer simultaneous, unsupported initiatives;
2. more small, time-boxed experiments with explicit hypotheses and stop conditions;
3. reproducible evidence, including negative results;
4. safer transfer of validated work into products and services;
5. a visible record of people, time, money, datasets, partners, intellectual property, risks, and decisions; and
6. a growing body of reusable knowledge that compounds across the company.

## Work classification

| Class | Primary question | Required record | Destination |
| --- | --- | --- | --- |
| Research | What is true, possible, or not yet understood? | Research brief, method, evidence, and closeout | Knowledge base, publication, patent review, or further experiment |
| Experimental development | Can the knowledge become a reproducible capability? | Experiment record, prototype, evaluation, and readiness assessment | Product transfer proposal or archive |
| Product discovery | Is there a real user problem and a viable adoption path? | Interviews, observations, alternatives, and decision | Product charter or stop decision |
| Product delivery | How do we build an approved capability reliably? | FR/NFR links, design, code, tests, operations, and release evidence | Approved product plane |
| Operations or maintenance | How do we keep an existing capability safe and useful? | Issue, change, validation, and runbook updates | Existing service |

Do not use the R&D label to hide routine feature delivery, capitalize ordinary engineering work, avoid a product release gate, or create an unowned prototype.

## Operating principles

- **Question before solution:** every initiative starts with a falsifiable question or decision to be informed.
- **Evidence before scale:** begin with the smallest safe experiment that can change a decision.
- **Reproduce before transfer:** another qualified person must be able to understand the method, inputs, result, limitations, and next step.
- **Learn from stopping:** a well-supported stop decision is a successful R&D outcome.
- **Portfolio before pet projects:** fund a balanced set of options, not the loudest idea.
- **Safety and rights by design:** privacy, tenant isolation, security, safety, content rights, intellectual property, and regulation are part of the method.
- **Production is not a laboratory:** use synthetic, public, or properly licensed data by default and isolate prototypes from customers and production credentials.
- **One architecture:** research does not create a competing company platform, identity system, database boundary, or deployment baseline.
- **Human accountability:** AI may assist research and draft artifacts, but a named person owns the hypothesis, methods, approval, and claims.
- **Users as evidence partners:** observe intended users throughout discovery, design, beta, and live operation; do not substitute stakeholder preference, analytics alone, or AI-generated personas for real research.

## Governance and decision rights

Start with a small virtual R&D council rather than a new department. One person may hold several roles while the company is small, but the sponsor and independent reviewer cannot be the same person at a continuation or transfer decision.

| Role | Accountability |
| --- | --- |
| Executive sponsor | Sets strategic themes, capacity ceiling, risk appetite, and final funding decisions |
| R&D portfolio owner | Maintains the portfolio, chairs reviews, challenges weak evidence, and reports outcomes |
| Research lead | Owns the question, method, budget, evidence, and closeout for one initiative |
| Product or domain owner | Confirms user relevance and accepts or rejects a transfer proposal |
| Data and security reviewer | Approves data classification, access, isolation, retention, threat controls, and safe disposal |
| Legal, regulatory, and IP reviewer | Reviews licences, participant consent, regulated activity, partner terms, ownership, patentability, and publication restrictions |
| Independent reviewer | Repeats or critically reviews the method and evidence before major continuation or transfer |
| Knowledge steward | Keeps IDs, artefacts, decision records, references, and publication metadata findable |

Unassigned roles remain explicit blockers. A title such as founder, CTO, or product owner does not automatically satisfy a review role unless the person accepts it in the project record.

## Portfolio model

Leadership approves an R&D capacity floor and ceiling each quarter after protecting committed product, security, support, and recovery work. Until the team and cash budget are known, the following are planning ranges rather than approved spending:

| Horizon | Purpose | Planning range | Examples |
| --- | --- | --- | --- |
| Core, 0-18 months | Improve launched or foundation capabilities and reduce material risk | 60-70% | LMS learning efficacy, tenant isolation, identity, Nepal payments, AI evaluation |
| Adjacent, 12-36 months | Validate an adopted or closely related product opportunity | 20-30% | Commodity Market workflows, skill matching, services trust, IoT platform foundations |
| Frontier, 3+ years | Preserve low-cost options in uncertain long-horizon fields | Up to 10% | robotics, smart sensing, earth observation, space simulation |

These ranges apply to R&D capacity, not total company spending. Frontier work stays at literature, simulation, bench, or partner-study level until the core platform is funded and the relevant release or regulatory gate is satisfied. No more than one customer-facing pilot for an unlaunched product runs at a time unless separate accountable teams and budgets are approved.

The current candidate register is in [the R&D portfolio](PORTFOLIO.md). Candidate status is not funding approval.

## Intake and stage gates

Each initiative receives an ID `RD-YYYY-NNN`. Individual experiments use `RD-YYYY-NNN-EXP-NN`. Every gate ends with `continue`, `pivot`, `pause`, `stop`, or `transfer`; silence is not approval.

| Gate | Purpose | Minimum evidence to exit |
| --- | --- | --- |
| G0 Opportunity | Record the question and strategic relevance | Named sponsor and lead; work class; affected pillar or product; initial safety, rights, and regulatory screen |
| G1 Research brief | Make uncertainty, method, cost, and decision explicit | Completed project template; baseline; hypothesis; success and stop thresholds; time box; data and IP plan; scorecard |
| G2 Feasibility | Test the riskiest assumption cheaply | Literature or prior-art review; method and inputs; first reproducible evidence; limitations and updated risk assessment |
| G3 Reproducible proof | Demonstrate the effect in a controlled environment | Versioned artefacts; repeated result or independent review; cost and failure analysis; no unresolved critical safety or rights issue |
| G4 Relevant-environment prototype | Test a bounded prototype in a representative non-production setting | Evaluation against baseline; threat and privacy review; rollback/disposal plan; operational estimate; product-owner review |
| G5 Controlled pilot | Learn from approved real use | Product charter or explicit pilot authorization; consent and support plan; monitored scope; incident and stop mechanism; pilot closeout |
| G6 Transfer or close | Move ownership or preserve learning | Product owner accepts requirements, architecture, budget, tests, operations, and risks; or an archive records why work stopped |

G5 never grants a general product launch. A new product still needs every release-gate item in the [company roadmap](../planning/COMPANY-PLATFORM-ROADMAP.md#release-gate-for-every-new-product). Customer-facing behavior must be linked to existing FR/NFR IDs or added to the relevant approved requirements before implementation.

## Multidimensional scorecard

Score each dimension from 0 to 5 and record the evidence behind the score. The weighted total helps compare initiatives but cannot override a hard legal, safety, security, privacy, rights, or funding blocker.

| Dimension | Weight | Question |
| --- | ---: | --- |
| Strategic fit | 15 | Does it advance an approved company pillar, platform milestone, or product requirement? |
| Customer or mission evidence | 15 | Is the problem observed, consequential, and owned by a reachable beneficiary? |
| Knowledge value | 10 | Is there real novelty and uncertainty, and will the result be reusable? |
| Technical tractability | 10 | Can the riskiest assumption be tested with available people, facilities, and time? |
| Platform leverage | 10 | Can the result strengthen shared contracts, identity, safety, data, or product capabilities without coupling product planes? |
| Economic or strategic option value | 15 | Could success improve revenue, cost, resilience, differentiation, or future choices? |
| Responsible feasibility | 10 | Are safety, privacy, security, rights, bias, and regulatory risks identifiable and controllable? |
| Capability and IP advantage | 10 | Will Oxinov gain defensible know-how, talent, data rights, partnerships, or protectable IP? |
| Cost and time to decisive evidence | 5 | Can a small investment produce a decision soon? |

Use the following default interpretation:

- **70-100:** candidate for the next funded tranche if all hard gates pass;
- **55-69:** revise the question, method, scope, or evidence plan before funding;
- **below 55:** park or stop unless the council records a strategic exception;
- **any hard blocker:** do not proceed beyond desk research until resolved.

Scores are snapshots, not promises. Update them at every gate and keep the earlier score so optimism and evidence changes are visible.

## Readiness scale

Oxinov uses an adapted readiness scale informed by NASA technology-readiness levels. It is an internal communication tool, not a claim of NASA review or certification.

| Level | Oxinov evidence state |
| --- | --- |
| ORL 1 | Principles, prior work, and the unresolved question are documented |
| ORL 2 | A concept and intended application are formulated; feasibility is still speculative |
| ORL 3 | A proof of concept demonstrates a critical function with synthetic or controlled inputs |
| ORL 4 | Components work together reproducibly in the lab or isolated software environment |
| ORL 5 | The prototype is evaluated in a representative non-production environment |
| ORL 6 | A bounded prototype is demonstrated with realistic workflows and operational constraints |
| ORL 7 | An authorized, monitored pilot operates in a limited real environment |
| ORL 8 | The product owner has accepted requirements, controls, tests, operations, and release evidence |
| ORL 9 | The capability has proven performance in normal operation and continues to be monitored |

Readiness is separate from value. A high-readiness capability can still be stopped for weak user value, economics, rights, or strategic fit.

## Experiment standard

Every experiment record must include:

- the hypothesis and the decision the result will inform;
- a baseline or comparison and measurable success, failure, and stop thresholds;
- method, sample, variables, assumptions, and known sources of error;
- dataset source, licence, classification, lineage, retention, and allowed use;
- versioned code, configuration, prompt, model, equipment, and dependency identifiers where applicable;
- raw and derived result locations, checksums where useful, and a reproducible analysis;
- negative, null, and unexpected findings, not only preferred results;
- security, privacy, safety, bias, accessibility, content-rights, and regulatory observations;
- actual people time, external spend, compute, and equipment use;
- reviewer, decision, limitations, next step, and knowledge that can be reused.

Use the [project and experiment template](PROJECT-TEMPLATE.md). Pre-register the method and thresholds before collecting decisive results when outcome-shopping would be a material risk.

## Data, environments, and security

- Local and CI research uses synthetic data. Staging uses synthetic or approved sanitized data. Production data is never copied into a prototype by convenience.
- Public data is not automatically unrestricted. Record its source, terms, allowed uses, attribution, collection date, and any personal or sensitive fields.
- A project using personal, tenant, KYC, payment, education, employment, location, agricultural, device, or security data needs a named data steward, purpose, minimization, access list, retention, deletion, and incident path before collection.
- Tenant data is never pooled across customers without an approved purpose and lawful basis. Any tenant-owned research record carries and verifies `tenant_id`; allowed and denied cross-tenant paths are tested.
- Research services have no direct production SQL, shell, secret, publishing, refund, payout, identity-role, or cross-tenant privilege. Use typed, versioned APIs and human approval where an authorized integration is required.
- Restricted datasets, credentials, participant records, unpublished patent material, incident evidence, and raw production exports stay outside Git in approved encrypted storage. Repository documents store only safe metadata and references.
- Prototype infrastructure is isolated, tagged with owner, project ID, data class, environment, expiry, and cost centre, and is removed or transferred at closeout.
- Any connected device, robot, actuator, drone, radio, laboratory equipment, or agricultural intervention requires a physical-safety review, emergency stop, responsible operator, site permission, and applicable regulatory approval before real-world use.

## AI research controls

AI work follows `govern`, `map`, `measure`, and `manage` throughout the lifecycle, consistent with the NIST AI Risk Management Framework. In addition to the experiment standard:

- define the intended use, excluded uses, affected people, human decision, and failure impact;
- maintain evaluation sets that are licensed, representative of intended languages and contexts, and protected against test contamination where practical;
- measure task quality, unsupported claims, bias, privacy leakage, prompt injection, tenant separation, security, latency, availability, and unit cost as relevant;
- version prompts, system instructions, tools, retrieval sources, model/provider, safety settings, and evaluation code;
- compare against a non-AI baseline and provide a manual path for every core workflow;
- require human review before generated content is published or an action changes data; and
- never give a model unbounded database, shell, secrets, payment, publishing, or cross-tenant access.

An AI prototype cannot enter a product merely because a demonstration looks convincing. It must satisfy the relevant FR-AI-1701 through FR-AI-1704 behavior, NFR-13, product requirements, and the transfer gate.

## Intellectual property, publications, and partnerships

Before external collaboration or disclosure, record:

- background IP brought by each party and ownership of new foreground IP;
- contributor and employment agreements, third-party licences, dataset rights, model terms, and open-source obligations;
- confidentiality, security, export or sector restrictions, publication review, attribution, patent filing, and commercialization rights;
- deliverables, acceptance evidence, funding source, payment terms, conflict of interest, and an exit route; and
- who may retain data, code, equipment, and results after the partnership ends.

Publish results on `oxinov.com/research` only after accuracy, participant privacy, security, customer confidentiality, content rights, IP, and regulatory review. Negative results may be published when safe; they prevent repeated waste and strengthen research credibility. Do not claim certification, official examination status, scientific consensus, or production readiness beyond the evidence.

## Measurement system

Use a small balanced set of measures. Do not reward idea counts, lines of code, patents, publications, or prototype demos by themselves.

| Layer | Measures |
| --- | --- |
| Capacity | Planned and actual people time, spend, compute, equipment, partner funding, and portfolio allocation by horizon |
| Flow | Time from intake to first experiment, experiment cycle time, time waiting for review, and percentage of stale initiatives |
| Evidence quality | Reproduction or independent-review rate, projects with baselines and stop thresholds, documented negative results, and data/IP completeness |
| Decisions | Continue, pivot, stop, and transfer counts; decision age; spend before decisive evidence |
| Transfer | Reusable assets accepted, requirements created or changed, product adoption, operational ownership, and time from proof to transfer |
| Outcomes | Learning or customer effect, risk reduction, revenue or cost impact, reliability, publications, partnerships, licences, and IP where attributable |
| Guardrails | Safety, privacy, security, rights, cross-tenant, budget, and regulatory incidents or near misses |

Report trends and the evidence behind them quarterly. A rising stop rate can be healthy if weak options are being closed earlier.

## Cadence

- **Weekly asynchronous update:** each active lead records evidence added, spend, blocker, and next decision.
- **Biweekly lab review:** methods, failures, reproducibility, and help needed; no status theatre.
- **Monthly portfolio council:** fund, pause, stop, pivot, or transfer; review balance and stale work.
- **Quarterly strategy review:** set themes and capacity, compare outcomes with company milestones, and publish a safe internal portfolio report.
- **Closeout within five working days:** archive artefacts, remove access and temporary infrastructure, record the decision, and name reusable learning.

## First 90 days

### Days 1-30: establish control

1. Appoint the executive sponsor, portfolio owner, security/data reviewer, IP reviewer, and knowledge steward.
2. Approve a quarterly capacity ceiling, external-spend limit, and the core/adjacent/frontier mix.
3. Screen the [candidate portfolio](PORTFOLIO.md), select at most three first-wave initiatives, and complete G0-G1 records.
4. Create approved storage, dataset, participant-consent, expense, and partner-agreement procedures.
5. Baseline current R&D-like time and spend without retroactively relabeling ordinary delivery.

### Days 31-60: run small experiments

1. Execute one decisive, bounded experiment per selected initiative.
2. Hold an independent method review before interpreting the results.
3. Record negative and inconclusive results, actual cost, and reproduction instructions.
4. Stop or narrow work that cannot meet its evidence threshold inside the approved time box.

### Days 61-90: institutionalize learning

1. Reproduce at least one result with a different reviewer or environment.
2. Make a documented continue, pivot, stop, or transfer decision for every first-wave initiative.
3. Publish a safe internal quarterly report using the measurement system above.
4. Update the next-quarter portfolio from evidence, not from the original enthusiasm.

## Repository and product integration

- Research governance and safe metadata live under `docs/research/`.
- Prototype code does not create a second application layout. Place product-bound work only in the owning product area after architecture approval, or use a separately governed restricted research repository or environment.
- A transfer proposal identifies the owning frontend, backend, database, contracts, monitoring, security, and operations locations defined in the [company project structure](../engineering/COMPANY-PROJECT-STRUCTURE.md).
- Products communicate only through versioned APIs and events and never read another product's database.
- Research does not create sign-in, payment, KYC, messaging, notification, or customer-data systems that compete with the platform control plane.
- Every transferred tenant-owned record and operation carries and verifies `tenant_id`, with positive and negative cross-tenant tests.
- Documentation, ADRs, OpenAPI, migrations, threat model, runbooks, and acceptance criteria are updated before changed behavior ships.
- Product transfers satisfy the [user-centred product standard](USER-CENTERED-PRODUCT-STANDARD.md), including traceability from research evidence to user need, requirement, design, acceptance, and live outcome.

## Reference basis

This is an Oxinov operating model, not a claim of certification or formal compliance. It is informed by:

- [OECD Frascati Manual 2015](https://www.oecd.org/en/publications/frascati-manual-2015_9789264239012-en.html) for the definition and five identifying criteria of R&D;
- [ISO 56001:2024](https://www.iso.org/standard/79278.html) and [ISO 56002:2019](https://www.iso.org/standard/68221.html) for systematic innovation management;
- [ISO 56005:2020](https://www.iso.org/standard/72761.html) for IP management in innovation and [ISO 56008:2024](https://www.iso.org/standard/78485.html) for innovation measurement;
- [NASA technology readiness definitions](https://www.nasa.gov/pdf/458490main_TRL_Definitions.pdf) for maturity communication; and
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) and its [Generative AI Profile](https://doi.org/10.6028/NIST.AI.600-1) for AI risk governance and evaluation.

