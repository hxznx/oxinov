# R&D project and experiment template

Copy this file to an approved project record and replace every bracketed instruction. Use ID format `RD-YYYY-NNN`; experiments use `RD-YYYY-NNN-EXP-NN`. Do not place secrets, personal data, restricted datasets, raw participant records, incident evidence, customer confidential material, or unpublished patent-enabling detail in Git.

## Project identity

| Field | Value |
| --- | --- |
| Project ID and title | [RD-YYYY-NNN — concise title] |
| Status and gate | [Proposed / Active / Paused / Stopped / Transferred; G0-G6] |
| Work class | [Research / Experimental development / Product discovery] |
| Horizon and pillar | [Core / Adjacent / Frontier; company pillar] |
| Related product and requirements | [Product/platform; FR, NFR, ADR, charter, or roadmap links] |
| Related user needs and research | [UN and UR identifiers, or explicit reason this work has no user-facing application yet] |
| Sponsor | [Named accountable person] |
| Research lead | [Named accountable person] |
| Product or domain owner | [Named person or explicit unassigned blocker] |
| Reviewers | [Data/security; legal/regulatory/IP; independent reviewer] |
| Start, decision, and expiry dates | [UTC dates] |
| Approved tranche | [People time, external spend, compute, equipment; currency] |

## Decision and hypothesis

**Decision to inform:** [What will Oxinov decide differently from this work?]

**Problem or observation:** [Evidence that the uncertainty matters.]

**Hypothesis:** [Falsifiable statement with direction and context.]

**Baseline or comparison:** [Current method, non-AI method, control, literature value, or alternative.]

**Success threshold:** [Predeclared measurement and value.]

**Failure and stop thresholds:** [Result, time, cost, risk, rights, or feasibility conditions that stop or narrow the project.]

**Out of scope:** [What this project will not claim, build, collect, or operate.]

## R&D qualification

Explain how the work satisfies all five criteria. If it does not, reclassify it.

| Criterion | Evidence |
| --- | --- |
| Novel | [Knowledge or capability not already available to Oxinov] |
| Creative | [Original hypothesis, method, design, or combination] |
| Uncertain | [Unknown outcome, feasibility, or effort] |
| Systematic | [Plan, time box, budget, method, and records] |
| Transferable or reproducible | [How another person can reuse or repeat the result] |

## Multidimensional scorecard

Score 0-5 and cite evidence. Weighted points equal `score / 5 × weight`.

| Dimension | Weight | Score | Evidence | Weighted points |
| --- | ---: | ---: | --- | ---: |
| Strategic fit | 15 | [0-5] | [Evidence] | [0-15] |
| Customer or mission evidence | 15 | [0-5] | [Evidence] | [0-15] |
| Knowledge value | 10 | [0-5] | [Evidence] | [0-10] |
| Technical tractability | 10 | [0-5] | [Evidence] | [0-10] |
| Platform leverage | 10 | [0-5] | [Evidence] | [0-10] |
| Economic or strategic option value | 15 | [0-5] | [Evidence] | [0-15] |
| Responsible feasibility | 10 | [0-5] | [Evidence] | [0-10] |
| Capability and IP advantage | 10 | [0-5] | [Evidence] | [0-10] |
| Cost and time to decisive evidence | 5 | [0-5] | [Evidence] | [0-5] |
| **Total** | **100** |  |  | **[0-100]** |

**Hard blockers:** [Legal, regulatory, safety, privacy, security, rights, funding, owner, or environment blockers.]

## Prior work and method

**Prior art and references:** [Primary sources, internal evidence, patents, products, and known limitations.]

**Method:** [Design, sample, variables, controls, procedure, and analysis.]

**Sources of error and bias:** [Sampling, measurement, contamination, evaluator, survivorship, language, accessibility, and conflicts.]

**Reproduction plan:** [Person, environment, artefacts, and tolerance for a repeated result.]

**Readiness before and target after:** [ORL level and evidence needed for the target.]

## Data, participants, safety, and rights

| Area | Record |
| --- | --- |
| Data inventory and classification | [Source, fields, volume, owner, classification, tenant context] |
| Licence and allowed use | [Terms, attribution, collection date, restrictions] |
| Personal data and consent | [Purpose, lawful basis or counsel review, consent, age, minimization] |
| Storage and access | [Approved system, encryption, access list, tenant isolation] |
| Retention and deletion | [Dates, owner, backup expiry, disposal evidence] |
| Security and threat review | [Abuse cases, controls, logs, incident route, denied paths] |
| Physical or environmental safety | [Hazards, operator, safe state, site approval, disposal] |
| Accessibility and affected groups | [Participation, exclusion, accommodation, distributional effects] |
| Content and dataset rights | [Copyright, exam rights, model terms, open-source obligations] |
| Background and foreground IP | [Owners, contributor terms, patent/publication review] |
| Regulatory review | [Jurisdictions, regulated activities, reviewer and status] |

## Experiment record

### [RD-YYYY-NNN-EXP-NN — experiment title]

| Field | Record |
| --- | --- |
| Question and hypothesis | [One decision-relevant uncertainty] |
| Owner and reviewer | [Names] |
| Dates and environment | [UTC; local/CI/staging/approved isolated environment] |
| Inputs and versions | [Data manifest, commit, config, prompt, model, dependency, device] |
| Baseline and metrics | [Names, units, aggregation, confidence/uncertainty method] |
| Success, failure, and abort thresholds | [Predeclared values] |
| Planned resources | [Time, spend, compute, equipment] |
| Actual resources | [Time, spend, compute, equipment] |
| Result locations | [Approved artefact references and checksums; no restricted payloads] |

**Procedure:** [Enough detail for a qualified person to repeat it.]

**Results:** [Measured values, uncertainty, failures, and unexpected observations.]

**Interpretation:** [What the evidence supports and does not support. Separate observation from inference.]

**Reproduction or independent review:** [Who, when, differences, and outcome.]

**Safety, privacy, security, rights, and operational observations:** [Including near misses.]

## Gate decision

| Field | Record |
| --- | --- |
| Decision | [Continue / Pivot / Pause / Stop / Transfer] |
| Gate and date | [G0-G6; UTC date] |
| Decision makers | [Sponsor, portfolio owner, independent reviewer, accepting product owner] |
| Evidence relied on | [Links to experiment and review records] |
| Score before and after | [Totals and material changes] |
| Remaining uncertainty and risk | [What is unresolved] |
| Next tranche or closeout | [Time, budget, owner, threshold, or archive actions] |

## Transfer checklist

Complete only for a transfer decision.

- [ ] The receiving product or platform owner accepts scope and ongoing ownership.
- [ ] Evidence links from user research to user need, experience hypothesis, requirement, design, acceptance, and live outcome under the [user-centred product standard](user-centered-product-standard.md).
- [ ] Customer behavior is linked to approved FR/NFR IDs or requirements are updated before coding.
- [ ] Architecture, data ownership, APIs/events, `tenant_id`, and product-plane boundaries are approved.
- [ ] Threat model, privacy, content rights, regulatory, accessibility, and AI reviews are complete.
- [ ] Migrations, OpenAPI/contracts, tests, observability, SOC events, runbooks, cost, support, and rollback are defined.
- [ ] Reproducibility package and limitations are available to the delivery team.
- [ ] Temporary access, infrastructure, datasets, and equipment are transferred or removed.
- [ ] Product release gate and acceptance criteria remain independently satisfied.

## Closeout

**Reusable knowledge:** [Principles, datasets, tools, methods, contracts, components, or partner learning.]

**Negative or null findings:** [What did not work and under which conditions.]

**Claims permitted:** [Exact internal/public claims supported by evidence.]

**Claims prohibited:** [Overstatements, unsupported generalization, official status, or readiness claims.]

**Archive and disposal:** [Safe artefact locations; access revoked; environments removed; data and equipment disposition.]

**Next review trigger:** [Date, new evidence, market condition, regulation, dependency, or product milestone.]
