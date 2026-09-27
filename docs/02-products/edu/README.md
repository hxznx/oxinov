# Oxinov Edu product record

The front page for everything about Oxinov Edu. Files stay on their subject shelves; this page links them.
Structure follows the [company library standard](../../08-engineering/company-library-standard.md).

## Identity and ownership

| Field | Value |
| --- | --- |
| Display name | Oxinov Edu |
| Technical slug | `edu` everywhere (ADR-027); the production database, token audience, and image repository keep `lms` until the [cutover](../../10-devops/runbooks/edu-rename-cutover.md) |
| Kind | Software: multi-tenant learning platform (web now, mobile planned) |
| Company pillar | Education ([platform blueprint](../../01-company/platform-blueprint.md)) |
| Product owner | Unassigned |
| Engineering and operations owners | Unassigned |
| Lifecycle | Live at `https://edu.oxinov.com` on the starter k3s server (ADR-018); SES production access pending |
| Last reviewed / next review trigger | 2026-09-26 / next product release or owner change |
| Approval | Existing approved FRD (see the [product register](../README.md)) |

## Product documents

| Document | Purpose |
| --- | --- |
| [Brief](edu-brief.md) | Vision, problem, customers and first release |
| [PRD](edu-prd.md) | Product requirements and priorities |
| [FRD](../../03-requirements/frd/edu-frd.md) | Functional requirements (FR IDs 101–1799) |
| [NFR](../../03-requirements/nfr.md) | Company-wide non-functional requirements Edu must meet |
| [Acceptance criteria](edu-acceptance-criteria.md) and [roadmap](edu-roadmap.md) | How releases are proven and ordered |
| [Architecture](edu-architecture.md) and [tech stack](edu-tech-stack.md) | Edu technical design |
| [User flows](edu-user-flows.md) and [UI and UX](edu-ui-ux.md) | Journeys and interface rules |
| [ERD](edu-erd.md) | Data model |
| [Changelog](../../11-planning/changelog.md) | Release history |

## Canonical locations

| Artifact | Path | Status |
| --- | --- | --- |
| Web client | [frontend/products/edu-web](../../../frontend/products/edu-web/README.md) | Implemented, deployed |
| API | [backend/products/edu-api](../../../backend/products/edu-api/README.md) | Implemented, deployed |
| Worker | [backend/products/edu-worker](../../../backend/products/edu-worker/README.md) | Planned |
| Realtime chat | [backend/products/edu-chat](../../../backend/products/edu-chat/README.md) | Planned |
| Mobile client | [frontend/mobile](../../../frontend/mobile/README.md) (`frontend/mobile/edu/` when approved) | Planned |
| Database | [database/products/edu](../../../database/products/edu/README.md) | Implemented |
| API contract | [packages/contracts](../../../packages/contracts/README.md) | Scaffold |
| Deployment and monitoring | [Production runbook](../../../devops/kubernetes/README.md), [observability](../../10-devops/observability.md) | Live; dashboards per product planned (ADR-019) |
| Tests and release evidence | CI `api`, `edu-web`, and `edu-api-image` jobs, [changelog](../../11-planning/changelog.md) | Verified per release |
