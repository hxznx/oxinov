# Oxinov platform API (`backend/platform-api`)

Control plane for the one Oxinov account at `api.oxinov.com` (ADR-008, ADR-011). It owns accounts, policy acceptance, the product catalogue, and entitlements. Products never read its database; they call this API.

## Endpoints (v1)

| Method and path | Access | Requirement | Purpose |
| --- | --- | --- | --- |
| `GET /v1/products` | Public | FR-PORTAL-3102 | Launched products for the app launcher |
| `GET /v1/policies/current` | Public | FR-POLICY-2401 | Current policy versions |
| `GET /v1/me` | Signed in | FR-ID-2205, FR-ID-2206 | The account; created as `PENDING_WELCOME` on first sign-in |
| `POST /v1/me/welcome` | Signed in, verified email | FR-ID-2205, FR-PLAN-2602, FR-NOTIF-2903 | Country, age confirmation, and acceptance of current sign-up policies; activates the account, grants member access, and sends the welcome email once |
| `POST /v1/me/policy-acceptances` | Signed in | FR-POLICY-2404 | Accept new material policy versions |
| `GET /v1/me/entitlements` | Active account, current policies | FR-PLAN-2603 | Active entitlement keys, such as `edu.member` |
| `GET /health/live`, `/health/ready`, `/metrics` | Private network | NFR-12 | Probes and Prometheus metrics |

Errors use the shared envelope. Platform-specific codes: `POLICY_ACCEPTANCE_REQUIRED` (403, `details.policies`), `POLICY_VERSION_OUTDATED` (409), `ACCOUNT_SUSPENDED` (403), `EMAIL_NOT_VERIFIED` (403).

## Data protection

The API connects as `oxinov_platform_app`, which cannot bypass row-level security. A person sees only their own account, acceptances, entitlements, and audit history. Acceptances and audit history are append-only, catalogues are read-only, and a request can grant only free member access, to itself, for launched products (`database/platform/migrations/20260924100200_owner_isolation`).

## Email (FR-NOTIF-2903)

When a person completes the welcome, the API sends one "Welcome to Oxinov" email to their verified address: their display name (HTML-escaped), where to go next (`https://edu.oxinov.com`, `https://app.oxinov.com`), and `support@oxinov.com`. The template is `src/mail/welcome-email.ts`: plain English, text and simple HTML, no images or tracking.

- **Once:** the email is sent only by the request that moves the account out of `PENDING_WELCOME`, after the transaction commits. A repeated or concurrent welcome sends nothing.
- **Never blocking:** a failed send does not fail or roll back the welcome. It logs one `mail.welcome.failed` warning with the account ID and the SMTP status, never the address or the body.
- **Transport:** plain SMTP (`nodemailer`) to the in-cluster `mail-relay` (port 2525, private network, no login), which accepts only `MAIL_FROM` and forwards to Brevo or Amazon SES. Code depends on the `MAILER` interface (`src/mail/mailer.ts`); tests inject a fake.

| Variable | Default | Meaning |
| --- | --- | --- |
| `MAIL_SMTP_HOST` | empty | SMTP relay host (`mail-relay` in the cluster). Empty turns email off: the welcome logs `mail.welcome.skipped` with `reason: mail_disabled` |
| `MAIL_SMTP_PORT` | `2525` | Relay port |
| `MAIL_FROM` | `no-reply@oxinov.com` | Sender; must match the relay's own `MAIL_FROM` |

The Helm chart sets these for `platform-api` and allows `platform-api` to reach `mail-relay` on its SMTP port (`mail.platformApi` in `values.yaml`; `false` turns platform-api email off).

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
