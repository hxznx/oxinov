# Functional Requirements Document: Oxinov Tech

**Version:** 0.1  
**Status:** Proposed discovery draft; product definition requires owner validation  
**Product address:** Client portal module in `app.oxinov.com` unless a later ADR approves a product plane  
**Technical slug:** `tech` (reserved; not authorized for scaffolding)  
**Source:** Platform Blueprint Engineering and Services candidates and ADR-025

## 1. Purpose and scope

Oxinov Tech is defined in this draft as the client delivery module for Oxinov's software engineering, cloud, cybersecurity, networking, consulting, and managed technology services. It provides structured intake, proposals, contracts, project visibility, secure deliverables, support requests, service reporting, invoices, and closure.

It is not a public cloud control plane, domain registrar, security operations center, vulnerability marketplace, or unrestricted remote-administration tool. Those capabilities require separate decisions, controls, staffing, and possibly product planes.

## 2. Roles and access

| Role | Scope |
| --- | --- |
| Client requester | Creates service requests for an authorized organization |
| Client approver | Accepts proposals, changes, delivery, and commercial records |
| Client technical contact | Coordinates requirements, access, incidents, and acceptance tests |
| Oxinov delivery lead | Plans scope, team, milestones, risks, and delivery |
| Specialist | Accesses assigned work and minimum client information |
| Support engineer | Handles entitled requests with time-limited access |
| Tech operations | Manages templates, service catalog, safety, and audited escalation |

## 3. Platform dependencies

Tech reuses Platform identity, organizations, policy acceptance, plans, payments, notifications, messaging, privacy, audit, and support. Secrets belong in approved secret systems and must never be stored in tickets, messages, source control, or ordinary project files.

## 4. Functional requirements

### 4.1 Service discovery and intake

**FR-TECH-8701 — Governed service catalog.** Operations must manage versioned service definitions with outcomes, prerequisites, exclusions, delivery model, regions, risk class, pricing basis, support level, and required approvals.
*Priority:* Must. *Status:* Proposed. *Access:* Tech operations writes; T0 reads approved services. *Source:* Platform Blueprint.
- Acceptance: A visitor can distinguish available, assessment-only, partner-delivered, and future services.
- Acceptance: An unauthorized user cannot publish a service or remove its legal, security, or capacity prerequisite.

**FR-TECH-8702 — Client intake.** An authorized organization member must be able to submit a private request with business outcome, current environment, users, constraints, desired date, budget range, data classification, compliance needs, and safe attachments.
*Priority:* Must. *Status:* Proposed. *Access:* T2 organization member. *Source:* ADR-025.
- Acceptance: A valid request receives an owner-visible reference, triage state, and expected next step.
- Acceptance: Secret values, malware, unsupported files, or a member without organization authority are rejected with safe guidance.

**FR-TECH-8703 — Discovery and risk assessment.** The delivery lead must record assumptions, dependencies, architecture or security constraints, data access, third parties, feasibility, delivery risks, and a proceed, revise, refer, or decline outcome.
*Priority:* Must. *Status:* Proposed. *Access:* Assigned delivery team; client sees approved summary. *Source:* ADR-025.
- Acceptance: The client sees the information and approvals required before a proposal.
- Acceptance: A declined or unsafe request cannot become active work without a new authorized review.

**FR-TECH-8704 — Proposal and statement of work.** A proposal must specify outcomes, deliverables, acceptance criteria, responsibilities, milestones, schedule, price and currency, taxes, assumptions, exclusions, support, security, data handling, IP terms, and validity.
*Priority:* Must. *Status:* Proposed. *Access:* Assigned delivery and finance roles; client approver reads. *Source:* ADR-025.
- Acceptance: The client can compare the current proposal with its intake and review all material terms before acceptance.
- Acceptance: An expired, superseded, incomplete, or unauthorized proposal cannot start a project.

### 4.2 Project delivery

**FR-TECH-8710 — Project authorization.** Work may begin only after an authorized client accepts the exact proposal, required policies and agreements, and any prerequisite payment or access plan.
*Priority:* Must. *Status:* Proposed. *Access:* Client approver and delivery lead. *Source:* ADR-025.
- Acceptance: One confirmed action creates one project baseline and audit record.
- Acceptance: A requester without authority, duplicate request, or unmet prerequisite cannot authorize work.

**FR-TECH-8711 — Milestones, decisions, and risks.** Each project must track milestones, deliverables, dependencies, client actions, decisions, risks, issues, owners, due dates, and status using UTC source times.
*Priority:* Must. *Status:* Proposed. *Access:* Project members by role. *Source:* Platform Blueprint.
- Acceptance: Client and delivery users see a consistent current baseline and their next required actions.
- Acceptance: Internal security notes, personnel notes, and unrelated project data are not exposed across roles or tenants.

**FR-TECH-8712 — Secure collaboration and deliverables.** Project messages and files must use private storage, safe file controls, versioning, checksums, classification, retention, and short-lived authorized access.
*Priority:* Must. *Status:* Proposed. *Access:* Project and asset scope. *Source:* Security baseline.
- Acceptance: Authorized participants can retrieve the correct scanned deliverable version and its metadata.
- Acceptance: Public links, unscanned files, expired grants, and unrelated staff cannot access client assets.

**FR-TECH-8713 — Access request and expiry.** Any requested client-system access must state system, purpose, privilege, named person or workload, approval, start, expiry, authentication method, logging, and revocation owner.
*Priority:* Must. *Status:* Proposed. *Access:* Client technical approver and authorized Oxinov operator. *Source:* Security baseline.
- Acceptance: Approved time-bounded access is visible to both parties and produces audit evidence without logging secrets.
- Acceptance: Shared credentials, indefinite access, access without named approval, and secrets pasted into the portal are prohibited.

**FR-TECH-8714 — Change control.** Material scope, architecture, security, schedule, price, or data changes must be proposed with impact and accepted by authorized roles before execution.
*Priority:* Must. *Status:* Proposed. *Access:* Client approver and delivery lead. *Source:* ADR-025.
- Acceptance: An accepted change creates a numbered baseline and preserves previous decisions.
- Acceptance: Specialists and commenters cannot authorize commercial or risk acceptance changes.

**FR-TECH-8715 — Acceptance and handover.** Deliverables must be tested against agreed criteria and handed over with results, exceptions, documentation, ownership, training where included, backup or rollback information, warranty or support terms, and client decision.
*Priority:* Must. *Status:* Proposed. *Access:* Delivery lead and client approver. *Source:* ADR-025.
- Acceptance: Acceptance records the exact deliverable versions, test evidence, approver, UTC time, and known exceptions.
- Acceptance: Download, silence, or an internal completion flag does not constitute client acceptance unless the agreement explicitly provides a lawful process.

### 4.3 Support, security, and commercial records

**FR-TECH-8720 — Entitled support request.** Authorized client contacts may open severity-classified support requests for covered services, with impact, affected system, safe diagnostic data, communication channel, and target response based on the active agreement.
*Priority:* Must. *Status:* Proposed. *Access:* Entitled client contacts and assigned support. *Source:* Platform Blueprint.
- Acceptance: The requester sees severity criteria, target response, status, owner, and communication history.
- Acceptance: Unsupported services, secret-bearing submissions, and falsely escalated severity are safely rerouted without claiming an SLA.

**FR-TECH-8721 — Security issue handling.** Suspected security issues must use restricted cases, minimum necessary evidence, severity and disclosure controls, security event emission, and a documented handoff to the incident process.
*Priority:* Must. *Status:* Proposed. *Access:* Named client security contacts and authorized security responders. *Source:* Security baseline and SOC.
- Acceptance: A valid report is restricted, acknowledged, triaged, and linked to the applicable incident or support record.
- Acceptance: Sensitive vulnerability details are not exposed to ordinary project members or public notifications.

**FR-TECH-8722 — Service reporting.** Clients must receive agreement-scoped reports for delivery status, support volume, response and resolution performance, availability only when measured and contracted, changes, risks, costs, and recommendations.
*Priority:* Should. *Status:* Proposed. *Access:* Client organization and assigned delivery roles. *Source:* ADR-025.
- Acceptance: Reports identify measurement source, period, time zone, exclusions, and whether a value is measured, estimated, or unavailable.
- Acceptance: The system does not invent uptime, compliance, security, or savings claims and never exposes another client.

**FR-TECH-8723 — Invoices and verified payment.** Commercial records must follow accepted baselines and server-verified Platform payment events, with explicit currency, taxes, credits, refunds, and external references.
*Priority:* Must. *Status:* Proposed. *Access:* Client and Oxinov finance roles. *Source:* FR-PAY-2701–2703.
- Acceptance: Both authorized finance roles see the same invoice and verified payment state.
- Acceptance: Screenshots, redirects, duplicate events, mismatched amounts, and delivery staff actions cannot mark an invoice paid.

**FR-TECH-8724 — Closure, export, and retention.** Project closure must record final state, unresolved risks, access revocation, asset ownership, export package, retention schedule, support transition, and deletion eligibility.
*Priority:* Must. *Status:* Proposed. *Access:* Client approver, delivery lead, privacy operations. *Source:* Retention and privacy policies.
- Acceptance: Closure confirms removal or transfer of temporary access and provides the authorized client record export.
- Acceptance: Closure cannot delete active legal-hold evidence, another client's data, or required financial and security records.

## 5. Out of scope

- Hosting, domain registration, managed SOC, continuous remote administration, penetration testing, or regulated consulting unless separately approved, staffed, contracted, and controlled.
- Storing client passwords, private keys, tokens, production database copies, or personal data outside approved systems.
- Guaranteed security, compliance, uptime, savings, or business outcome claims.
- Production scaffolding until the release gate closes.

## 6. Open decisions and release gate

The owner must confirm this interpretation of Oxinov Tech; initial service catalog; target clients and jurisdictions; professional liability and contracts; pricing; staffing and on-call coverage; support levels; approved collaboration and secret-access tools; data residency; subcontractors; IP ownership; insurance; budget; and stop/continue checkpoint. Security, privacy, tax, export-control, licensing, and professional-services obligations require qualified review for the chosen services.

## 7. Suggested delivery slices

1. Service catalog, intake, assessment, proposals, and project authorization.
2. Milestones, secure files, decisions, changes, acceptance, and handover.
3. Entitled support, security cases, reports, invoicing, closure, and retention.
4. Any hosting, managed security, or remote operations as separately approved modules.
