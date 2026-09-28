---
name: oxinov-api-design
description: Design or change an Oxinov HTTP API contract - routes, request and response shapes, error codes, versioning, idempotency, and the OpenAPI description. Use before adding an endpoint or changing an existing one's inputs or outputs.
---

# Oxinov API design

Rules: [API rules](../../../docs/14-ai-knowledge/api-rules.md). Sources: [API specification](../../../docs/06-api/api-spec.md), [API errors](../../../docs/06-api/api-errors.md), [API versioning](../../../docs/06-api/api-versioning.md), [API authentication](../../../docs/06-api/api-auth.md).

## Steps

1. **Name the requirement** (FR ID) the contract serves.
2. **Route**: `/v1/...`; tenant data under `/v1/tenants/:tenantId/<collection>/:id`. Plural nouns, no verbs, except for actions that are not CRUD (use a sub-resource such as `/attempts/:id/submit`).
3. **Method and status**: `GET` 200, `POST` create 201, `PATCH` partial update 200, `DELETE` 204. Retry-safe `POST`s from external triggers take an idempotency key.
4. **Shapes**: input DTO and output DTO classes; responses wrap in `{ data }`. IDs are UUIDs; time is ISO 8601 UTC; money is integer minor units plus a currency code.
5. **Errors**: pick existing codes from `src/common/errors.ts`; add a new code only for a failure the client must handle differently, and document it in `docs/06-api/api-errors.md`. Other tenants' resources answer `RESOURCE_NOT_FOUND`.
6. **Authorization**: write down who may call it (role, entitlement, trust level, policy) and test each denial.
7. **Compatibility**: adding optional fields and new routes is safe. Removing or renaming a field, route, or error code is breaking: add the new form, move every caller, then remove the old one in a later change.
8. **OpenAPI**: swagger decorators on the controller and DTOs, then `pnpm --filter @oxinov/edu-api build` and `pnpm --filter @oxinov/edu-api openapi`. The interactive description is at `http://localhost:4000/docs` locally.
9. **Callers**: update the web app's server actions in the same change.

## Review checklist

- [ ] FR ID cited in the controller comment
- [ ] Every input validated; unknown fields rejected
- [ ] Denied paths return the documented code, and cross-tenant returns 404
- [ ] No internal detail (SQL, stack, other tenants' IDs) in any response
- [ ] OpenAPI regenerated; breaking changes staged over several releases
