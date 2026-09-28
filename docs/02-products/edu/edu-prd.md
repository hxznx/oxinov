# Oxinov Edu product requirements

The product requirements document (PRD) for Oxinov Edu: who uses it, which capabilities it offers, and how much of each is built. Product, design, and engineering read it before the detailed [FRD](../../03-requirements/frd/edu-frd.md).

**Status:** Draft · **Owner:** Edu product owner · **Last reviewed:** 2026-09-28

This PRD is a draft for product review. Oxinov Edu is the first product on the [Oxinov company platform](../../01-company/platform-blueprint.md). Sources: the [Edu brief](edu-brief.md) and the [FRD](../../03-requirements/frd/edu-frd.md). The FRD's implementation table and [current state](../../04-architecture/current-state.md) own what is built.

## Personas and jobs

| Persona | Primary job |
| --- | --- |
| Tenant owner | Create, brand, subscribe to, and govern an Edu workspace |
| Tenant administrator | Manage programs, instructors, students, exams, and finances |
| Instructor | Publish recorded courses, assignments, and practice tests; support learners |
| Learner | Find a course, buy access, study, chat, submit work, and see results |
| Platform operator | Operate tenants, plans, releases, and support controls |

## Product capabilities

The state column summarizes the FRD implementation table (2026-09-28). "Live" means built and running at `edu.oxinov.com`.

| # | Capability | State today |
| --- | --- | --- |
| 1 | Self-service tenant creation from a verified email account, membership-based workspace selection, and safe branding customization | Partly live: spaces, roles, join codes, and workspace selection are live; branding, plans, custom domains, and email invitations are open |
| 2 | Courses for JLPT N5–N1, current SSW fields, the named languages, and configurable IT pathways | Authoring tools are live; the course material itself is separate content work |
| 3 | Recorded video and audio, multilingual lessons, chapter practice, timed mock exams, assignments, results, and certificates | Mostly live: video and audio lessons with transcripts, quizzes and timed mock exams, assignments, results, and certificates with public verification. The FRD records which requirements are complete |
| 4 | Student chat, support, analytics, administration, tenant billing, course payments, and instructor payouts | Partly built: class stream and lesson Q&A are live; one-time purchase of Oxinov's own NPR courses with Khalti or eSewa is built but production runs in sandbox mode until live merchant keys exist (ADR-023); live chat, dashboards, tenant billing, and payouts are planned |
| 5 | Web plus Android and iOS parity, with Google Play release readiness | Web is live and works in mobile browsers; native apps are planned |
| 6 | AI prompts that draft configuration and content for human review, within tenant permissions | Planned |

## Scope and release sequencing

- All numbered FRD requirements are target scope.
- The [roadmap](edu-roadmap.md) proposes staged delivery. It does not remove target scope.
- Live classes and offline downloads are not yet specified.
- Actual course material and official-exam licensing need separate content work.

## Acceptance

Use the [acceptance journeys](edu-acceptance-criteria.md) and the [NFR](../../03-requirements/nfr.md). Open product decisions are listed in [risks and open decisions](../../11-planning/risks.md).
