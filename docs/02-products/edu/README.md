# Oxinov Edu product record

The front page for Oxinov Edu: who owns it, what state it is in, and where every document and code folder lives. Start here before any Edu task; the documents themselves stay on their subject shelves, and this page links them.

**Status:** Current · **Owner:** Edu product owner · **Last reviewed:** 2026-09-28

The structure follows the [company library standard](../../08-engineering/company-library-standard.md). What runs today is owned by [current state](../../04-architecture/current-state.md); required behavior is owned by the [Edu FRD](../../03-requirements/frd/edu-frd.md).

## Identity and ownership

| Field | Value |
| --- | --- |
| Display name | Oxinov Edu (short: Edu) |
| Technical slug | `edu` everywhere (ADR-027). Three production identifiers keep `lms` until the [cutover](../../10-devops/runbooks/edu-rename-cutover.md): the database `oxinov_lms`, the token audience `oxinov-lms-api`, and the service key and image `lms-api` / `oxinov/lms-api` |
| Kind | Software: multi-tenant learning platform (web now, mobile planned) |
| Company pillar | Education ([platform blueprint](../../01-company/platform-blueprint.md)) |
| Product owner | Unassigned |
| Engineering and operations owners | Unassigned |
| Lifecycle | Live at `https://edu.oxinov.com` on the starter k3s server (ADR-018); Amazon SES production access pending |
| Last reviewed / next review trigger | 2026-09-28 / next product release or owner change |
| Approval | Existing approved FRD (see the [product register](../README.md)) |

## Product documents

| Document | Kind | What it covers |
| --- | --- | --- |
| [Brief](edu-brief.md) | Explanation | Vision, problem, customers, and boundaries |
| [PRD](edu-prd.md) | Explanation | Personas, capabilities, and scope (product requirements document) |
| [FRD](../../03-requirements/frd/edu-frd.md) | Reference | Functional requirements (FR IDs 101–1799) and the implementation status table |
| [NFR](../../03-requirements/nfr.md) | Reference | Company-wide non-functional requirements Edu must meet |
| [Acceptance criteria](edu-acceptance-criteria.md) | Reference | End-to-end journeys that prove a release |
| [Roadmap](edu-roadmap.md) | Explanation | Delivery phases and their status |
| [Architecture](edu-architecture.md) | Explanation | How Edu runs today and at scale |
| [Tech stack](edu-tech-stack.md) | Reference | Technology per layer, today and next |
| [User flows](edu-user-flows.md) | Explanation | Main journeys and how much of each is built |
| [UI and UX](edu-ui-ux.md) | Explanation | Interface rules |
| [ERD](edu-erd.md) | Reference | Logical data model (entity relationship diagram) |
| [Changelog](../../11-planning/changelog.md) | Record | Release history |

## Canonical locations

| Artifact | Path | State |
| --- | --- | --- |
| Web client | [frontend/products/edu-web](../../../frontend/products/edu-web/README.md) | Live |
| API | [backend/products/edu-api](../../../backend/products/edu-api/README.md) | Live |
| Database | [database/products/edu](../../../database/products/edu/README.md) | Live (production database `oxinov_lms`) |
| Worker | [backend/products/edu-worker](../../../backend/products/edu-worker/README.md) | Planned |
| Realtime chat | [backend/products/edu-chat](../../../backend/products/edu-chat/README.md) | Planned |
| Mobile client | [frontend/mobile](../../../frontend/mobile/README.md) (`frontend/mobile/edu/` when approved) | Planned |
| API contract | [packages/contracts](../../../packages/contracts/README.md) | Scaffold |
| Deployment and monitoring | [Production runbook](../../../devops/kubernetes/README.md), [observability](../../10-devops/observability.md) | Live; dashboards per product planned (ADR-019) |
| Tests and release evidence | CI jobs `api`, `edu-web`, and `edu-api-image`; [changelog](../../11-planning/changelog.md) | Verified per release |

## Assistant skills

Coding assistants working here follow [oxinov-database-architecture](../../../.claude/skills/oxinov-database-architecture/SKILL.md), [oxinov-backend-architecture](../../../.claude/skills/oxinov-backend-architecture/SKILL.md), [oxinov-frontend-architecture](../../../.claude/skills/oxinov-frontend-architecture/SKILL.md), [oxinov-backend](../../../.claude/skills/oxinov-backend/SKILL.md), [oxinov-frontend](../../../.claude/skills/oxinov-frontend/SKILL.md), [oxinov-mobile](../../../.claude/skills/oxinov-mobile/SKILL.md), [oxinov-database](../../../.claude/skills/oxinov-database/SKILL.md), [oxinov-multi-tenancy](../../../.claude/skills/oxinov-multi-tenancy/SKILL.md), [oxinov-payments](../../../.claude/skills/oxinov-payments/SKILL.md), [oxinov-api-design](../../../.claude/skills/oxinov-api-design/SKILL.md), [oxinov-testing](../../../.claude/skills/oxinov-testing/SKILL.md), [oxinov-requirements](../../../.claude/skills/oxinov-requirements/SKILL.md). All rules and skills: [AI knowledge](../../14-ai-knowledge/README.md).
