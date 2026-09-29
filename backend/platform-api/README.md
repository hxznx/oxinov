# Oxinov platform API (`backend/platform-api`)

Control plane for the one Oxinov account at `api.oxinov.com` (ADR-008, ADR-011). It owns accounts, policy acceptance, the product catalogue, and entitlements. Products never read its database; they call this API.

## Endpoints (v1)

| Method and path | Access | Requirement | Purpose |
| --- | --- | --- | --- |
| `GET /v1/products` | Public | FR-PORTAL-3102 | Launched products for the app launcher |
| `GET /v1/policies/current` | Public | FR-POLICY-2401 | Current policy versions |
| `GET /v1/me` | Signed in | FR-ID-2205, FR-ID-2206 | The account; created as `PENDING_WELCOME` on first sign-in |
| `POST /v1/me/welcome` | Signed in, verified email | FR-ID-2205, FR-PLAN-2602 | Country, age confirmation, and acceptance of current sign-up policies; activates the account and grants member access |
| `POST /v1/me/policy-acceptances` | Signed in | FR-POLICY-2404 | Accept new material policy versions |
| `GET /v1/me/entitlements` | Active account, current policies | FR-PLAN-2603 | Active entitlement keys, such as `edu.member` |
| `GET /health/live`, `/health/ready`, `/metrics` | Private network | NFR-12 | Probes and Prometheus metrics |

Errors use the shared envelope. Platform-specific codes: `POLICY_ACCEPTANCE_REQUIRED` (403, `details.policies`), `POLICY_VERSION_OUTDATED` (409), `ACCOUNT_SUSPENDED` (403), `EMAIL_NOT_VERIFIED` (403).

## Data protection

The API connects as `oxinov_platform_app`, which cannot bypass row-level security. A person sees only their own account, acceptances, entitlements, and audit history. Acceptances and audit history are append-only, catalogues are read-only, and a request can grant only free member access, to itself, for launched products (`database/platform/migrations/20260924100200_owner_isolation`).

## Local development

```bash
cp backend/platform-api/.env.example backend/platform-api/.env   # set local passwords
pnpm --filter @oxinov/server-kit build
pnpm --filter @oxinov/platform-api prisma:generate
pnpm --filter @oxinov/platform-api db:migrate
pnpm --filter @oxinov/platform-api db:seed
pnpm --filter @oxinov/platform-api db:test-policies
pnpm --filter @oxinov/platform-api test:integration   # needs TEST_DATABASE_URL / TEST_MIGRATION_DATABASE_URL on a *_test database
```

Tokens come from `id.oxinov.com` (Keycloak, ADR-016). Tests sign their own RS256 tokens against a local key set.

## Assistant skills

Coding assistants working here follow [oxinov-keycloak](../../.claude/skills/oxinov-keycloak/SKILL.md), [oxinov-database-architecture](../../.claude/skills/oxinov-database-architecture/SKILL.md), [oxinov-backend-architecture](../../.claude/skills/oxinov-backend-architecture/SKILL.md), [oxinov-access-control](../../.claude/skills/oxinov-access-control/SKILL.md), [oxinov-secure-input-output](../../.claude/skills/oxinov-secure-input-output/SKILL.md), [oxinov-backend](../../.claude/skills/oxinov-backend/SKILL.md), [oxinov-platform-integration](../../.claude/skills/oxinov-platform-integration/SKILL.md), [oxinov-mvc](../../.claude/skills/oxinov-mvc/SKILL.md), [oxinov-api-design](../../.claude/skills/oxinov-api-design/SKILL.md), [oxinov-validation](../../.claude/skills/oxinov-validation/SKILL.md), [oxinov-database](../../.claude/skills/oxinov-database/SKILL.md), [oxinov-payments](../../.claude/skills/oxinov-payments/SKILL.md), [oxinov-security](../../.claude/skills/oxinov-security/SKILL.md), [oxinov-testing](../../.claude/skills/oxinov-testing/SKILL.md). All rules and skills: [AI knowledge](../../docs/14-ai-knowledge/README.md).
