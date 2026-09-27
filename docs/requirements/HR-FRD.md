# Functional Requirements Document: Oxinov HR

**Version:** 0.2 (draft for owner review)
**Date:** 2026-09-28
**Status:** Proposed. Drafted at the owner's request; not approved for implementation until the release gate in the [product record](../products/hr/README.md) is passed.
**Scope:** `hr.oxinov.com`: a verified, global network of HR professionals and agencies, and the workspace where client companies engage them to take candidates from CV to deployment.
**Standard:** [Oxinov requirements standard](README.md). Number block **8000–8499**, area `HR`.

## Implementation status (2026-09-28)

Nothing is built. Every requirement below is **Proposed**. Each moves to **Approved** when the owner approves the release, and to **Implemented** when its code, tests, and documentation are merged and verified. The build order is in section 6.

## 1. Purpose and scope

Skilled HR professionals work in every country: recruiters, headhunters, sourcers, HR consultants, and licensed recruitment agencies. Companies search for them constantly, but no trusted platform shows who is real, what they have actually delivered, and whether they may legally recruit in a country. Companies rely on referrals and unverified profiles; good HR professionals struggle to prove their track record; candidates are exposed to fake recruiters and illegal fees.

Oxinov HR solves this with two things:

1. **A verified network.** HR professionals and agencies prove their identity, credentials, experience, licences, and placement record. Companies anywhere search them by skill, sector, role type, country, language, and experience.
2. **One workspace from CV to deployment.** A company engages an HR professional for a hiring mandate. Together they run the whole process on Oxinov: sourcing, candidate consent, screening, submission, interviews, offer, pre-deployment (documents, work permit, medical, travel), deployment, and the guarantee period, with fees paid against milestones.

Oxinov HR is global and English only (ADR-020). It is a candidate product plane on the Oxinov platform, and it relies on the platform for identity, trust levels, organizations, verification (KYC), notifications, messaging, payments, and policies.

**Relationship to Oxinov Jobs.** Oxinov Jobs is a job board in Nepal where employers post jobs and candidates apply directly. Oxinov HR is where companies hire *HR professionals* to recruit for them, worldwide, and where those professionals manage candidates end to end. An HR professional may publish an engagement's opening to Oxinov Jobs (FR-HR-8141) and use verified Oxinov Edu certificates (FR-HR-8142). The two products keep separate databases and talk only through versioned APIs.

**Out of scope for the first release:**

- Oxinov acting as a recruitment agency, employer of record, or visa agent. Oxinov provides the platform; licensed parties recruit and deploy.
- Any fee charged to a candidate, by anyone, for any step (FR-HR-8073).
- Payroll, attendance, leave, and other management of employees after the guarantee period (a possible later product).
- Automated hiring or rejection decisions. AI may summarize and rank with explanations; a person decides every step (FR-HR-8143).
- Its own login, one-time codes, KYC, notification delivery, or payment processing.

Sources: owner request of 2026-09-28; [platform blueprint](../company/PLATFORM-BLUEPRINT.md); [identity and access](../architecture/IDENTITY-AND-ACCESS.md); [platform policies](../company/PLATFORM-POLICIES.md); [Jobs FRD](JOBS-FRD.md); ADR-008, ADR-011, ADR-019, ADR-020, ADR-022.

### Shared terms

| Term | Meaning |
| --- | --- |
| HR professional | An individual offering recruitment or HR services: recruiter, headhunter, sourcer, HR consultant |
| Agency | A platform organization offering recruitment services, with HR professionals as its members |
| Client | A business-verified platform organization that hires HR professionals or agencies |
| Mandate | A client's hiring need: roles, openings, locations, requirements, budget, and deadline |
| Engagement | An accepted agreement between a client and an HR professional or agency to work on a mandate |
| Candidate | A person being considered for a role in an engagement |
| Submission | An HR professional presenting a consenting candidate to a client for a mandate |
| Deployment | The candidate starting work at the client's site, in the same country or another |
| Guarantee period | The agreed time after deployment during which the HR professional replaces a candidate who leaves |
| Licence | A government authorization to recruit or place workers, for example a Nepal Department of Foreign Employment licence |

## 2. Roles

| Role | Can do | Trust and policy |
| --- | --- | --- |
| Visitor | Browse verified HR professional and agency profiles | T0 |
| Candidate | Consent to representation, see and manage own applications and documents, confirm deployment, review | T1 to hold an account; T2 to accept an offer or confirm deployment; Oxinov Terms and Privacy |
| HR professional | Keep a profile, get verified, send proposals, run engagements, manage candidates, message clients and candidates | T3 identity-verified; HR Professional Policy |
| Agency admin | Everything an HR professional can for the agency, plus manage agency members, licences, and the agency profile | T4 business-verified organization; owner or admin role |
| Client hiring manager | Create mandates, search and invite HR professionals, accept proposals, review candidates, make offers, confirm deployment, pay milestones | T4 business-verified client; member role |
| Client admin | Everything a hiring manager can, plus manage client members and payment settings | T4; organization owner or admin |
| Operator | Verify credentials and licences, moderate, resolve disputes, suspend | Oxinov staff role with MFA (FR-ID-2209) |

## 3. Functional requirements

### 3.1 HR professional and agency profiles

**FR-HR-8001 — HR professional profile.** A member must be able to create one HR profile linked to their Oxinov account: headline, summary, years of HR experience, skills (from the shared skill list, with a self-rated level), sectors served, role types recruited (for example nursing, software, construction trades, executives), countries and regions served, languages, service types (full-cycle recruitment, sourcing, screening, onboarding, pre-deployment and mobilization, HR consulting), fee models offered, and availability. Contact details come from the account and are never copied into the profile.
*Priority:* Must. *Status:* Proposed. *Access:* T1 to draft, own profile only; T3 to publish. *Source:* owner request.
- Acceptance: Given an identity-verified member, when they save and publish a profile, then it appears in search with only verified badges they have earned.
- Acceptance: Given a member without identity verification, when they try to publish, then the profile stays a private draft and the page explains the missing step.

**FR-HR-8002 — Agency profile and members.** An agency admin must be able to create an agency profile (name, logo, registration country, offices, sectors, countries served, team size, services) and grant or remove the agency recruiter role for organization members. Engagements and candidates stay with the agency when a member leaves.
*Priority:* Must. *Status:* Proposed. *Access:* T4 organization, owner or admin. *Source:* owner request.
- Acceptance: Given an agency admin, when they add a member as recruiter, then that member can work on the agency's engagements.
- Acceptance: Given a removed member, when they open an agency engagement, then access is refused and their past actions stay in the audit log.

**FR-HR-8003 — Identity verification.** An HR professional must pass platform individual KYC (T3) before any profile, proposal, or candidate contact is visible to others. Oxinov HR never collects identity documents itself.
*Priority:* Must. *Status:* Proposed. *Access:* platform KYC (FR-KYC). *Source:* owner request (authentic platform).
- Acceptance: Given a member whose KYC is approved, when they publish, then the profile shows "Identity verified".
- Acceptance: Given a member whose KYC is rejected or expired, when anyone views their profile, then it is unpublished and their open proposals are withdrawn with a notice to clients.

**FR-HR-8004 — Credential and experience verification.** An HR professional must be able to submit professional certifications (for example SHRM, CIPD, national HR bodies), past employers with dates, and references. An operator, or an automated check against an issuer where one exists, must mark each item Verified, Unverified, or Rejected, with the method and date recorded. Only Verified items show a badge.
*Priority:* Must. *Status:* Proposed. *Access:* owner submits; operator decides. *Source:* owner request.
- Acceptance: Given a certification confirmed by its issuer, when the operator verifies it, then the profile shows it with "Verified" and the verification date.
- Acceptance: Given a reference who does not confirm within 14 days, when the check expires, then the item stays Unverified and is shown without a badge.

**FR-HR-8005 — Licence verification.** An HR professional or agency that recruits for a country requiring a licence must record each licence (issuing authority, country, number, scope, expiry) and upload proof. An operator must verify it with the issuing authority's register where one is published. A licence is required to accept engagements in its scope (FR-HR-8081).
*Priority:* Must. *Status:* Proposed. *Access:* owner or agency admin submits; operator decides. *Source:* owner request; charter regulatory review.
- Acceptance: Given a verified licence, when a client searches for that destination country, then the agency shows "Licensed for <country>" with the expiry date.
- Acceptance: Given a licence that expires, when the expiry date passes, then the badge is removed, new engagements in that scope are blocked, and the holder and their active clients are notified 30, 7, and 0 days before.

**FR-HR-8006 — Public profile pages.** Each published HR professional and agency must have a public page with a stable URL, meaningful title and description, verified badges, track record (FR-HR-8011), and reviews (FR-HR-8012), with structured data that states only verified facts (NFR-19). Unpublished and suspended profiles return "not found" and are excluded from the sitemap.
*Priority:* Must. *Status:* Proposed. *Access:* T0 read. *Source:* owner request; NFR-19.
- Acceptance: Given a published verified profile, when a search engine fetches its page, then it receives the page with its canonical URL and structured data.
- Acceptance: Given a suspended profile, when anyone opens its URL, then the response is "not found" and the page is absent from the sitemap.

### 3.2 Track record and reputation

**FR-HR-8011 — Verified placement record.** The profile must show placements that were completed on Oxinov HR and confirmed by both the client and the candidate (FR-HR-8049): count, sectors, role types, countries, time to fill, and guarantee completion rate. Placements claimed from outside Oxinov may be listed only as "self-reported" and never counted in verified figures.
*Priority:* Must. *Status:* Proposed. *Access:* T0 read of aggregates; no candidate or client names without their consent. *Source:* owner request (authentic platform).
- Acceptance: Given a deployment confirmed by the client and the candidate, when the guarantee period ends, then the verified placement count and completion rate update.
- Acceptance: Given a deployment confirmed only by the HR professional, when the record is computed, then it is not counted.

**FR-HR-8012 — Reviews from real engagements.** Only a client whose engagement reached a final state (completed, cancelled, or disputed and resolved) may review the HR professional or agency, once per engagement, with a rating and text. The reviewed party may reply once. Candidates may rate their experience of the process after an application ends, shown only as an aggregate.
*Priority:* Must. *Status:* Proposed. *Access:* client members of that engagement; candidate of that application. *Source:* owner request.
- Acceptance: Given a completed engagement, when the client submits a review, then it appears on the profile marked "Verified engagement".
- Acceptance: Given a member without a finished engagement with that professional, when they try to review, then the request is refused.

**FR-HR-8013 — Service metrics.** The profile must show metrics computed from platform activity only: median proposal response time, submission-to-interview rate, offer acceptance rate, and dispute rate, each with the number of engagements it is based on. Metrics based on fewer than 3 engagements are shown as "not enough data".
*Priority:* Should. *Status:* Proposed. *Access:* T0 read. *Source:* owner request.
- Acceptance: Given 10 finished engagements, when the profile is viewed, then each metric shows its value and "based on 10 engagements".
- Acceptance: Given 2 finished engagements, when the profile is viewed, then the metrics read "not enough data".

### 3.3 Clients and discovery

**FR-HR-8021 — Client profile and verification.** A platform organization must be business-verified (T4) before it can create mandates, contact HR professionals, or see candidate details. Its client profile shows name, industry, country, size band, and hiring locations.
*Priority:* Must. *Status:* Proposed. *Access:* T4 organization; owner or admin edits. *Source:* owner request.
- Acceptance: Given a verified organization, when a member creates a mandate, then it is saved as a draft for that client.
- Acceptance: Given an unverified organization, when a member tries to contact an HR professional, then the request is refused with the verification steps.

**FR-HR-8022 — Search HR professionals.** Anyone must be able to search published profiles by skill, sector, role type, country served, language, years of experience, service type, fee model, licence (country and scope), verification level, and availability, sorted by relevance, verified placements, or rating, with pagination.
*Priority:* Must. *Status:* Proposed. *Access:* T0. *Source:* owner request.
- Acceptance: Given a search for "nurses", "Gulf region", and "licensed", when results load, then only profiles with those role types, that region, and a verified licence for it appear.
- Acceptance: Given filters that match nothing, when results load, then the page says so and suggests removing the most restrictive filter.

**FR-HR-8023 — Explainable ranking.** Search relevance and recommended matches for a mandate must come from stated factors (skill and sector overlap, countries served, verified placements in the role type, licence fit, availability, rating) and show why ("7 verified placements in nursing; licensed for Qatar"). Paid placement, if ever offered, must be labelled "Sponsored" and never mixed into organic ranking.
*Priority:* Must. *Status:* Proposed. *Access:* T0. *Source:* owner request; AI governance.
- Acceptance: Given a mandate for software engineers in Germany, when recommendations load, then each shows its reasons.
- Acceptance: Given a profile with no verified placements, when ranked, then it is never shown with placement-based reasons.

**FR-HR-8024 — Shortlist and compare.** A client member must be able to save HR professionals to a shortlist per mandate and compare up to four side by side on verification, track record, fee models, and availability.
*Priority:* Should. *Status:* Proposed. *Access:* T4 client member, own client only. *Source:* owner request.
- Acceptance: Given three shortlisted professionals, when the member opens compare, then their attributes appear in columns.
- Acceptance: Given a member of another client, when they request that shortlist, then it is refused.

**FR-HR-8025 — Verified employer and hiring authority.** Every mandate must identify the legal employer and the client organization authorized to recruit for it. Before a mandate can receive proposals or candidate data, the client must attest that it has authority to hire for the employer; when the client and employer differ, an operator must verify that authority and the mandate must show both organizations. A suspended or unverified employer cannot open or receive candidates for a mandate.
*Priority:* Must. *Status:* Proposed. *Access:* T4 client admin submits; operator verifies third-party authority; candidates and engaged HR professionals read the verified employer identity. *Source:* owner request (authentic platform); threat model (fake jobs and recruitment scams).
- Acceptance: Given a verified client hiring for itself, when an admin opens a mandate, then the legal employer is shown to invited professionals and candidates before consent.
- Acceptance: Given a staffing intermediary hiring for another employer without verified authority, when it tries to open the mandate, then publication, proposals, and candidate submission are blocked.

### 3.4 Mandates and engagements

**FR-HR-8031 — Mandates.** A client member must be able to create a mandate: role titles, number of openings, work locations (country and city), requirements (skills, experience, certifications, languages), employment terms (salary range with currency, contract length, benefits, accommodation and travel where relevant), target start date, budget, and whether it is exclusive (one HR professional) or open (several). Mandates are private unless the client invites professionals or opens it for proposals.
*Priority:* Must. *Status:* Proposed. *Access:* T4 client member. *Source:* owner request.
- Acceptance: Given a complete mandate, when the member opens it for proposals, then matching verified professionals can see and propose on it.
- Acceptance: Given a mandate without salary or work location, when the member tries to open it, then it is refused with the missing fields named.

**FR-HR-8032 — Invitations and proposals.** A client must be able to invite HR professionals to a mandate, and an HR professional must be able to send a proposal: approach, scope of services, fee model (percentage of first-year salary, fixed fee per hire, retained fee in stages, or hourly), payment milestones, guarantee period and replacement terms, timeline, and team. A client can accept, decline with a reason, or ask a question.
*Priority:* Must. *Status:* Proposed. *Access:* T4 client; T3 HR professional or agency member, with a licence when the mandate's scope requires one. *Source:* owner request.
- Acceptance: Given an invited licensed agency, when it proposes, then the client sees the proposal with the agency's verification badges.
- Acceptance: Given a professional without a licence required for the mandate's destination country, when they try to propose, then the proposal is refused and the missing licence is named.

**FR-HR-8033 — Engagement agreement.** Accepting a proposal must create an engagement whose agreement combines the Oxinov HR standard terms with the accepted proposal. Both parties accept it explicitly, and the accepted version is stored unchanged with time, account, and IP address. Changes need a new version accepted by both.
*Priority:* Must. *Status:* Proposed. *Access:* T4 client admin or hiring manager; HR professional or agency admin. *Source:* owner request; platform policies.
- Acceptance: Given both parties accept, when the engagement starts, then both can download the signed agreement version.
- Acceptance: Given one party edits the fee after acceptance, when they save, then a new version is proposed and the old one stays in force until the other party accepts.

**FR-HR-8034 — Engagement lifecycle.** An engagement moves through active → paused → completed or cancelled, and may enter disputed. Completion requires all openings filled and guarantee periods ended, or both parties agreeing to close. Cancellation follows the agreement's terms for fees already earned.
*Priority:* Must. *Status:* Proposed. *Access:* parties to the engagement; operators for disputes. *Source:* owner request.
- Acceptance: Given every deployed candidate's guarantee has ended, when the last one ends, then the engagement completes and both parties are asked to review.
- Acceptance: Given an open dispute, when either party tries to complete the engagement, then completion is blocked until the dispute is resolved.

**FR-HR-8035 — Several professionals on one mandate.** For an open mandate, a client must be able to run several engagements in parallel. Each HR professional sees only their own candidates, and candidate ownership follows FR-HR-8043.
*Priority:* Should. *Status:* Proposed. *Access:* T4 client. *Source:* owner request.
- Acceptance: Given two agencies on one mandate, when agency A opens the pipeline, then it sees only its own candidates.
- Acceptance: Given agency B, when it requests agency A's candidate, then the request is refused.

**FR-HR-8036 — Engagement team access.** A client admin and an agency admin must explicitly assign organization members to each engagement with the minimum role needed: view mandate, manage candidates, make decisions, manage agreements, or manage payments. Organization membership alone must not reveal candidate records, messages, documents, agreements, or payment details. Removing a member revokes access immediately without removing their past audit entries.
*Priority:* Must. *Status:* Proposed. *Access:* T4 organization admin manages its own team; assigned members use only their granted engagement roles. *Source:* NFR-11; privacy; owner request (collaboration).
- Acceptance: Given a client interviewer assigned to one engagement with candidate-view access, when they open that engagement, then they can review its submitted candidates but cannot change agreements or payments.
- Acceptance: Given another member of the same client who is not assigned, when they request a candidate URL from the engagement, then the response is "not found" and `authorization.denied` is emitted.

### 3.5 Candidates: from CV to deployment

**FR-HR-8041 — Candidate records and consent.** An HR professional may store only the candidate's name and one contact channel to send an invitation until the candidate has initiated contact or given recorded permission to hold their recruitment data. Before a CV or full record is stored or shared, the candidate must confirm through their own Oxinov account or a single-use, expiring link, see the verified employer, professional, purpose, recipients, countries, and retention period, and consent to representation for that mandate or a stated period. Consent is versioned, may be withdrawn at any time, and withdrawal stops new processing and sharing while preserving only records under a disclosed legal hold.
*Priority:* Must. *Status:* Proposed. *Access:* HR professional, own records only; candidate for own data. *Source:* owner request; privacy law (GDPR, Nepal Privacy Act 2075).
- Acceptance: Given a candidate who confirms the disclosed consent, when the professional uploads the CV and submits them, then only the assigned client team sees the submission and the consent version and date.
- Acceptance: Given no consent, an expired or reused link, or withdrawn consent, when the professional tries to upload a CV or submit the candidate, then the action is refused and no candidate data is disclosed.

**FR-HR-8042 — CV intake assistance.** The system may extract structured fields (experience, skills, education, languages) from an uploaded CV (PDF or Word, up to 10 MB, content-checked, stored privately) to prefill the record. The professional must review every extracted field before it is saved.
*Priority:* Could. *Status:* Proposed. *Access:* HR professional. *Source:* owner request; AI governance.
- Acceptance: Given a CV upload, when extraction finishes, then fields are shown as suggestions until the professional confirms them.
- Acceptance: Given a file that is not a real PDF or Word document, when uploaded, then it is rejected and deleted.

**FR-HR-8043 — Candidate representation and duplicates.** When two HR professionals submit the same candidate to the same mandate, the system must compare normalized, protected identifiers without revealing them to either professional and credit the first server-timestamped submission with mandate-specific valid consent. The client sees one candidate with the credited professional; the later professional learns only that the candidate is already represented for that mandate. The candidate may dispute the result or choose another professional for a future mandate.
*Priority:* Must. *Status:* Proposed. *Access:* system rule; operators for disputes. *Source:* owner request (fair collaboration).
- Acceptance: Given agency A submits a consenting candidate at 10:00 and agency B the same candidate at 10:05, when the client reviews, then agency A is credited and agency B is told the candidate is already represented.
- Acceptance: Given agency A's consent was withdrawn before its submission, when B submits with valid consent, then B is credited without either agency receiving the other's contact data or identifier.

**FR-HR-8044 — Pipeline.** Each engagement must show its candidates through the stages sourced → screened → submitted → client review → interview → offered → offer accepted → pre-deployment → deployed → guarantee → completed, or rejected or withdrawn at any stage with a reason. Every change records who, when, and an optional note; candidates see their own stage but never internal notes.
*Priority:* Must. *Status:* Proposed. *Access:* engagement parties by role; candidate for own stage. *Source:* owner request (CV to deployment).
- Acceptance: Given a client moves a candidate to interview, when the candidate opens their applications, then they see "Interview" and the date.
- Acceptance: Given a candidate, when they open another candidate's record, then access is refused.

**FR-HR-8045 — Submission to the client.** A submission must include the candidate's profile snapshot, CV, screening summary, and the professional's recommendation. The candidate's direct contact details stay hidden from the client until the candidate accepts an interview, so clients cannot bypass the engagement.
*Priority:* Must. *Status:* Proposed. *Access:* client members of the engagement. *Source:* owner request.
- Acceptance: Given a submission, when the client opens it, then contact details are masked.
- Acceptance: Given the candidate accepts an interview, when the client opens the record, then contact details are shown and the reveal is audited.

**FR-HR-8046 — Interviews.** The client or HR professional must be able to propose interview slots with time zones; the candidate picks one or asks for others. Confirmed interviews show in each party's time zone, with reminders, and feedback is recorded against the stage.
*Priority:* Should. *Status:* Proposed. *Access:* engagement parties; candidate. *Source:* owner request.
- Acceptance: Given a client in Doha and a candidate in Kathmandu, when a slot is confirmed, then each sees it in their own time zone.
- Acceptance: Given a slot in the past, when anyone tries to propose it, then it is refused.

**FR-HR-8047 — Offers.** A client must be able to make a written offer (role, salary with currency and period, working hours, contract length, location, benefits, accommodation, travel, start date). The candidate accepts or declines it in their own account. The accepted offer is stored unchanged and becomes the reference for FR-HR-8083.
*Priority:* Must. *Status:* Proposed. *Access:* client to offer; candidate (T2) to accept. *Source:* owner request.
- Acceptance: Given the candidate accepts, when the pipeline updates, then the stage becomes "Offer accepted" and the offer version is locked.
- Acceptance: Given the offer expired, when the candidate tries to accept, then it is refused and the client is told.

**FR-HR-8048 — Pre-deployment checklist.** After an offer is accepted, the engagement must track a checklist from a template for the destination country and role type: signed employment contract, identity and travel documents, qualification attestation, medical examination, police clearance, work permit or visa, pre-departure orientation, insurance, and travel booking. Each item has an owner (client, HR professional, or candidate), a due date, a status, and optional documents. Required items must be complete before deployment can be confirmed.
*Priority:* Must. *Status:* Proposed. *Access:* engagement parties; candidate for own items and documents. *Source:* owner request (to deployment).
- Acceptance: Given all required items complete, when the professional marks the candidate ready, then the client can confirm deployment.
- Acceptance: Given the work permit item still pending, when anyone tries to confirm deployment, then it is refused with the pending items listed.

**FR-HR-8049 — Deployment confirmation.** Deployment must be confirmed by both the client (the candidate reported for work) and the candidate (they started under the offered terms). A candidate who reports different terms opens a review (FR-HR-8083). Confirmed deployment starts the guarantee period.
*Priority:* Must. *Status:* Proposed. *Access:* client member; candidate (T2). *Source:* owner request.
- Acceptance: Given both confirm, when the second confirmation arrives, then the stage becomes "Deployed" and the guarantee period starts.
- Acceptance: Given the candidate reports a lower salary than offered, when they confirm, then deployment is held and an operator review opens.

**FR-HR-8050 — Guarantee and replacement.** During the guarantee period, the client must be able to report that a deployed candidate left, with a reason. The engagement then follows the agreement's replacement terms: a replacement candidate in the pipeline, or a partial refund of the fee.
*Priority:* Should. *Status:* Proposed. *Access:* client member; HR professional. *Source:* owner request.
- Acceptance: Given a candidate leaves on day 30 of a 90-day guarantee, when the client reports it, then a replacement opening is added to the engagement.
- Acceptance: Given the guarantee has ended, when the client reports a departure, then no replacement or refund is created.

**FR-HR-8051 — Fair screening and reasonable accommodation.** Every mandate and screening scorecard must use job-related criteria disclosed to the candidate. Candidates must be able to request a reasonable accommodation for application, assessment, or interview without that request affecting ranking. Protected characteristics and accommodation requests must not be used as filters, ranking inputs, rejection reasons, or client-visible screening signals except where a launch-country law both permits and requires a documented occupational condition.
*Priority:* Must. *Status:* Proposed. *Access:* candidate requests; assigned engagement members arrange accommodation; operators review exceptions. *Source:* accessibility standard; AI governance; fair-recruitment principles.
- Acceptance: Given a candidate requests a screen-reader-compatible assessment, when the interview team reviews the candidate, then the accommodation is arranged and neither the request nor disability is shown as a ranking factor.
- Acceptance: Given a client adds a protected characteristic as a screening filter without an operator-approved legal basis, when it tries to open the mandate, then the filter is rejected and the mandate stays closed.

**FR-HR-8052 — Decision notice and correction.** When a candidate is rejected, withdrawn by a client, or removed after screening, the candidate must receive a timely status notice with a job-related reason category, the responsible human decision maker, and a way to correct inaccurate profile or screening data or report discrimination. Correcting data does not automatically reverse the decision, but the assigned decision maker must review a timely correction before the mandate closes.
*Priority:* Must. *Status:* Proposed. *Access:* assigned client decision maker records; candidate reads and requests correction for own application. *Source:* fair-recruitment principles; AI governance; privacy accuracy rights.
- Acceptance: Given a client rejects a candidate for a missing required licence, when it records the decision, then the candidate sees the reason category and may provide evidence that the licence record is wrong.
- Acceptance: Given a client tries to reject a candidate with only an AI score or a protected characteristic as the reason, when it submits the decision, then the action is refused and requires a job-related human-authored reason.

### 3.6 Collaboration workspace

**FR-HR-8061 — Engagement messages.** Engagement parties must be able to message in an engagement thread and in per-candidate threads, with read state and attachments. Candidates message only in their own thread. Messages cannot be edited after 10 minutes or deleted, and can be reported. Oxinov HR keeps these threads until platform messaging (FR-MSG) exists, then moves them there.
*Priority:* Must. *Status:* Proposed. *Access:* engagement parties by thread; candidate for own thread. *Source:* owner request (collaborate).
- Acceptance: Given a client and an agency on an engagement, when either posts, then the other sees it with the author and time.
- Acceptance: Given a member of another client, when they request the thread, then it is refused.

**FR-HR-8062 — Shared documents.** Engagement parties must be able to share documents with an access list per document (client, HR professional, candidate), optional expiry, and a download log. Identity and medical documents are visible only to the parties that need them for the checklist item.
*Priority:* Must. *Status:* Proposed. *Access:* per-document access list. *Source:* owner request; privacy.
- Acceptance: Given a medical report shared only with the HR professional, when a client member requests it, then access is refused.
- Acceptance: Given a document past its expiry, when anyone opens it, then access is refused and the owner can re-share it.

**FR-HR-8063 — Tasks and milestones.** Engagement parties must be able to create tasks with an owner and due date, linked to a candidate or a checklist item, and see engagement milestones (for example first submissions, interviews, offers, deployments) against the mandate's target dates.
*Priority:* Should. *Status:* Proposed. *Access:* engagement parties. *Source:* owner request.
- Acceptance: Given a task due tomorrow, when the day starts in the owner's time zone, then the owner is reminded.
- Acceptance: Given a party outside the engagement, when they request its tasks, then access is refused.

### 3.7 Fees and payments

**FR-HR-8071 — Fee milestones.** Each engagement must carry the agreed fee milestones (for example on engagement start for retained fees, on offer accepted, on deployment, and on guarantee completion), each with an amount in a stated currency and the event that makes it due. Milestones become due automatically when their event occurs.
*Priority:* Must. *Status:* Proposed. *Access:* engagement parties read; client admin pays. *Source:* owner request.
- Acceptance: Given a milestone "on deployment", when deployment is confirmed, then an invoice for that amount is issued to the client.
- Acceptance: Given a deployment still on hold (FR-HR-8049), when milestones are evaluated, then the deployment milestone is not due.

**FR-HR-8072 — Payment through the platform.** Clients must pay milestones through platform payments (FR-PAY), with funds for the next milestone optionally held in escrow and released on the milestone event, minus the Oxinov service fee. Invoices and receipts are issued for every payment.
*Priority:* Must. *Status:* Proposed. *Access:* client admin; HR professional or agency admin receives payouts (T3 or T4). *Source:* owner request; Platform FRD PAY.
- Acceptance: Given an escrowed milestone and its event, when the event is confirmed, then the payout is released to the professional and both receive documents.
- Acceptance: Given a dispute on the milestone, when the event occurs, then funds stay held until the dispute is resolved.

**FR-HR-8073 — No fees from candidates.** No party may request or accept any fee, deposit, or deduction from a candidate for recruitment, placement, documentation, or deployment (the employer-pays principle, ILO Convention 181 and the ILO fair recruitment principles; Nepal's "free visa, free ticket" policy for covered countries). The system must never create a charge addressed to a candidate, must flag messages asking candidates for money, and must let candidates report a fee request in one step.
*Priority:* Must. *Status:* Proposed. *Access:* system rule; operators act on reports. *Source:* owner request; charter regulatory review.
- Acceptance: Given a professional's message asking a candidate to "pay for the visa", when it is sent, then it is flagged for operator review and the candidate sees how to report it.
- Acceptance: Given a confirmed report of a fee taken from a candidate, when the operator decides, then the professional or agency is suspended (FR-HR-8092) and the client is notified.

**FR-HR-8074 — Disputes.** Either engagement party must be able to open a dispute about a milestone, a candidate, or the agreement, with evidence. An operator mediates and records the outcome (release, partial release, refund); held funds follow the outcome.
*Priority:* Must. *Status:* Proposed. *Access:* engagement parties open; operator decides. *Source:* owner request.
- Acceptance: Given a disputed milestone, when the operator decides a 50% release, then half is paid out and half refunded, and both parties see the decision and reason.
- Acceptance: Given a party outside the engagement, when they try to open a dispute on it, then it is refused.

### 3.8 Cross-border recruitment and deployment

**FR-HR-8081 — Licence rules by country.** Oxinov HR must keep an operator-maintained register of licence requirements per origin and destination country and activity (recruiting, placing abroad). An engagement that deploys candidates from one country to another must have, on the recruiting side, the licences the register requires for that route; otherwise proposals, submissions, and deployment on that route are blocked.
*Priority:* Must. *Status:* Proposed. *Access:* operators maintain; system enforces. *Source:* charter regulatory review (for example the Nepal Foreign Employment Act).
- Acceptance: Given a route Nepal → Qatar that requires a Nepal foreign employment licence, when an agency without one proposes, then the proposal is refused and the requirement is named.
- Acceptance: Given the register lists no licence for a domestic route, when a verified professional proposes, then no licence is required.

**FR-HR-8082 — Blocked destinations and roles.** Operators must be able to block destination countries (for example under government bans or sanctions) and role types; blocked mandates cannot be opened and running engagements on them are paused with notice.
*Priority:* Must. *Status:* Proposed. *Access:* operators. *Source:* policy.
- Acceptance: Given a destination is blocked, when a client tries to open a mandate there, then it is refused with the reason.
- Acceptance: Given an active engagement to a newly blocked destination, when the block takes effect, then the engagement pauses and all parties are notified.

**FR-HR-8083 — No contract substitution.** The signed employment contract uploaded in pre-deployment must be compared against the accepted offer (salary, hours, contract length, role, location). Any worse term must be shown to the candidate side by side with the offer before they sign, and requires the candidate's explicit acceptance; the difference is recorded and reported to operators.
*Priority:* Must. *Status:* Proposed. *Access:* system rule; candidate decides; operators review. *Source:* ILO fair recruitment principles.
- Acceptance: Given a contract with a lower salary than the offer, when it is uploaded, then the candidate sees both values and must accept the change explicitly, and an operator is alerted.
- Acceptance: Given a contract that matches the offer, when it is uploaded, then the checklist item completes without review.

**FR-HR-8084 — Worker safety signals.** The system must flag patterns that suggest exploitation or trafficking (fee requests, document retention requests, sudden destination or employer changes, many candidates confirming lower terms) for operator review, and every candidate page must link to a confidential report form and published helplines for their destination.
*Priority:* Must. *Status:* Proposed. *Access:* system; operators. *Source:* policy; charter regulatory review.
- Acceptance: Given a candidate reports their passport was taken, when submitted, then an urgent operator case opens and the engagement is paused.
- Acceptance: Given a flagged pattern that the operator clears, when closed, then the reason is recorded and the engagement resumes.

### 3.9 Trust, moderation, and audit

**FR-HR-8091 — Reports.** Any signed-in member must be able to report a profile, agency, mandate, message, or review with a reason. Operators see a queue ordered by severity, act (dismiss, remove, warn, suspend), and the reporter is told the outcome without personal details.
*Priority:* Must. *Status:* Proposed. *Access:* T1 to report; operators act. *Source:* platform policies.
- Acceptance: Given a report of a fake certification, when the operator confirms it, then the badge is removed and the professional is warned or suspended.
- Acceptance: Given a visitor who is not signed in, when they try to report, then they are asked to sign in first.

**FR-HR-8092 — Suspension.** An operator must be able to suspend an HR professional, agency, or client with a reason and appeal note. A suspended professional or agency disappears from search and cannot propose or submit; their active engagements are paused and the clients may reassign candidates with the candidates' consent.
*Priority:* Must. *Status:* Proposed. *Access:* operators. *Source:* platform policies.
- Acceptance: Given a suspended agency, when a client opens its engagement, then it shows "paused" and offers reassignment.
- Acceptance: Given a suspended member, when they try to send a proposal, then it is refused.

**FR-HR-8093 — Audit log.** Verification decisions, licence changes, agreement versions, consent grants and withdrawals, contact reveals, document downloads, pipeline changes, payments, disputes, and moderation actions must be written to an append-only audit log with actor, time, target, and reason.
*Priority:* Must. *Status:* Proposed. *Access:* operators read; parties read entries about their own engagements. *Source:* NFR-11; platform policies.
- Acceptance: Given a client downloads a candidate's CV, when the download completes, then an audit entry records who, when, and which document.
- Acceptance: Given anyone, when they try to edit or delete an audit entry, then it is refused.

**FR-HR-8094 — Security events.** The product must emit schema-valid security events for denied cross-organization access, unauthorized engagement access, malware uploads, bulk or unusual candidate-data exports, privilege changes, fee-request reports, and worker-safety escalations. Events must use actions registered in the [security event catalog](../security/soc/EVENT-CATALOG.md), contain no CV text, document contents, medical data, private messages, or raw AI prompts, and preserve the request and audit correlation identifiers.
*Priority:* Must. *Status:* Proposed. *Access:* system emits; authorized security operators read. *Source:* NFR-15; security event schema and catalog.
- Acceptance: Given a member requests another organization's candidate record, when access is denied, then `tenant.cross_access.denied` is emitted without candidate personal data.
- Acceptance: Given an ordinary authorized candidate view, when it succeeds, then no high-severity security event is emitted merely for viewing the record.

### 3.10 Privacy

**FR-HR-8101 — Purpose, transfer, and retention notice.** Before consenting (FR-HR-8041), a candidate must see which parties will receive their data, in which countries, for what purpose, and for how long. Candidate data is used only for the consented mandates and is deleted or anonymized when retention ends.
*Priority:* Must. *Status:* Proposed. *Access:* candidate. *Source:* GDPR, Nepal Privacy Act 2075; platform privacy policy.
- Acceptance: Given a mandate in Germany, when the candidate opens the consent page, then Germany and the client's name are listed as recipients.
- Acceptance: Given retention has ended for a rejected candidate, when the retention job runs, then their record is anonymized and their CV deleted.

**FR-HR-8102 — Export and deletion.** Candidates and HR professionals must be able to download their Oxinov HR data and delete their profile. Deletion removes profiles, CVs, and documents, and anonymizes pipeline records for clients after the legal retention period for employment records; audit records keep only pseudonymous IDs.
*Priority:* Must. *Status:* Proposed. *Access:* own data only. *Source:* platform privacy (FR-PRIV).
- Acceptance: Given a candidate requests deletion, when it completes, then their CV and documents are gone and clients see "Former candidate".
- Acceptance: Given a candidate deployed within the legal retention period, when they request deletion, then the employment record is kept until the period ends and they are told why.

**FR-HR-8103 — Retention schedule and legal holds.** Before a launch country is enabled, the data owner must configure a reviewed retention period for invitations, declined or rejected candidates, completed placements, messages, agreements, financial records, documents, consent evidence, audit entries, and backups. A legal or dispute hold must name its reason, owner, review date, and affected records; it pauses deletion only for those records and ends through a recorded decision. Talent-pool retention requires separate, expiring candidate consent and must not be inferred from consent to one mandate.
*Priority:* Must. *Status:* Proposed. *Access:* privacy operator configures; candidates read the applicable periods; authorized legal operators manage holds. *Source:* data retention standard; platform privacy (FR-PRIV).
- Acceptance: Given a rejected candidate whose disclosed retention period ends with no hold or talent-pool consent, when the deletion job runs, then the CV and candidate documents are deleted and the minimal audit record is pseudonymized.
- Acceptance: Given a client marks every candidate as indefinitely retained without a reviewed schedule or separate talent-pool consent, when it saves, then the request is refused.

### 3.11 Integrations and AI

**FR-HR-8141 — Publish to Oxinov Jobs.** An HR professional must be able to publish an engagement's opening as a posting on Oxinov Jobs (for Nepal roles) on the client's behalf, through the Jobs API, with the client named as employer and the professional as recruiter. Applications arriving from Jobs enter the engagement pipeline with the candidate's consent.
*Priority:* Should. *Status:* Proposed. *Access:* HR professional with client approval; Jobs rules apply (FR-JOB-6021 to 6023). *Source:* owner request; ADR-019.
- Acceptance: Given client approval, when the professional publishes, then the posting appears on Oxinov Jobs and links back to the engagement.
- Acceptance: Given no client approval, when the professional tries to publish, then it is refused.

**FR-HR-8142 — Verified Oxinov Edu certificates.** Candidates must be able to attach certificates earned in Oxinov Edu, read through the Edu API and shown as verified with course and issue date.
*Priority:* Could. *Status:* Proposed. *Access:* candidate, own certificates. *Source:* ADR-019.
- Acceptance: Given an earned certificate, when attached, then clients see it marked "Verified by Oxinov Edu".
- Acceptance: Given a certificate the candidate did not earn, when they try to attach it, then it is refused.

**FR-HR-8143 — AI assistance with a person deciding.** AI features (CV extraction, screening summaries, match explanations, message drafting) must follow the [AI governance](../security/AI-GOVERNANCE.md) rules: they only suggest, are labelled as AI-generated, never reject or advance a candidate on their own, never use protected characteristics (gender, caste, religion, ethnicity, age, marital status, disability, nationality where unlawful), and log which model version produced each suggestion.
*Priority:* Must. *Status:* Proposed. *Access:* system rule. *Source:* AI governance; owner request.
- Acceptance: Given an AI screening summary, when a recruiter views it, then it is marked AI-generated and the recruiter must choose the next stage themselves.
- Acceptance: Given a prompt or feature that would use a protected characteristic, when evaluated, then it is blocked and logged.

## 4. Product dependencies

| Needs | From | Interim until available |
| --- | --- | --- |
| Sign-in, one account, trust T1–T2 | Platform ID, TRUST (live) | None |
| Identity verification (T3) | FR-KYC individual verification | Operator verification with the same evidence rules; no document storage in HR |
| Business verification (T4) | FR-KYC organization verification | Operator verification of registration documents (as FR-JOB-6012) |
| Organizations and roles | FR-ORG | HR keeps agency and client membership keyed by account ID |
| Payments, escrow, payouts, invoices | FR-PAY | **Blocking**: engagements run without in-platform payment; fees settled off-platform and milestones tracked only (FR-HR-8071 without 8072) |
| Notifications | FR-NOTIF | Email through the mail relay |
| Messaging | FR-MSG | Engagement-scoped threads in HR (FR-HR-8061) |
| Job postings | Oxinov Jobs API | Integration waits for Jobs build step 2 |
| Certificates | Oxinov Edu certificates API | Hidden until Edu issues certificates |

## 5. Open decisions

- **Release approval:** the owner approves the product, first-release scope, and budget before implementation (release gate in the [product record](../products/hr/README.md)).
- **Legal review:** employment agency, foreign employment, data protection, and cross-border transfer rules for the launch countries, starting with Nepal and the main destination countries. This blocks publishing.
- **Business model:** Oxinov service fee (percentage of milestone payments, subscription for agencies, or both) and whether payments launch with escrow.
- **Launch markets:** which origin and destination countries and sectors open first, and the verification partners for licences in each.
- **Language of employment documents:** the product is English only (ADR-020), but contracts and offers may legally need the candidate's language in some countries. Decide whether documents in other languages are uploaded as attachments alongside the English record.
- **Liability and insurance:** Oxinov's role and limits of liability as a platform, not an agency.

## 6. Build order

1. Foundation: `hr-web`, `hr-api`, database `oxinov_hr` with row-level security; HR professional and agency profiles with identity and credential verification (8001–8006).
2. Discovery: client and hiring-authority verification, search, ranking, shortlists, public pages, and track record (8011–8013, 8021–8025).
3. Engagements: mandates, proposals, agreements, lifecycle, and least-privilege teams (8031–8036), messaging and documents (8061–8063).
4. Candidates from CV to deployment: consent, pipeline, submissions, interviews, offers, pre-deployment, deployment, guarantee, fair screening, accommodation, and correction (8041–8052).
5. Fees and payments: milestones, platform payments, no-fee rule, disputes (8071–8074); needs FR-PAY.
6. Cross-border rules, safety, moderation, audit, security events, privacy, and retention (8081–8084, 8091–8094, 8101–8103). The moderation, audit, security-event, privacy, and retention requirements are required before any engagement opens; the cross-border requirements and legal review are additionally required before any cross-border engagement opens.
7. Integrations and AI: Jobs, Edu certificates, AI assistance (8141–8143).

Each step ships through the normal pipeline. Steps describe dependency order, not permission to expose incomplete controls: `hr.oxinov.com` remains private until steps 1–4 and the domestic parts of step 6 pass their acceptance tests and the owner closes the release gate. Cross-border engagements open only after all of step 6 and the country-specific legal review. Steps 5 and 7 may launch later only if their unavailable features are hidden and the owner approves that reduced release scope.
