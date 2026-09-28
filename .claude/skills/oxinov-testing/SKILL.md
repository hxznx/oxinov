---
name: oxinov-testing
description: Write and run Oxinov tests - Jest unit and PostgreSQL integration tests for the APIs, SQL row-level security policy tests, Node test runner tests for web apps and the static site, delivery script tests, and cross-tenant allowed and denied paths. Use when adding behavior or verifying a change.
---

# Oxinov testing

Source: [testing strategy](../../../docs/08-engineering/testing-strategy.md). Definition of done: [AGENTS.md](../../../AGENTS.md) section 11.

## What to test, and where

| Layer | Tool | Location | Run |
| --- | --- | --- | --- |
| API unit | Jest | `src/**/*.spec.ts` beside the code | `pnpm --filter @oxinov/edu-api test` |
| API integration | Jest + supertest, real PostgreSQL 18 and SeaweedFS for media | `backend/products/edu-api/test/*.e2e-spec.ts` | `pnpm --filter @oxinov/edu-api test:integration` |
| Row-level security | SQL as the request role | `database/products/edu/policies/tenant_isolation_test.sql` | `pnpm --filter @oxinov/edu-api db:test-policies` |
| Web helpers | Node test runner | `frontend/products/edu-web/src/lib/*.test.ts` | `pnpm --filter @oxinov/edu-web test` |
| Static website | Node test runner on the export | `frontend/company-web/tests/*.test.mjs` | `pnpm --filter @oxinov/company-web build` then `test` |
| Shared packages | Jest or Node test runner | `packages/<name>/src` | `pnpm --filter @oxinov/<name> test` |
| Delivery | bash tests, ShellCheck, `helm lint`, `kubeconform` | `devops/scripts/*.test.sh` | `bash devops/scripts/check-delivery.sh` |
| Repository tools | Python `unittest` | `scripts/test_*.py` | `cd scripts && python -m unittest test_project_catalog test_service_catalog test_new_service test_quarantine` |

The platform API has the same unit, integration, and policy scripts under `@oxinov/platform-api`.

## Steps for a behavior change

1. Name the requirement ID in the test name or a comment.
2. Put pure rules (grading, pricing, access) in a function and unit test its edge cases.
3. Add an integration test for the **allowed path** and every **denied path**: another tenant (expect 404), a lower role (403), no entitlement, wrong trust level, invalid input (400 `VALIDATION_FAILED`).
4. For a new table, add row-level security tests to the policy file.
5. Use the helpers in `test/helpers.ts` and synthetic data only; never real personal data.
6. Run the checks for every package you touched and its consumers.

## Running integration tests locally

```bash
docker compose up -d postgres
pnpm edu:migrate
pnpm --filter @oxinov/edu-api test:integration
```

Media tests also need local object storage (see [developer setup](../../../docs/10-devops/dev-setup.md)); without it they are skipped.

## Not in place yet

Playwright end-to-end tests, axe accessibility checks, OpenAPI compatibility checks, and k6 load tests are planned (testing strategy, "Next"). Do not claim coverage from them.
