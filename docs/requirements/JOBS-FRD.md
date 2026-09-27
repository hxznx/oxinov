# Functional Requirements Document: Oxinov Jobs

**Version:** 1.1
**Date:** 2026-09-28
**Status:** Approved by the owner for the full first release (ADR-022)
**Scope:** `jobs.oxinov.com`: candidate profiles, employers, job postings, search, applications, application messaging, matching, verified Oxinov Edu certificates, moderation, and privacy for Oxinov Jobs.
**Standard:** [Oxinov requirements standard](README.md). Number block **6000–6999**, area `JOB`.

## Implementation status (2026-09-27)

Nothing is built yet. Each requirement's *Status* line moves to **Implemented** when its code, tests, and documentation are merged and verified. The build order is in section 6.

## 1. Purpose and scope

Oxinov Jobs connects verified candidates, including Oxinov Edu graduates, with verified employers in Nepal, using skill and location matching that people can understand. It is the second product plane on the Oxinov platform. It uses the platform for identity, trust, policies, organizations, verification, notifications and plans, and Oxinov Edu for certificates.

Out of scope for the first release: training, exams, and certifications (Oxinov Edu); coins, wallets, or paid credits; recruitment or placement for employment abroad, including Japan SSW (needs a foreign employment licence); automated hiring decisions (AI may rank or summarize; a person decides); its own login, one-time codes, KYC, notification delivery, or payments.

Sources: [Jobs charter](../products/JOBS.md), [product record](../products/jobs/README.md), [platform blueprint](../company/PLATFORM-BLUEPRINT.md), [identity and access](../architecture/IDENTITY-AND-ACCESS.md), ADR-008, ADR-010, ADR-011, ADR-019, ADR-022.

### Shared terms

| Term | Meaning |
| --- | --- |
| Candidate | A person with an Oxinov account who keeps a Jobs profile |
| Employer | A platform organization verified for hiring in Nepal |
| Recruiter | A member of an employer organization with the recruiter or admin role in Jobs |
| Posting | A job advertisement owned by one employer |
| Application | One candidate's application to one posting, with its status history |
| Operator | Oxinov operations staff with the Jobs moderator role |

## 2. Roles

| Role | Can do | Trust and policy |
| --- | --- | --- |
| Visitor | Browse and search approved postings and employer profiles | T0 |
| Candidate | Keep a profile, save postings, apply, message on own applications | T1 to create a profile; T2 (verified email) to apply or message; Oxinov Terms and Privacy |
| Recruiter | Post jobs, review applications, message applicants for their employer | T4 business-verified employer; Employer Policy |
| Employer admin | Everything a recruiter can, plus manage recruiters and the employer profile | Organization owner or admin |
| Operator | Verify employers (interim), moderate postings and reports, suspend | Oxinov staff role with MFA |

## 3. Functional requirements

### 3.1 Candidate profile

**FR-JOB-6001 — Candidate profile.** A member must be able to create one Jobs profile linked to their Oxinov account: headline, summary, location (district and municipality in Nepal), desired job types, expected salary range (optional), and languages. Contact details come from the account and are never copied into the profile.
*Priority:* Must. *Status:* Approved. *Access:* T1, own profile only. *Source:* charter.
- Acceptance: Given a signed-in member, when they save a profile, then it is stored against their account ID and shown back to them.
- Acceptance: Given another member, when they try to edit it, then the request is refused and a security event is emitted.

**FR-JOB-6002 — Skills and employment history.** A candidate must be able to add skills (from the skill list, with a self-rated level) and employment history entries (employer name, title, start and end month, description).
*Priority:* Must. *Status:* Approved. *Access:* own profile. *Source:* charter.
- Acceptance: Given a candidate adds a valid skill and employment entry, when they save, then the profile shows both in the order they chose.
- Acceptance: Given an end month before the start month, when saving, then the entry is refused with a clear message.

**FR-JOB-6003 — CV upload.** A candidate may upload one CV (PDF or Word, up to 5 MB) with a content check, stored privately; recruiters see it only through an application to their posting.
*Priority:* Should. *Status:* Approved. *Access:* own profile; recruiters of an applied-to employer. *Source:* charter, data classification.
- Acceptance: Given a file that is not a PDF or Word document, when uploading, then it is refused and removed.
- Acceptance: Given a recruiter without an application from this candidate, when they request the CV, then the answer is "not found".

**FR-JOB-6004 — Profile visibility.** A candidate must choose whether their profile is private (seen only by employers they apply to) or discoverable (verified employers can find it in candidate search). The default is private.
*Priority:* Must. *Status:* Approved. *Access:* own profile. *Source:* charter, privacy.
- Acceptance: Given a candidate changes a private profile to discoverable, when the change is saved, then only verified employers can find it in candidate search.
- Acceptance: Given a private profile, when a recruiter searches candidates, then it never appears.

### 3.2 Employers

**FR-JOB-6011 — Employer profile.** A platform organization must be able to create an employer profile: display name, logo, industry, size band, district, website, and description.
*Priority:* Must. *Status:* Approved. *Access:* organization owner or admin. *Source:* charter, FR-ORG-2501.
- Acceptance: Given an organization owner provides valid fields, when they save, then the profile remains private until employer verification succeeds.
- Acceptance: Given a member who is not an owner or admin of the organization, when they edit the employer profile, then the request is refused.

**FR-JOB-6012 — Employer verification.** An employer must be verified before its postings are published. Verification uses platform organization KYC (FR-KYC) when available. Until then, an operator verifies the employer from submitted registration details (company registration and PAN numbers, contact person), and the decision, operator, and time are audited.
*Priority:* Must. *Status:* Approved. *Access:* operator decides; employer admin submits. *Source:* charter, ADR-022 (interim operator verification).
- Acceptance: Given an unverified employer, when a recruiter submits a posting, then it stays in draft with the reason "employer not verified".
- Acceptance: Given a rejected verification, then the employer sees the reason and can resubmit.

**FR-JOB-6013 — Recruiters.** An employer admin must be able to grant and remove the Jobs recruiter role for members of the organization. Removing a recruiter keeps their postings with the employer.
*Priority:* Must. *Status:* Approved. *Access:* employer admin. *Source:* charter.
- Acceptance: Given an employer admin grants the recruiter role to a current organization member, when the member next makes a protected request, then they can manage that employer's postings.
- Acceptance: Given a removed recruiter, when they open the employer's applications, then access is refused.

### 3.3 Postings

**FR-JOB-6021 — Create and edit postings.** A recruiter must be able to create a posting: title, description, job type (full-time, part-time, contract, internship), work mode (on-site, hybrid, remote), district, required and preferred skills, experience range, salary range with currency (NPR) or "not disclosed", number of openings, and closing date.
*Priority:* Must. *Status:* Approved. *Access:* recruiter of a verified employer, T4. *Source:* charter.
- Acceptance: Given a closing date in the past, when saving, then the posting is refused.
- Acceptance: Given a recruiter of another employer, when they edit the posting, then the answer is "not found".

**FR-JOB-6022 — Posting lifecycle.** A posting moves through draft → in review → published → closed, or → rejected with a reason. It closes automatically on its closing date. Edits to a published posting's title, description, or salary return it to review; other edits do not.
*Priority:* Must. *Status:* Approved. *Access:* recruiter; operator for review. *Source:* charter.
- Acceptance: Given an approved in-review posting, when an operator publishes it, then it appears in public search and its publication actor and time are audited.
- Acceptance: Given a closed posting, when a candidate applies, then the application is refused.

**FR-JOB-6023 — Posting content rules.** Postings must not state discriminatory requirements (for example gender, caste, religion, or marital status) unless the law allows it for that role, must not ask candidates for fees, and must not advertise work abroad. Automatic checks flag likely violations for operator review; they never publish or reject on their own.
*Priority:* Must. *Status:* Approved. *Access:* system checks, operator decides. *Source:* charter regulatory review (Nepal Labour Act; Foreign Employment Act).
- Acceptance: Given a compliant Nepal posting, when automated checks find no concern, then it still follows the normal human review and publication lifecycle.
- Acceptance: Given a posting that asks for a fee, when it is submitted, then it is flagged and held in review.

**FR-JOB-6024 — Urgent postings.** A recruiter may mark a posting urgent with a hiring date within 14 days; urgent postings are labelled and can be filtered. At most three urgent postings per employer at a time.
*Priority:* Could. *Status:* Approved. *Access:* recruiter. *Source:* charter (`UrgentJob` concept).
- Acceptance: Given a published posting with a hiring date within 14 days and fewer than three active urgent postings, when marked urgent, then it receives the urgent label and appears in the urgent filter.
- Acceptance: Given three urgent postings, when a fourth is marked urgent, then it is refused.

### 3.4 Browse and search

**FR-JOB-6031 — Public job search.** Anyone must be able to browse and search published postings by keyword, district, job type, work mode, salary range, and skill, sorted by relevance or newest, with pagination.
*Priority:* Must. *Status:* Approved. *Access:* T0. *Source:* charter.
- Acceptance: Given published postings matching two selected filters, when a visitor searches, then every returned result satisfies both filters and pagination is stable.
- Acceptance: Given draft, in-review, rejected, or closed postings, when searching, then they never appear.

**FR-JOB-6032 — Posting and employer pages.** Each published posting and verified employer must have a public page with a stable URL, meaningful title and description, and JobPosting structured data (NFR-19) that states only real values (no invented salary).
*Priority:* Must. *Status:* Approved. *Access:* T0. *Source:* NFR-19.
- Acceptance: Given a published posting, when its page is fetched, then its canonical URL, employer, closing date, and real job attributes match the posting record.
- Acceptance: Given a posting with salary "not disclosed", then the structured data contains no salary.

**FR-JOB-6033 — Saved postings.** A candidate must be able to save and unsave postings and see their saved list; closed postings stay listed as closed.
*Priority:* Should. *Status:* Approved. *Access:* T1, own list. *Source:* charter.
- Acceptance: Given a candidate saves a published posting, when they open their saved list, then it appears once.
- Acceptance: Given another candidate, when they request that saved list, then the response is "not found".

**FR-JOB-6034 — Trending skills and postings.** The home page may show the most-applied postings and most-requested skills of the last 7 days, computed from counts only.
*Priority:* Could. *Status:* Approved. *Access:* T0. *Source:* charter (`TrendingJob`, `TrendingSkill`).
- Acceptance: Given sufficient activity during the last 7 days, when trends are calculated, then results use aggregate counts and a stated window.
- Acceptance: Given a group below the privacy publication threshold, when trends are calculated, then that group and its candidate identities are not shown.

### 3.5 Applications

**FR-JOB-6041 — Apply.** A candidate must be able to apply once to a published posting with their profile, an optional cover note (up to 2,000 characters), and their CV when one exists. The employer receives a snapshot of the profile at the time of applying.
*Priority:* Must. *Status:* Approved. *Access:* T2, own applications. *Source:* charter.
- Acceptance: Given an existing application to the same posting, when applying again, then it is refused.
- Acceptance: Given a T1 member without a verified email, when applying, then they are asked to verify first.

**FR-JOB-6042 — Application status lifecycle.** A recruiter must be able to move an application through submitted → reviewing → shortlisted → interview → offered → hired, or → rejected at any stage; the candidate may withdraw before a decision. Every change records who, when, and an optional note. A rejection requires a job-related reason category and a human decision maker; the candidate sees the status and reason category but not internal notes.
*Priority:* Must. *Status:* Approved. *Access:* recruiter of the posting's employer; candidate for own. *Source:* charter.
- Acceptance: Given a hired or rejected application, when a recruiter changes it, then only a documented reopen to reviewing is allowed.
- Acceptance: Given a recruiter of another employer, when they read the application, then the answer is "not found".

**FR-JOB-6043 — Applicant review.** A recruiter must see, per posting, the applications with status filters, the match explanation (FR-JOB-6061), profile snapshot, CV, and certificates, and must be able to add private notes and ratings visible only to the employer's recruiters.
*Priority:* Must. *Status:* Approved. *Access:* recruiter. *Source:* charter.
- Acceptance: Given a recruiter assigned to the posting's employer, when they filter by shortlisted, then only that posting's shortlisted applications appear with the application-time snapshot.
- Acceptance: Given a candidate or recruiter from another employer, when they request private notes or ratings, then the response is "not found".

**FR-JOB-6044 — Candidate application list.** A candidate must see all their applications with posting, employer, current status, and history, including withdrawn and closed ones.
*Priority:* Must. *Status:* Approved. *Access:* own applications. *Source:* charter.
- Acceptance: Given a candidate with active and closed applications, when they open the list, then both appear with their complete public status histories.
- Acceptance: Given another candidate, when they request the list, then the response is "not found".

### 3.6 Messaging

**FR-JOB-6051 — Application messages.** A recruiter and the candidate of an application must be able to exchange text messages in that application's thread, with read state. Messages cannot be edited after 10 minutes or deleted, and either side can report a message. The thread is closed 90 days after the application ends. Jobs stores these messages until platform messaging (FR-MSG) exists and then moves them there.
*Priority:* Must. *Status:* Approved. *Access:* T2; parties to the application only. *Source:* charter, ADR-022.
- Acceptance: Given a person who is not a party, when they request the thread, then the answer is "not found".
- Acceptance: Given a candidate, when they try to message an employer they have not applied to, then there is no way to do so.

**FR-JOB-6052 — Notifications.** Status changes and new messages must notify the other party through the platform notification service when it exists, and until then by email through the Oxinov mail relay, with a link and without message content.
*Priority:* Should. *Status:* Approved. *Access:* system. *Source:* FR-NOTIF, ADR-022.
- Acceptance: Given a recruiter changes an application status, when the transaction commits, then one notification is queued for the candidate with a link and no CV, note, or message text.
- Acceptance: Given notification delivery is retried, when the same event is processed again, then no duplicate notification is created.

### 3.7 Matching

**FR-JOB-6061 — Explainable matching.** For each application and in candidate search, the system must compute a match score from required and preferred skills, experience, district and work mode, and show why ("4 of 5 required skills; same district"). The score only orders lists; it never rejects or hides a candidate, and a person makes every decision.
*Priority:* Must. *Status:* Approved. *Access:* recruiter; candidate sees their own match on a posting. *Source:* charter, AI governance.
- Acceptance: Given a candidate and posting with matching job-related fields, when the match is computed, then both the score inputs and plain-language explanation are reproducible from those fields.
- Acceptance: Given two candidates with equal skills, then protected characteristics (gender, caste, religion, age, marital status) never change the score; they are not inputs.

**FR-JOB-6062 — Recommended postings.** A candidate must see postings ranked by the same match, with the explanation, on their home page.
*Priority:* Should. *Status:* Approved. *Access:* own profile. *Source:* charter.
- Acceptance: Given a candidate with profile skills and location, when recommendations load, then each published posting shows its job-related match explanation.
- Acceptance: Given a closed, rejected, or foreign-employment posting, when recommendations load, then it is excluded.

**FR-JOB-6063 — Candidate search.** A recruiter of a verified employer must be able to search discoverable profiles (FR-JOB-6004) by skill, district, and experience, and invite a candidate to apply to a posting; the invitation reveals no contact details until the candidate applies.
*Priority:* Should. *Status:* Approved. *Access:* recruiter, T4. *Source:* charter.
- Acceptance: Given a verified employer recruiter searches for a skill and district, when results load, then only matching discoverable profiles appear and contact fields remain hidden.
- Acceptance: Given an unverified employer or a private profile, when candidate search runs, then the profile is not returned and no invitation can be sent.

### 3.8 Oxinov Edu certificates

**FR-JOB-6071 — Verified certificates.** A candidate must be able to add certificates they earned in Oxinov Edu to their profile; Jobs reads them through the Edu API (never its database) and shows them as verified with the course and issue date. A certificate the candidate did not earn cannot be added.
*Priority:* Should. *Status:* Approved. *Access:* own profile; Edu API with the candidate's consent. *Source:* charter, ADR-008.
- Acceptance: Given the candidate consents and owns a valid Edu certificate, when they add it, then Jobs shows its verified course, issue date, and current validity from the Edu API.
- Acceptance: Given a certificate ID of another person, when adding it, then it is refused.

### 3.9 Moderation and operations

**FR-JOB-6081 — Reports.** Anyone signed in must be able to report a posting, employer, or message with a reason. Operators see a queue, act (dismiss, remove, suspend), and the reporter is told the outcome without personal details.
*Priority:* Must. *Status:* Approved. *Access:* T1 to report; operator to act. *Source:* charter moderation plan.
- Acceptance: Given a signed-in member reports a published posting with a supported reason, when submitted, then one case appears in the operator queue and the reporter receives its reference.
- Acceptance: Given a reporter requests private moderation notes or another reporter's identity, when the case outcome is shown, then those details are omitted.

**FR-JOB-6082 — Suspension.** An operator must be able to suspend an employer (all postings unpublished, no new postings) or a candidate (cannot apply or message), with a reason, audit record, and appeal note.
*Priority:* Must. *Status:* Approved. *Access:* operator. *Source:* platform policies.
- Acceptance: Given an operator suspends an employer, when the action commits, then its postings leave public search and its recruiters cannot publish or access new candidate data.
- Acceptance: Given a non-operator attempts suspension, when the request is authorized, then it is refused and `authorization.denied` is emitted.

**FR-JOB-6083 — Audit.** Verification decisions, moderation actions, status changes, recruiter grants, and CV access must be written to an append-only audit log with actor, time, target, and reason.
*Priority:* Must. *Status:* Approved. *Access:* operator reads. *Source:* security baseline.
- Acceptance: Given a recruiter downloads a CV, when access succeeds, then an audit entry records the actor, application, document, and UTC time without CV content.
- Acceptance: Given any actor attempts to edit or delete an audit entry, when the request is processed, then it is refused.

### 3.10 Privacy

**FR-JOB-6091 — Export and deletion.** A candidate must be able to download their Jobs data and delete their profile. Deletion removes the profile and CV and anonymizes their applications for the employers 30 days after the last application closes; audit records keep only pseudonymous IDs.
*Priority:* Must. *Status:* Approved. *Access:* own data. *Source:* privacy, data retention.
- Acceptance: Given a verified candidate export request, when the export completes, then it contains their profile, applications, messages, consent, and audit data in a documented format.
- Acceptance: Given an application still open, when deletion is requested, then new processing stops and the candidate sees which minimum records remain until the application closes and the 30-day period ends.

**FR-JOB-6092 — Retention.** Rejected and withdrawn applications, their CV access, and messages must be deleted 12 months after the application ends unless a documented legal hold or separate, expiring candidate consent for a talent pool applies; closed postings are kept for 24 months for audit.
*Priority:* Must. *Status:* Approved (retention periods pending counsel). *Access:* system. *Source:* charter regulatory review.
- Acceptance: Given a rejected application reaches 12 months without a legal hold, when the retention job runs, then its CV copy and messages are deleted and the minimal record is anonymized.
- Acceptance: Given an active documented legal hold, when the retention date arrives, then only the held records are preserved and the hold's reason and review date remain auditable.

## 4. Product dependencies

| Needs | From | Interim until available |
| --- | --- | --- |
| Sign-in, one account, trust T1–T2 | Platform ID, TRUST (live) | None |
| Organizations and roles | FR-ORG-2501 | Jobs keeps employer membership in its own database, keyed by account ID |
| Business verification (T4) | FR-KYC organization verification | Operator verification (FR-JOB-6012) |
| Notifications | FR-NOTIF | Email through the mail relay (FR-JOB-6052) |
| Messaging | FR-MSG | Application-scoped threads in Jobs (FR-JOB-6051) |
| Certificates | Oxinov Edu certificates API | Certificates hidden until Edu issues them |
| Employer plans and billing | FR-PLAN, FR-PAY | Free during the first release |

## 5. Open decisions

- Pricing model (employer plans or per posting): free first release; decide before the second release.
- Retention periods and posting content rules: confirm with Nepal counsel before launch (charter regulatory review).
- Rights to Flo Softwares concepts: confirm in writing; Jobs is rebuilt on the Oxinov stack and copies no source code.
- Launch employers and candidate segment, and moderation staffing.

## 6. Build order

1. Foundation: database `oxinov_jobs` with row-level security, `jobs-api` and `jobs-web` services, sign-in, and employer and candidate profiles (6001–6004, 6011–6013).
2. Postings and search: 6021–6024, 6031–6034.
3. Applications and review: 6041–6044, with matching 6061–6063.
4. Messaging and notifications: 6051–6052.
5. Moderation, audit, and privacy: 6081–6083, 6091–6092.
6. Edu certificates (6071) when Edu issues certificates.

Each step ships through the normal pipeline behind the release gate in the [product record](../products/jobs/README.md). Build order does not authorize an unsafe partial launch: `jobs.oxinov.com` remains private until steps 1–5 pass their acceptance tests, counsel confirms the content and retention rules, moderation staffing is ready, and the owner approves publication. Edu certificates may remain hidden until step 6 is available.
