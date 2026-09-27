# Development roadmap: Oxinov Edu

**Scope:** Oxinov Edu delivery. Coordinate with the [company platform roadmap](../../11-planning/company-roadmap.md) and the [DevOps roadmap](../../10-devops/devops-roadmap.md); platform identity and entitlements must not duplicate Edu roles. **Updated:** 2026-09-26. These are phases, not promised dates; tasks and evidence are in the [backlog](../../11-planning/tasks.md), and what runs today is in [current state](../../04-architecture/current-state.md).

| Phase | Scope | Status (2026-09-26) |
| --- | --- | --- |
| 0. Foundation | Monorepo, migrations, CI with security scanning, OpenAPI, tenant identity, two-tenant isolation tests, security-event schema, metrics endpoints, production deployment with automatic rollback | **Done** (production on k3s, ADR-018) |
| 1. SaaS core | Learning spaces, join codes and members, catalogue, course authoring with review and publishing, recorded video and audio, books and resources | **Mostly done.** Open: space branding, plans, custom domains, email invitations |
| 2. Learning and assessment | Enrollment, lesson progress, notes, quizzes and timed mock exams, assignments with grading, results; then payments and certificates | **In progress.** Done: free enrollment, notes, quizzes, exams, assignments, results. Open: paid checkout, certificates, text-lesson progress, question-bank authoring API |
| 3. Engagement | Class stream and lesson Q&A (done), announcement emails and push, live chat, analytics for teachers and administrators | **Started** |
| 4. Mobile | React Native with Expo against the same API; Android internal testing, then store release (NFR-14) | Not started; the web app works in mobile browsers |
| 5. AI | Governed AI gateway and staff-only pilots after the AI Phase 0 gate (ADR-014) | Not started |
| 6. Launch readiness | Content rights, Playwright end-to-end, load, restore, security (penetration test; staff MFA, CloudTrail, and GuardDuty done), and accessibility testing; first school pilot; SES production access | **Next**: see [security roadmap](../../09-security/security-baseline.md#roadmap) and [testing](../../08-engineering/testing-strategy.md#next) |

Order of the next work: launch readiness items that block a first school (SES production access, end-to-end tests, restore test), then paid checkout and certificates, then mobile.
