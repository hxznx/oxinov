# Architecture rules

The architecture rules every change must keep, in short form. Read them before you add a folder, a service, a dependency, or a connection between two parts of the system.

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

Source: [AGENTS.md](../../AGENTS.md) sections 1 and 4, the [platform blueprint](../01-company/platform-blueprint.md), [platform architecture](../04-architecture/platform-architecture.md), and the [ADRs](../04-architecture/adr/README.md). What runs today is in [current state](../04-architecture/current-state.md).

## Layers

| Layer | Contains | Never contains |
| --- | --- | --- |
| Company website | `frontend/company-web`, static export on S3 and CloudFront | Sign-in, customer data |
| Platform control plane | `platform-api`, `platform-web`, `database/platform`, Keycloak | Product business logic |
| Product plane | `frontend/products/<slug>-web`, `backend/products/<slug>-api`, `database/products/<slug>`, `docs/02-products/<slug>` | Another product's code or database |
| Shared packages | `packages/*`: stable cross-product concerns | Imports from applications |

## Must

- Keep the one folder layout: `frontend/`, `backend/`, `database/`, `packages/`, `devops/`, `monitoring/`, `security/`, `docs/`, `prompts/`.
- Give every product the same shelves under one stable slug, per the [product plane template](../08-engineering/company-project-structure.md#product-plane-template). Edu is `edu`.
- Move data between products through APIs or events only.
- Call APIs from the server side of web apps. Browsers never hold access tokens and never reach a database.
- Start as a modular monolith per product. Extract a service only for a measured scaling, security, reliability, data, or ownership need.
- Prefer components that are already present (PostgreSQL, S3, SES, Traefik) over new infrastructure.
- Design every write for retries: idempotency keys, unique constraints instead of check-then-insert, and one-time processing of provider events.
- Take configuration from the environment and validate it at startup.
- Store time in UTC (`timestamptz`); store money as integer minor units with a currency.
- Make API and schema changes additive first; remove only after every caller has moved.
- Register every deployable service once in `services.yaml`.

## Never

- Scaffold a product before its release gate is approved (HR, Market, Services Market, Studio, JP, and Tech are not approved).
- Add a cache, queue, or broker without a measured need; when one is needed, SQS comes first (ADR-021).
- Add a runtime dependency without a reason in the change, or change the stack, cloud, identity, payments, or architecture without an ADR in the same change.
- Hard-code a list of services anywhere other than `services.yaml`.
- Pre-build a scale-out step (EKS, RDS, staging) before its trigger in the [DevOps roadmap](../10-devops/devops-roadmap.md).

## Limits to design within

- One EC2 `t3a.medium` node with 4 GiB of memory; the stack already uses about 3 GiB. Every new workload competes for memory.
- US$50 a month for all of AWS (NFR-18).
- No staging environment; delivery changes are rehearsed on a throwaway local k3s.

Skills: [oxinov-backend-architecture](../../.claude/skills/oxinov-backend-architecture/SKILL.md), [oxinov-frontend-architecture](../../.claude/skills/oxinov-frontend-architecture/SKILL.md), [oxinov-new-product](../../.claude/skills/oxinov-new-product/SKILL.md), [oxinov-platform-integration](../../.claude/skills/oxinov-platform-integration/SKILL.md), [oxinov-multi-tenancy](../../.claude/skills/oxinov-multi-tenancy/SKILL.md), [oxinov-mvc](../../.claude/skills/oxinov-mvc/SKILL.md), [oxinov-new-service](../../.claude/skills/oxinov-new-service/SKILL.md), [oxinov-shared-package](../../.claude/skills/oxinov-shared-package/SKILL.md), [oxinov-events-and-jobs](../../.claude/skills/oxinov-events-and-jobs/SKILL.md), [oxinov-scaling](../../.claude/skills/oxinov-scaling/SKILL.md), [oxinov-architecture-decision](../../.claude/skills/oxinov-architecture-decision/SKILL.md).
