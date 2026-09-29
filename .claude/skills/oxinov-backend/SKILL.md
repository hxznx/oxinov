---
name: oxinov-backend
description: Build or change an Oxinov NestJS API (edu-api, platform-api) - endpoints, services, guards, DTOs, configuration, and the shared server-kit. Use for any change under backend/ or packages/server-kit.
---

# Oxinov backend (NestJS APIs)

Rules: [API rules](../../../docs/14-ai-knowledge/api-rules.md), [coding rules](../../../docs/14-ai-knowledge/coding-rules.md), [database rules](../../../docs/14-ai-knowledge/database-rules.md). Binding: [AGENTS.md](../../../AGENTS.md) sections 4-6. Plan non-trivial, data, money, or security-sensitive features first with the oxinov-backend-architecture skill (domain, boundaries, integrity, concurrency, reliability).

## Where things are

| Service | Folder | Package | Local port |
| --- | --- | --- | --- |
| Edu API | `backend/products/edu-api` | `@oxinov/edu-api` | 4000 |
| Platform API | `backend/platform-api` | `@oxinov/platform-api` | 4200 |
| Shared server code | `packages/server-kit` | `@oxinov/server-kit` | - |

`backend/products/edu-worker`, `edu-chat`, `backend/workers`, and `backend/gateway` are placeholders. Do not build them without an approved milestone.

Inside an API, code is grouped by feature: `src/<feature>/<feature>.controller.ts`, `<feature>.service.ts`, `<feature>.dto.ts`, and unit tests beside them (`*.spec.ts`). Integration tests live in `test/*.e2e-spec.ts`. Cross-cutting code: `src/common/errors.ts` (error codes), `src/common/request.ts` (`AuthUser`, `TenantScope`), `src/tenancy/` (`TenantGuard`, `hasRole`), `src/database/database-context.service.ts` (`DatabaseContext`), `src/config/app-config.ts`.

## Steps for a new or changed endpoint

1. Find the requirement ID in the FRD (`docs/03-requirements/frd/edu-frd.md` or `platform-frd.md`). If none fits, use the oxinov-requirements skill first.
2. Read one neighbouring feature end to end (for example `src/notes/`) and copy its shape.
3. **DTO** (`<feature>.dto.ts`): `class-validator` decorators on every input field, `@nestjs/swagger` `@ApiProperty` for OpenAPI. Separate input and output DTOs.
4. **Controller**: route under `v1/tenants/:tenantId/...` for tenant data, `@UseGuards(TenantGuard)`, `@CurrentTenant()` and `@CurrentUser()`, `ParseUUIDPipe` on IDs, swagger response decorators, return `{ data }`. No business logic here.
5. **Service**: run every query inside `this.db` (`DatabaseContext`) so the tenant context is set for row-level security; check roles with `hasRole` and entitlements; throw `Errors.*` from `src/common/errors.ts`. Use `Errors.notFound` for other tenants' objects.
6. **Errors**: a new failure mode gets a new stable code in `src/common/errors.ts` and `docs/06-api/api-errors.md`.
7. **Schema change**: use the oxinov-database skill.
8. **Module**: register the controller and service in `src/app.module.ts`. The APIs use one application module, not a module per feature.
9. **Tests**: unit tests for pure rules; an integration test in `test/` for the allowed path and the denied paths (other tenant, lower role, no entitlement). See the oxinov-testing skill.
10. **Contract**: `pnpm --filter @oxinov/edu-api build` then `pnpm --filter @oxinov/edu-api openapi`.
11. **Docs**: FRD implementation status, current state if runtime behavior changed, changelog.

## Check

```bash
pnpm --filter @oxinov/edu-api typecheck
pnpm --filter @oxinov/edu-api lint
pnpm --filter @oxinov/edu-api test
pnpm --filter @oxinov/edu-api test:integration
```

Integration tests need PostgreSQL (`docker compose up -d postgres`) and `pnpm edu:migrate`. A `server-kit` change also needs `pnpm --filter @oxinov/server-kit test` and the checks of both APIs.

## Do not

- Put queries in controllers or HTTP types in services.
- Read roles or levels from the request body.
- Log request bodies, tokens, or personal data.
- Add a new service or container for a feature that fits in the existing API (YAGNI; memory is scarce).
