# Implementation backlog

**Updated:** 2026-09-26. Split each item into small issues with FR IDs before coding. Product decisions in [RISKS.md](RISKS.md) may change ordering. What runs today: [current state](../architecture/CURRENT-STATE.md).

## Done (verified in CI or production)

| Area | Evidence |
| --- | --- |
| Company website `oxinov.com` | Live on S3 and CloudFront; accessibility, link, status, and SEO tests in CI; product and division pages; Search Console and Bing verified |
| Production platform | One k3s node in Mumbai via Terraform; every green `main` deploys automatically with rollback (ADR-018, NFR-17); budget alerts (NFR-18) |
| One Oxinov account | Keycloak at `id.oxinov.com` with email one-time codes through SES; bounce and complaint handling |
| Platform slice | Accounts, policy acceptance, product catalogue, entitlements, owner isolation (`platform-api`, `platform-web`) |
| Edu tenancy | Spaces, members, join codes, row-level security, two-tenant allowed and denied tests |
| Edu learning | Catalogue, authoring with review and publishing, video and audio lessons, resources, free enrollment, notes, quizzes, timed mock exams with autosave and auto-submit, assignments with grading, class stream and Q&A |
| Security baseline | Trivy gates, Dependabot, pinned digests, security-event schema, keyless access, network policies; CloudTrail and GuardDuty with email alerts (2026-09-26) |

## Open, in priority order

| Priority | Task | Acceptance evidence | Owner |
| --- | --- | --- | --- |
| 0 | Request SES production access | Sign-in code reaches an address that is not verified in SES | Founder |
| 0 | Staff MFA (TOTP) for Keycloak administrators and operators | Admin sign-in requires a second factor; tested in rehearsal | Engineering |
| 0 | Remove or retarget the stale `.github/workflows/deploy.yml` preflight | Only live workflows remain | Engineering |
| 0 | Playwright end-to-end tests for sign-in, join, enrol, lesson, timed exam, assignment | Run in CI on every push | Engineering |
| 0 | Quarterly restore test from the nightly dump | Restored database passes smoke checks; time recorded against NFR-05 | Engineering |
| 0 | Google sign-in in production | Google OAuth client created by the owner; flow in `configure-realm.sh` enabled; verified-email linking tested | Founder and engineering |
| 0 | Legal review of Terms, Privacy, Acceptable Use, and product-role policies | Reviewed English versions at `oxinov.com/legal/*` (English is binding, ADR-020), with owner and review date | Founder |
| 0 | Approve owners, launch markets, and payment providers | Decision record in [RISKS.md](RISKS.md) | Founder |
| 1 | Paid checkout and verified payment processing (provider adapter and ledger) | End-to-end paid learner journey; webhook replay and idempotency tests | Engineering |
| 1 | Certificates | Issue and public verification; one per learner and course | Engineering |
| 1 | Space branding, plans, custom domains, email invitations | Tests per FR | Engineering |
| 1 | Question-bank authoring API, result revisions, text-lesson progress | Tests per FR | Engineering |
| 1 | Announcement emails and push notifications | Opt-in, retries, delivery status | Engineering |
| 1 | OpenTelemetry in `server-kit` and web apps; one dashboard and error-rate alert per product (ADR-019 step 5) | Trace ID across portal, API, and sign-in | Engineering |
| 1 | Cost: Compute Savings Plan decision; cost-allocation tags ([cost](../devops/COST-OPTIMIZATION.md)) | Owner decision recorded; tags visible in Cost Explorer | Founder, engineering |
| 1 | Establish user research and the R&D operating system | Named owners; baseline tasks measured ([standard](../research/USER-CENTERED-PRODUCT-STANDARD.md)) | Founder |
| 1 | Confirm Flo Softwares rights and rotate their leaked secrets | Signed rights confirmation; rotated credentials | Founder |
| 2 | Mobile app (Expo) for Edu | Signed internal `.aab`; mobile flow tests (NFR-14) | Engineering |
| 2 | AI Phase 0 governance, then the governed AI gateway and two staff pilots (ADR-014) | Per the [AI roadmap](AI-IMPLEMENTATION-ROADMAP.md) | Founder, engineering |
| 2 | Live chat (`lms-chat`) and background worker (`lms-worker`) | When approved features need them (ADR-021) | Engineering |
| 2 | Shared KYC (T3/T4), SMS verification (T2), messaging, and reviews primitives | Trust-level enforcement tests; audited reviewer workflow | Engineering |
| 2 | Staging and preview environments ([DevOps roadmap](../devops/ROADMAP.md) Phase 4) | A bad commit is stopped before production | Engineering |
| 2 | SIEM detections and incident routing ([SOC](../security/SOC.md)) | Synthetic findings routed; three runbook exercises | Engineering |
| 3 | Oxinov Commodity Market, Jobs, and Services Market, each after its release gate | Approved charter; journeys pass end to end; per-plane Helm release (ADR-019) | Founder, engineering |
