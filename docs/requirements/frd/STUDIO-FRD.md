# Functional Requirements Document: Oxinov Studio

**Version:** 0.1  
**Status:** Proposed discovery draft; release gate remains closed  
**Product address:** `studio.oxinov.com` after approval  
**Technical slug:** `studio`  
**Source:** Platform Blueprint Media & Studio candidates and ADR-025

## 1. Purpose and scope

Oxinov Studio is the planned client workspace for requesting and managing animation, video, audio, music, podcast, dubbing, subtitling, and related production work. It covers briefs, estimates, schedules, reviews, approvals, licensed asset delivery, and archive or deletion. Public streaming and broadcasting are excluded until separately approved and licensed.

## 2. Roles and access

| Role | Scope |
| --- | --- |
| Client requester | Creates briefs for self or authorized organization |
| Client approver | Accepts scope, changes, milestones, and final delivery |
| Studio producer | Plans projects, staffing, schedule, and delivery |
| Contributor | Accesses assigned project tasks and assets only |
| Rights and finance reviewer | Reviews licenses, releases, estimates, and invoices within role |
| Studio operations | Handles templates, safety, retention, and justified support |

Client and project data must be owner- or organization-scoped with API authorization and PostgreSQL row-level security.

## 3. Platform dependencies

Studio reuses Platform identity, organizations, policies, plans, payments, notifications, messaging, privacy, audit, and support. Media uses private S3 storage and short-lived authorized access. AI-assisted work must use the governed AI gateway and remain a disclosed, editable draft.

## 4. Functional requirements

### 4.1 Intake and commercial agreement

**FR-STUDIO-8501 — Production brief.** An authorized client must be able to create a private brief containing project type, purpose, audience, deliverables, languages, accessibility needs, source materials, references, budget range, deadline, and rights constraints.
*Priority:* Must. *Status:* Proposed. *Access:* T1 client, owner or organization scope. *Source:* Platform Blueprint.
- Acceptance: A valid brief can be saved, resumed, and submitted with an immutable submitted version.
- Acceptance: Unsafe files, missing mandatory fields, or an unauthorized organization member cannot submit the brief.

**FR-STUDIO-8502 — Feasibility review and estimate.** Studio staff must record scope assumptions, exclusions, schedule, revision allowance, price and currency, taxes, third-party costs, rights dependencies, and estimate expiry.
*Priority:* Must. *Status:* Proposed. *Access:* Assigned producer and finance reviewer; client reads. *Source:* ADR-025.
- Acceptance: The client can compare the brief version with the proposed scope before acceptance.
- Acceptance: Expired or superseded estimates cannot be accepted or silently changed.

**FR-STUDIO-8503 — Project authorization.** A project may start only after an authorized client approver accepts the scope, estimate, applicable policies, rights responsibilities, and payment milestone plan.
*Priority:* Must. *Status:* Proposed. *Access:* Client approver and assigned producer. *Source:* ADR-025.
- Acceptance: Acceptance creates one project from the exact commercial snapshot using an idempotency key.
- Acceptance: A requester without approval authority, an expired estimate, or an unmet prerequisite cannot start work.

**FR-STUDIO-8504 — Change request.** Either party may propose a scoped change that states schedule, deliverable, cost, rights, and revision impacts; material changes require authorized acceptance before work proceeds.
*Priority:* Must. *Status:* Proposed. *Access:* Project parties. *Source:* ADR-025.
- Acceptance: Accepted changes create a numbered project baseline while preserving prior baselines.
- Acceptance: A contributor cannot alter commercial scope or apply an unapproved change.

### 4.2 Project and review workflow

**FR-STUDIO-8510 — Milestones and tasks.** Producers must plan milestones, dependencies, responsible contributors, target dates, client inputs, review windows, and completion criteria using UTC source times.
*Priority:* Must. *Status:* Proposed. *Access:* Assigned project team; client sees client-facing milestones. *Source:* Platform Blueprint.
- Acceptance: Each user sees its next action and dates in its local time zone.
- Acceptance: Users cannot assign people outside the project or reveal internal notes to clients.

**FR-STUDIO-8511 — Secure asset workspace.** Project files must be stored privately with version, uploader, checksum, scan state, rights metadata, retention class, and short-lived authorized delivery.
*Priority:* Must. *Status:* Proposed. *Access:* Project-role and asset-level scope. *Source:* Security and privacy baselines.
- Acceptance: Authorized users can upload and retrieve scanned files within size and format policy.
- Acceptance: Unscanned, quarantined, expired, or unauthorized assets cannot be downloaded or shared.

**FR-STUDIO-8512 — Time-coded review.** Clients and contributors must be able to comment on an asset version using time range, frame, page, or file context, with status, assignee, and resolution history.
*Priority:* Must. *Status:* Proposed. *Access:* Project members according to review role. *Source:* Platform Blueprint.
- Acceptance: A reviewer can distinguish open feedback, responses, and resolved items for the exact asset version.
- Acceptance: Feedback on an older version is not silently treated as approval of a newer version.

**FR-STUDIO-8513 — Revision control.** The system must track included and additional revision rounds, consolidate conflicting client feedback, and require approval for chargeable or schedule-changing revisions.
*Priority:* Must. *Status:* Proposed. *Access:* Client approver and producer. *Source:* ADR-025.
- Acceptance: Both parties can see remaining included rounds and the effect of a proposed extra round.
- Acceptance: Ordinary commenters cannot authorize a paid revision or overwrite another review decision.

**FR-STUDIO-8514 — Accessibility and localization review.** Relevant projects must support caption, transcript, subtitle, audio-description, reading-order, contrast, flashing-content, and language-review checklists with named reviewer outcomes.
*Priority:* Must when applicable. *Status:* Proposed. *Access:* Assigned accessibility or language reviewer. *Source:* Accessibility standard.
- Acceptance: Delivery identifies completed checks, exceptions, languages, and the reviewed asset version.
- Acceptance: The product does not claim compliance or translation accuracy without recorded review evidence.

### 4.3 Rights, approval, and delivery

**FR-STUDIO-8520 — Rights and releases register.** The project must record ownership, license source, permitted territories, channels, duration, attribution, talent releases, music or stock terms, restrictions, and expiry for each governed asset.
*Priority:* Must. *Status:* Proposed. *Access:* Rights reviewer, producer, and authorized client. *Source:* ADR-025.
- Acceptance: A rights reviewer can block a deliverable whose required evidence is missing or incompatible with intended use.
- Acceptance: Contributors cannot mark rights cleared without the required role and evidence.

**FR-STUDIO-8521 — Client approval.** Authorized client approvers must accept, reject with reasons, or request permitted revision of milestone and final deliverables against the current baseline.
*Priority:* Must. *Status:* Proposed. *Access:* Client approver. *Source:* ADR-025.
- Acceptance: Final approval records approver, UTC time, version, deliverables, and disclosed exceptions.
- Acceptance: Comments, downloads, or silence do not count as approval unless the accepted agreement explicitly defines a lawful timed process.

**FR-STUDIO-8522 — Licensed delivery package.** Final delivery must provide approved masters, agreed derivatives, metadata, captions or transcripts where included, checksum manifest, license summary, and access expiry.
*Priority:* Must. *Status:* Proposed. *Access:* Authorized client recipients. *Source:* Platform Blueprint.
- Acceptance: A recipient can verify the delivered version and download within the authorized window.
- Acceptance: Expired, recalled, unpaid where contractually applicable, or unauthorized packages cannot be accessed.

**FR-STUDIO-8523 — Billing milestones.** Invoice and payment state must follow the accepted project baseline and server-verified platform payment records, with explicit currency, tax, third-party costs, credits, and refunds.
*Priority:* Must. *Status:* Proposed. *Access:* Client finance role, Studio finance role. *Source:* FR-PAY-2701–2703.
- Acceptance: Both finance roles see the same milestone and verified payment state.
- Acceptance: A redirect, screenshot, duplicate provider event, or contributor action cannot mark an invoice paid.

**FR-STUDIO-8524 — Archive, export, and deletion.** Projects must apply disclosed retention by asset class, support authorized client export, preserve legal holds, and delete or anonymize eligible data through the Platform privacy workflow.
*Priority:* Must. *Status:* Proposed. *Access:* Client owner, privacy operations, authorized Studio operations. *Source:* FR-PRIV and retention policy.
- Acceptance: The client can see archive and deletion eligibility and receive a structured export of owned project records.
- Acceptance: A deletion request cannot remove another client's data, active legal-hold evidence, or licensed company records outside the approved rule.

**FR-STUDIO-8530 — Project reporting.** Clients and Studio operations must receive role-scoped reporting for milestones, review turnaround, revision use, storage, delivery, rights expiry, invoices, and project outcome.
*Priority:* Should. *Status:* Proposed. *Access:* Project or authorized aggregate scope. *Source:* ADR-025.
- Acceptance: Client reports contain only their projects and identify filters, currency, and generation time.
- Acceptance: Operations aggregates exclude client media contents and unnecessary personal data.

## 5. Out of scope

- Public streaming, broadcasting, music distribution, rights acquisition brokerage, or guaranteed audience performance.
- Publishing client work without explicit written authorization.
- Direct production SQL, public-by-default assets, or AI-generated final work without human approval.
- Production scaffolding until the release gate closes.

## 6. Open decisions and release gate

The owner must approve target services, staffing model, rate card, contract and cancellation terms, revision policy, supported formats and storage limits, rights-review process, retention, backup and restore, AI disclosure rules, delivery budget, customer evidence, and stop/continue checkpoint. Qualified review is required for copyright, performer releases, music licensing, privacy, tax, and any broadcasting or distribution activity.

## 7. Suggested delivery slices

1. Briefs, estimates, project authorization, milestones, and secure files.
2. Time-coded reviews, revisions, approvals, and delivery packages.
3. Rights register, billing milestones, exports, retention, and reporting.
4. Any streaming capability only under a separate approved FRD and regulatory gate.
