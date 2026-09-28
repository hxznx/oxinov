# Implementation backlog

The company's open work items in priority order, with what counts as done, who owns each item, and the next step. What runs today is in [current state](../04-architecture/current-state.md); decisions that can change the order are in [risks and decisions](risks.md).

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-28

## How to use this list

- Split each item into small issues with requirement IDs (for example `FR-TENANT-1605`) before coding.
- Priority 0 blocks the first school; 1 comes next; 2 and 3 follow in order.
- An item moves to [Done](#done) only when current state or the [changelog](changelog.md) records it as verified in CI or production.

## Status values

| Status | Meaning |
| --- | --- |
| Open | Not started |
| Waiting | Started, but waiting on someone outside engineering |
| Partly done | Some of the acceptance evidence exists; the rest is listed in "Next step" |
| Built, off | Code is released, but the feature is switched off in production |

## Open, in priority order

| Priority | Task | Acceptance evidence | Owner | Status | Next step |
| --- | --- | --- | --- | --- | --- |
| 0 | SES production access | Sign-in code reaches a Gmail address that is not verified in SES | AWS review; Founder answers any follow-up | Waiting: requested 2026-09-28, review pending | Answer any AWS follow-up, then send a code to an unverified address |
| 0 | Remove or retarget the stale `.github/workflows/deploy.yml` preflight | Only live workflows remain | Engineering | Open (the file still exists) | Remove it, or retarget it to the production pipeline |
| 0 | Playwright end-to-end tests for sign-in, join, enrol, lesson, timed exam, assignment | Run in CI on every push | Engineering | Open | Write the first journey test and add it to CI |
| 0 | Quarterly restore test from the nightly dump | Restored database passes smoke checks; time recorded against NFR-05 | Engineering | Open | Run the first restore and record the time |
| 0 | Google sign-in in production | Google OAuth client created by the owner; flow in `configure-realm.sh` enabled; verified-email linking tested | Founder and engineering | Open | Founder creates the Google OAuth client |
| 0 | Legal review of Terms, Privacy, Acceptable Use, and product-role policies | Reviewed English versions at `oxinov.com/legal/*` (English is binding, ADR-020), with owner and review date | Founder | Open | Engage a reviewer for the four policy pages |
| 0 | Approve owners, launch markets, and payment providers | Decision record in [risks and decisions](risks.md) | Founder | Partly done: Khalti and eSewa selected for Oxinov's own courses (ADR-023) | Record product owners and launch markets |
| 1 | Paid checkout and verified payment processing (provider adapter and ledger) | End-to-end paid learner journey; webhook replay and idempotency tests | Engineering | Built, off: Khalti and eSewa checkout with replay-safe verification (changelog 2026-09-27); production starts with payments off | Owner enters merchant keys in Parameter Store; run one paid learner journey in production |
| 1 | Space branding, plans, custom domains, email invitations | Tests per FR | Engineering | Open | Split into issues by FR |
| 1 | Question-bank authoring API, result revisions, text-lesson progress | Tests per FR | Engineering | Partly done: text-lesson progress released (changelog 2026-09-28) | Question-bank authoring API and result revisions |
| 1 | Announcement emails and push notifications | Opt-in, retries, delivery status | Engineering | Open | Needs SES production access first |
| 1 | OpenTelemetry in `server-kit` and web apps; one dashboard and error-rate alert per product (ADR-019 step 5) | Trace ID across portal, API, and sign-in | Engineering | Open | Choose the hosted metrics backend within NFR-18 |
| 1 | Cost: Compute Savings Plan decision; cost-allocation tags ([cost optimization](../10-devops/cost-optimization.md)) | Owner decision recorded; tags visible in Cost Explorer | Founder, engineering | Open | Founder decides on the Savings Plan |
| 1 | Establish user research and the R&D operating system | Named owners; baseline tasks measured ([user-centred product standard](../12-research/user-centered-product-standard.md)) | Founder | Open | Name the research owners |
| 1 | Confirm Flo Softwares rights and rotate their leaked secrets | Signed rights confirmation; rotated credentials | Founder | Open | Request written rights from the contributors |
| 2 | Mobile app (Expo) for Edu | Signed internal `.aab`; mobile flow tests (NFR-14) | Engineering | Open | Start after priority 0 and 1 items |
| 2 | AI Phase 0 governance, then the governed AI gateway and two staff pilots (ADR-014) | Per the [AI roadmap](ai-roadmap.md) | Founder, engineering | Open | Founder appoints the AI roles |
| 2 | Live chat (`edu-chat`) and background worker (`edu-worker`) | When approved features need them (ADR-021) | Engineering | Open | Wait for an approved feature that needs them |
| 2 | Shared KYC (T3/T4), SMS verification (T2), messaging, and reviews primitives | Trust-level enforcement tests; audited reviewer workflow | Engineering | Open | Needs the KYC and SMS provider decisions in [risks and decisions](risks.md) |
| 2 | Staging and preview environments ([DevOps roadmap](../10-devops/devops-roadmap.md) Phase 4) | A bad commit is stopped before production | Engineering | Open | Starts when a second developer joins or the first school pays (ADR-021) |
| 2 | SIEM detections and incident routing ([SOC](../09-security/soc.md)) | Synthetic findings routed; three runbook exercises | Engineering | Open | Needs the SIEM hosting decision |
| 3 | Unified Oxinov HR after its release gate; Oxinov Market (Commodity Market) and Oxinov Services Market remain later candidates | Approved scope; journeys pass end to end; per-plane Helm release (ADR-019, ADR-025) | Founder, engineering | Open | Close the HR release gate |

## Done

Verified in CI or production.

| Area | Evidence |
| --- | --- |
| Company website `oxinov.com` | Live on S3 and CloudFront; accessibility, link, status, and SEO tests in CI; product and division pages; Search Console and Bing verified |
| Production platform | One k3s node in Mumbai via Terraform; every green `main` deploys automatically with rollback (ADR-018, NFR-17); budget alerts (NFR-18) |
| One Oxinov account | Keycloak at `id.oxinov.com` with email one-time codes through SES; bounce and complaint handling |
| Platform slice | Accounts, policy acceptance, product catalogue, entitlements, owner isolation (`platform-api`, `platform-web`) |
| Edu tenancy | Spaces, members, join codes, row-level security, two-tenant allowed and denied tests |
| Edu learning | Catalogue, authoring with review and publishing, video and audio lessons, resources, free enrollment, notes, quizzes, timed mock exams with autosave and auto-submit, assignments with grading, class stream and Q&A |
| Course completion and certificates | One certificate per learner and course, public verification at `/verify/{id}`, revocation by school administrators (FR-PLAYER-402, FR-CERT-601, FR-CERT-602); unit tests locally, integration suite in CI (changelog 2026-09-28) |
| Security baseline | Trivy gates, Dependabot, pinned digests, security-event schema, keyless access, network policies; CloudTrail and GuardDuty with email alerts (2026-09-26); staff MFA for Keycloak administrators (2026-09-27) |
