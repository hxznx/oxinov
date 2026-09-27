# Functional Requirements Document: Oxinov JP

**Version:** 0.1  
**Status:** Proposed discovery draft; product definition requires owner validation  
**Product address:** To be decided after release gate  
**Technical slug:** `jp` (reserved; not authorized for scaffolding)  
**Source:** Owner direction of 2026-09-28, Platform Blueprint, Edu and HR product boundaries, and ADR-025

## 1. Purpose and scope

Oxinov JP is defined in this draft as a guided Japan journey portal for people preparing to learn, qualify, apply, relocate, and settle for lawful study or work opportunities connected to Japan. It orchestrates, rather than duplicates, Oxinov Edu courses and verified credentials and Oxinov HR opportunities and applications. It may provide checklists, document readiness, official-source guidance, appointments, and consent-based referrals.

Oxinov JP is not a government agency, immigration authority, school, employer, licensed recruiter, or legal adviser unless a later approved operating model and licence says otherwise. It must never guarantee a visa, exam result, admission, job, salary, or immigration outcome.

## 2. Roles and access

| Role | Scope |
| --- | --- |
| Explorer | Reads public, dated guidance and official links |
| Journey member | Maintains a private goal, checklist, and consent choices |
| Verified candidate | Shares selected verified records with an authorized partner |
| Organization representative | Manages only its approved programs or appointments |
| Reviewed partner | Receives minimum data for a consented referral or service |
| JP operations | Maintains guidance sources, partner status, and safety cases |

## 3. Platform and product dependencies

JP reuses Platform identity, consent, trust, organizations, notifications, messaging, privacy, audit, and support. It references Edu and HR through versioned APIs and user-authorized links; it never reads their databases or copies authoritative course results, certificates, job applications, or recruiter records.

## 4. Functional requirements

### 4.1 Guidance and journey planning

**FR-JP-8601 — Goal-based journey.** A member must be able to select a lawful goal such as language study, skills preparation, education exploration, or employment exploration and receive a versioned checklist with prerequisites, responsible party, evidence type, and official source.
*Priority:* Must. *Status:* Proposed. *Access:* T1 owner scope. *Source:* ADR-025.
- Acceptance: The checklist identifies assumptions, last-reviewed date, source, and which steps are optional or authority-controlled.
- Acceptance: The portal does not present an uncertain, expired, or unofficial rule as guaranteed current law.

**FR-JP-8602 — Official-source guidance.** Public guidance must cite the responsible Japanese or local authority, source URL, reviewed date, applicable route, language availability, and a plain-language disclaimer.
*Priority:* Must. *Status:* Proposed. *Access:* T0 reads; authorized content reviewer writes. *Source:* ADR-025.
- Acceptance: A visitor can reach the cited primary source and see when Oxinov last reviewed the summary.
- Acceptance: Guidance with a failed review date or withdrawn source is marked stale and excluded from decisive checklists.

**FR-JP-8603 — Change alerts.** Members may follow selected guidance topics and receive material-change notices with the old and new reviewed summary and effective date.
*Priority:* Should. *Status:* Proposed. *Access:* T1 owner scope. *Source:* ADR-025.
- Acceptance: A subscriber receives only opted-in, material guidance changes and can unsubscribe.
- Acceptance: The system does not infer legal eligibility or send promotional messages under a guidance subscription.

**FR-JP-8604 — Readiness self-check.** Members may complete a non-decisive self-check for language, skills, education, documentation, timing, and budget readiness and receive explainable gaps and official next steps.
*Priority:* Should. *Status:* Proposed. *Access:* T1 owner scope. *Source:* ADR-025.
- Acceptance: Results clearly state that they are guidance, show inputs used, and allow correction or deletion.
- Acceptance: The self-check cannot approve immigration, employment, admission, certification, or financial eligibility.

### 4.2 Edu and HR orchestration

**FR-JP-8610 — Edu pathway link.** With user authorization, JP must display relevant Oxinov Edu course, assessment, and certificate summaries through the Edu API while preserving Edu as the system of record.
*Priority:* Must. *Status:* Proposed. *Access:* Owner or explicitly authorized recipient. *Source:* Edu FRD.
- Acceptance: A member can open the authoritative Edu record and revoke future JP access.
- Acceptance: JP cannot edit scores, issue certificates, or expose another learner's record.

**FR-JP-8611 — HR opportunity link.** With user authorization, JP may display eligible Japan-related Oxinov HR opportunities and the candidate's application status through the HR API while preserving HR as the system of record.
*Priority:* Must. *Status:* Proposed. *Access:* Candidate owner scope. *Source:* HR FRD.
- Acceptance: A candidate can open the authoritative opportunity and application in HR.
- Acceptance: JP cannot publish a job, change an application, or bypass HR trust, recruiter, fairness, and safety controls.

**FR-JP-8612 — Credential sharing consent.** A verified candidate may create a purpose-limited, expiring grant for selected Edu or HR credentials to a named reviewed organization.
*Priority:* Must. *Status:* Proposed. *Access:* T2 candidate; named organization recipient. *Source:* Platform privacy requirements.
- Acceptance: Before sharing, the candidate sees fields, recipient, purpose, expiry, and revocation effect.
- Acceptance: Revoked, expired, broadened, or recipient-mismatched grants do not return protected data.

### 4.3 Documents, appointments, and partners

**FR-JP-8620 — Document readiness checklist.** A member may record whether a required document exists, expiry, issuing authority, translation need, and verification state without uploading the document unless an approved process needs it.
*Priority:* Must. *Status:* Proposed. *Access:* Owner scope; consented reviewer for selected items. *Source:* Privacy standard.
- Acceptance: The default checklist stores status metadata rather than unnecessary document copies.
- Acceptance: The system never labels a document authentic or authority-approved without an authorized verification result.

**FR-JP-8621 — Protected document exchange.** If an approved referral requires documents, uploads must use private storage, malware scanning, purpose, recipient, expiry, access audit, and retention controls.
*Priority:* Must when enabled. *Status:* Proposed. *Access:* Owner and named reviewed recipient. *Source:* Security and privacy baselines.
- Acceptance: The owner can see and revoke active recipient access where legally and operationally possible.
- Acceptance: Public links, unscanned files, expired grants, and unrelated staff cannot access documents.

**FR-JP-8622 — Appointment booking.** Members may request available appointments with approved advisers or partners, with service description, price if any, time zone, language, cancellation terms, and role disclaimer.
*Priority:* Should. *Status:* Proposed. *Access:* T2 member and approved partner. *Source:* ADR-025.
- Acceptance: Confirmation preserves the service, provider, price, schedule, terms, and participant time zones.
- Acceptance: Concurrent requests cannot double-book capacity, and an unapproved partner cannot receive bookings.

**FR-JP-8623 — Partner directory and verification.** JP operations must maintain partner legal identity, service category, territory, licence or registration evidence where required, conflicts, status, review date, and complaint route.
*Priority:* Must before referrals. *Status:* Proposed. *Access:* Operations writes; T0 reads approved claims. *Source:* ADR-025.
- Acceptance: Users can distinguish Oxinov, government, employer, school, recruiter, translator, and independent adviser roles.
- Acceptance: Expired or suspended partners cannot receive new referrals or appear as currently verified.

**FR-JP-8624 — Consent-based referral.** A member may send minimum necessary profile data to a selected reviewed partner only after seeing the purpose, data, partner terms, and withdrawal route.
*Priority:* Must. *Status:* Proposed. *Access:* T2 owner and named partner. *Source:* Platform privacy requirements.
- Acceptance: One confirmed action creates one auditable referral with the disclosed data snapshot.
- Acceptance: Prechecked consent, silent onward sharing, duplicate submission, or unrelated partner access is prohibited.

### 4.4 Safety, money, and records

**FR-JP-8630 — Fee and claim transparency.** Every paid or partner-provided service must disclose provider, scope, fee and currency, taxes, refund terms, government fees versus service fees, and claims the provider is prohibited from making.
*Priority:* Must. *Status:* Proposed. *Access:* T0 for offered services. *Source:* ADR-025.
- Acceptance: A user can distinguish an official fee from an Oxinov or partner service fee before payment.
- Acceptance: No page or message may guarantee a visa, job, admission, exam result, salary, or processing time.

**FR-JP-8631 — Fraud and coercion reporting.** Users must be able to report fee fraud, document demands, identity misuse, harassment, coercion, discrimination, or unsafe partner behavior and receive a case reference and safety guidance.
*Priority:* Must. *Status:* Proposed. *Access:* T0 report; case owner and authorized safety operations. *Source:* Threat model.
- Acceptance: A valid report preserves evidence, limits further contact where appropriate, and routes by severity.
- Acceptance: Report content is not exposed to the reported party when doing so would create safety or evidence risk.

**FR-JP-8632 — Journey export and deletion.** Members must be able to export their checklist, consents, referrals, appointments, and source references and request deletion through Platform privacy controls, subject to disclosed legal holds.
*Priority:* Must. *Status:* Proposed. *Access:* Owner and privacy operations. *Source:* FR-PRIV requirements.
- Acceptance: An authenticated owner receives a structured export without other users' data.
- Acceptance: Deletion does not erase authority-controlled Edu or HR records, partner legal records, or active holds; the response explains each retained category.

## 5. Out of scope

- Visa decisions, immigration or legal advice, guaranteed placement, passport custody, money lending, remittance, travel ticketing, housing brokerage, or unlicensed recruitment.
- Duplicating Edu learning records or HR job and application workflows.
- Automated eligibility rejection based on protected traits or opaque AI scoring.
- Production scaffolding until the product definition and release gate are approved.

## 6. Open decisions and release gate

The owner must confirm whether this interpretation of Oxinov JP is correct; target customers and countries; operating entity and jurisdictions; service categories; whether Oxinov is only an information portal or also a licensed provider; partner model; official sources and review cadence; fees; languages; support hours; data location and retention; budget; and stop/continue checkpoint. Qualified Nepal and Japan counsel must review immigration, recruitment, education, consumer, privacy, cross-border data, tax, payment, advertising, and partner-licensing obligations before launch.

## 7. Suggested delivery slices

1. Primary-source guidance, goal checklists, and change review workflow.
2. Consent-based Edu and HR links without copied authoritative data.
3. Reviewed partner directory, appointments, referrals, safety cases, and privacy controls.
4. Paid services only after legal, licensing, provider, and operations approval.
