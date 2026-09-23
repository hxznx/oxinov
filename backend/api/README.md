# API service

NestJS REST/OpenAPI service. It owns authorization, validation, tenant context, business
transactions, and database access for request-driven operations. Requirements: `AGENTS.md`,
`docs/02-FRD.md`, `docs/api/`.

## What exists (first backend slice)

| Area | Routes | Requirements |
| --- | --- | --- |
| Health | `GET /health/live`, `GET /health/ready`, `GET /metrics` (private network only) | NFR-07, NFR-12 |
| Workspaces | `GET /v1/tenants`, `POST /v1/tenants`, `GET /v1/tenants/{tenantId}` | FR-TENANT-1601, 1605 |
| Catalog | `GET/POST /v1/tenants/{tenantId}/courses`, `GET .../courses/{courseId}`, `GET .../courses/{courseId}/lessons/{lessonId}` | FR-CATALOG-301/302, FR-COURSE-201/204 |
| Enrollment | `POST .../courses/{courseId}/enrollments`, `GET .../me/enrollments` | FR-CATALOG-303 (free courses) |
| Exams | `GET .../courses/{courseId}/exams`, `POST .../exams/{examId}/attempts`, `GET .../exam-attempts/{id}`, `PUT .../exam-attempts/{id}/answers`, `POST .../exam-attempts/{id}/submit` | FR-ASSESS-501/502, FR-EXAM-1203/1204 |

Paid enrollment returns `PAYMENT_REQUIRED` until Stripe checkout and webhook fulfillment are built.
Interactive docs are at `http://localhost:4000/docs` when `DEPLOY_ENVIRONMENT` is `local` or `ci`.

## How tenant isolation works

1. `AuthGuard` verifies the bearer token (Clerk JWKS in production; local HS256 dev tokens only
   outside production) and maps its subject to a `UserProfile`. Roles never come from the token.
2. `TenantGuard` requires an ACTIVE membership in `:tenantId`. Non-members get the same 404 as a
   missing workspace and a `tenant.cross_access.denied` security event.
3. `DatabaseContext.run()` opens a transaction as `oxinov_app` and sets `app.tenant_id` /
   `app.user_id` transaction-locally. PostgreSQL row-level security then filters every query,
   and composite foreign keys reject cross-tenant references. See `database/policies/README.md`.

## Run locally

From the repository root, with Docker running:

```bash
cp .env.example .env                      # set passwords
docker compose up -d postgres
cd backend/api
cp .env.example .env                      # match the passwords above
npm install
npm run db:migrate                        # owner role, applies database/migrations
# once per database: let the request role log in (password must match DATABASE_URL)
#   docker compose exec postgres psql -U oxinov -d oxinov_lms \
#     -c "ALTER ROLE oxinov_app LOGIN PASSWORD 'change-me-local-app'"
npm run db:seed                           # two demo tenants with JLPT N5 content
npm run dev                               # http://localhost:4000
npm run dev:token -- "dev|learner-aiko"   # prints a local bearer token
```

## Tests

```bash
npm test                    # unit tests (grading, config, security-event schema)
npm run test:integration    # real PostgreSQL; needs TEST_DATABASE_URL and TEST_MIGRATION_DATABASE_URL
npm run db:test-policies    # SQL-level RLS checks as oxinov_app
```

Integration tests drop and recreate the schema, so the test database name must end in `_test`.
