# API rules

The rules for every HTTP API (NestJS with `@oxinov/server-kit`), in short form. Read them before you add or change an endpoint.

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

Source: [AGENTS.md](../../AGENTS.md) sections 4.2 and 6.1, [API specification](../06-api/api-spec.md), [API errors](../06-api/api-errors.md), [API versioning](../06-api/api-versioning.md), and [API authentication](../06-api/api-auth.md).

## Must

- Version every route under `/v1`. Scope tenant data under `v1/tenants/:tenantId/...`.
- Validate every input with DTO classes (`class-validator`) behind the global `ValidationPipe` (whitelist and forbid non-whitelisted). Parse IDs with `ParseUUIDPipe`.
- Authorize on the server for every protected action: token audience, tenant membership, role, entitlement, trust level (T0–T4), and policy acceptance. Ignore roles or levels sent by the client.
- Answer "not found" (`RESOURCE_NOT_FOUND`) for a resource in another tenant, so IDs are not disclosed.
- Return errors in the shared envelope with a stable `code` from [API errors](../06-api/api-errors.md). Add codes deliberately; renaming one is a breaking change.
- Wrap single results as `{ data: ... }`, as the existing controllers do.
- Accept an idempotency key on externally triggered writes, and process each provider event once.
- Expose `/health/live` and `/health/ready`, and shut down gracefully on SIGTERM.
- Update the OpenAPI description with every contract change (`pnpm --filter @oxinov/edu-api openapi`) and annotate controllers with `@nestjs/swagger` decorators.

## Never

- Leak stack traces, SQL, or internal details in a response.
- Grant access, an order, or a subscription from a browser redirect; verify provider results server-side.
- Remove or rename a field, route, or code before every caller has moved.
- Give an API a public host; APIs sit behind their web apps.

Skills: [oxinov-backend-architecture](../../.claude/skills/oxinov-backend-architecture/SKILL.md), [oxinov-api-gateway](../../.claude/skills/oxinov-api-gateway/SKILL.md), [oxinov-api-design](../../.claude/skills/oxinov-api-design/SKILL.md), [oxinov-backend](../../.claude/skills/oxinov-backend/SKILL.md), [oxinov-validation](../../.claude/skills/oxinov-validation/SKILL.md).
