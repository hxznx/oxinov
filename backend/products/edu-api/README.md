# Oxinov Edu API service

NestJS REST/OpenAPI service. It owns authorization, validation, tenant context, business
transactions, and database access for request-driven operations. Requirements: `AGENTS.md`,
`docs/03-requirements/frd/edu-frd.md`, `docs/06-api/`.

## What exists (first backend slice)

| Area | Routes | Requirements |
| --- | --- | --- |
| Health | `GET /health/live`, `GET /health/ready`, `GET /metrics` (private network only) | NFR-07, NFR-12 |
| Workspaces | `GET /v1/tenants`, `POST /v1/tenants`, `GET /v1/tenants/{tenantId}` | FR-TENANT-1601, 1605 |
| Catalog | `GET/POST /v1/tenants/{tenantId}/courses`, `GET .../courses/{courseId}`, `GET .../courses/{courseId}/lessons/{lessonId}` | FR-CATALOG-301/302, FR-COURSE-201/204 |
| Enrollment | `POST .../courses/{courseId}/enrollments`, `GET .../me/enrollments` | FR-CATALOG-303 (free courses) |
| Exams | `GET .../courses/{courseId}/exams`, `POST .../exams/{examId}/attempts`, `GET .../exam-attempts/{id}`, `PUT .../exam-attempts/{id}/answers`, `POST .../exam-attempts/{id}/submit` | FR-ASSESS-501/502, FR-EXAM-1203/1204 |

Paid enrollment returns `PAYMENT_REQUIRED` until a supported payment-provider adapter and verified,
idempotent webhook fulfillment are implemented.
Interactive docs are at `http://localhost:4000/docs` when `DEPLOY_ENVIRONMENT` is `local` or `ci`.

## How tenant isolation works

1. `AuthGuard` verifies the bearer token through the configured OIDC issuer/JWKS (Keycloak is the
   platform default; local HS256 dev tokens work only outside production) and maps its subject to a
   `UserProfile`. Roles never come from the token.
2. `TenantGuard` requires an ACTIVE membership in `:tenantId`. Non-members get the same 404 as a
   missing workspace and a `tenant.cross_access.denied` security event.
3. `DatabaseContext.run()` opens a transaction as `oxinov_app` and sets `app.tenant_id` /
   `app.user_id` transaction-locally. PostgreSQL row-level security then filters every query,
   and composite foreign keys reject cross-tenant references. See `database/products/edu/policies/README.md`.

## Run locally

From the repository root, with Docker running:

```bash
cp .env.example .env                      # set passwords
docker compose up -d postgres
cp backend/products/edu-api/.env.example backend/products/edu-api/.env  # match the passwords above
pnpm install --frozen-lockfile
pnpm edu:migrate                          # owner role, applies database/products/edu/migrations
# once per database: let the request role log in (password must match DATABASE_URL)
#   docker compose exec postgres psql -U oxinov -d oxinov_edu \
#     -c "ALTER ROLE oxinov_app LOGIN PASSWORD 'change-me-local-app'"
pnpm edu:seed                             # two demo tenants with JLPT N5 content
pnpm edu:dev                              # http://localhost:4000
pnpm --filter @oxinov/edu-api dev:token -- "dev|learner-aiko"
```

## Tests

```bash
pnpm --filter @oxinov/edu-api test
pnpm --filter @oxinov/edu-api test:integration
pnpm --filter @oxinov/edu-api db:test-policies
```

Integration tests drop and recreate the schema, so the test database name must end in `_test`.

## Assistant skills

Coding assistants working here follow [oxinov-database-architecture](../../../.claude/skills/oxinov-database-architecture/SKILL.md), [oxinov-backend-architecture](../../../.claude/skills/oxinov-backend-architecture/SKILL.md), [oxinov-access-control](../../../.claude/skills/oxinov-access-control/SKILL.md), [oxinov-secure-input-output](../../../.claude/skills/oxinov-secure-input-output/SKILL.md), [oxinov-backend](../../../.claude/skills/oxinov-backend/SKILL.md), [oxinov-mvc](../../../.claude/skills/oxinov-mvc/SKILL.md), [oxinov-multi-tenancy](../../../.claude/skills/oxinov-multi-tenancy/SKILL.md), [oxinov-api-design](../../../.claude/skills/oxinov-api-design/SKILL.md), [oxinov-validation](../../../.claude/skills/oxinov-validation/SKILL.md), [oxinov-database](../../../.claude/skills/oxinov-database/SKILL.md), [oxinov-payments](../../../.claude/skills/oxinov-payments/SKILL.md), [oxinov-security](../../../.claude/skills/oxinov-security/SKILL.md), [oxinov-observability](../../../.claude/skills/oxinov-observability/SKILL.md), [oxinov-testing](../../../.claude/skills/oxinov-testing/SKILL.md). All rules and skills: [AI knowledge](../../../docs/14-ai-knowledge/README.md).
