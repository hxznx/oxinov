---
name: oxinov-mvc
description: Decide which layer code belongs in across Oxinov apps - the MVC-style split of controller, service, data access, and view in NestJS APIs and Next.js web apps. Use when designing a feature, reviewing structure, or when logic seems to be in the wrong place.
---

# Oxinov layering (MVC in practice)

Oxinov does not use a classic MVC framework. The same separation is applied across the API and the web app. Rules: [architecture rules](../../../docs/14-ai-knowledge/architecture-rules.md).

## How MVC maps onto the code

| MVC role | API (NestJS, `backend/`) | Web app (Next.js, `frontend/`) |
| --- | --- | --- |
| Model: data and rules | `<feature>.service.ts` (business rules), Prisma models in `database/<plane>/prisma/schema.prisma`, row-level security policies in migrations | Types from the API contract; no business rules |
| View: what the user sees | JSON response shaped by output DTOs (`<feature>.dto.ts`) | Server and client components under `src/app/` and `src/components/` |
| Controller: input and routing | `<feature>.controller.ts`: route, guards, validated DTOs, calls one service method | Server actions (`src/app/*-actions.ts`) and route handlers: read the form, call the API, redirect or revalidate |

## Where each kind of code goes

| Code | Layer |
| --- | --- |
| Input shape and validation | DTO (API) and the form (web); the API is the authority |
| "Is this person allowed?" | API service (roles, entitlements, trust level) plus row-level security; never only in the web app |
| Business rule (grading, pricing, completion) | API service, or a pure function beside it (for example `exams/grading.ts`) with a unit test |
| Database query | API service, inside `DatabaseContext` |
| Calling another product | Through its API or events; never its database |
| Formatting for display | Web components |
| Tokens and sessions | `@oxinov/web-auth` on the web server; never the browser |

## Checks when reviewing

1. The controller has no `if` about business rules and no database access.
2. The service has no HTTP objects (`Request`, `Response`) and no presentation text other than error messages.
3. Pure rules are separate functions with unit tests.
4. The web app does not repeat an authorization rule as its only protection.
5. Nothing in `packages/` imports an application.

If a feature needs a new layer (a queue, a worker, a new service), stop and use the oxinov-new-service skill; it needs a measured reason.
