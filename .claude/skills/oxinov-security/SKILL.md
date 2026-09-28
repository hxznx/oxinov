---
name: oxinov-security
description: Keep Oxinov secure - sign-in and the Keycloak realm, server-side authorization and trust levels, tenant isolation, secrets, personal data, security events, dependency and image scanning, and incident records. Use for any change that touches identity, permissions, secrets, personal data, or public exposure.
---

# Oxinov security

Rules: [security rules](../../../docs/14-ai-knowledge/security-rules.md). Sources: [security baseline](../../../docs/09-security/security-baseline.md), [threat model](../../../docs/09-security/threat-model.md), [secrets management](../../../docs/09-security/secrets-management.md), [privacy](../../../docs/09-security/privacy.md), [SOC](../../../docs/09-security/soc.md). Code: `security/` ([README](../../../security/README.md)).

## Before you change anything security-relevant

1. Name what could go wrong: who could see or change what they should not (use the [threat model](../../../docs/09-security/threat-model.md)).
2. Check which rule in AGENTS.md section 3 applies. Sign-in, realm, email, and DNS changes are production changes; push only when asked.

## Checklist by area

| Area | Check |
| --- | --- |
| Authorization | Server-side check of audience, tenant membership, role, entitlement, trust level (T0-T4), and policy acceptance; cross-tenant answers 404; tests for every denial |
| Tenant isolation | `DatabaseContext` used for every query; row-level security on every tenant table; policy tests pass |
| Sign-in | No passwords for customers; tokens stay on the web server (`@oxinov/web-auth`); a change to `devops/keycloak/configure-realm.sh` re-applies the production realm on push, so rehearse with `bash devops/kubernetes/scripts/rehearse-local.sh` |
| Secrets | None in code, Git, images, logs, or Terraform state; production values in SSM Parameter Store; `.env.example` holds placeholders only |
| Personal data | Minimum collected; none in logs, metrics labels, fixtures, security events, or prompts; retention and export follow [data retention](../../../docs/05-data/data-retention.md) |
| Security events | Emitted through `@oxinov/server-kit` against `security/soc/event-schema.json`; catalog in `security/soc/EVENT-CATALOG.md`; no secrets, raw bodies, private messages, exam answers, KYC documents, or raw prompts |
| HTTP | `server-kit` hardening middleware stays on; no stack traces or SQL in responses |
| Dependencies and images | Exact pinned versions; Trivy HIGH and CRITICAL with fixes block the build; fix by upgrading; any ignore is written and expiring in `.trivyignore` |
| Workloads | Non-root, read-only root, dropped capabilities, deny-by-default network policy; only `edu-api`, `mail-relay`, and `backup` reach instance metadata |

## Checks

```bash
pnpm validate:security
pnpm --filter @oxinov/server-kit test
pnpm --filter @oxinov/edu-api db:test-policies
pnpm --filter @oxinov/edu-api test:integration
```

CI also runs the Trivy repository scan (`.github/workflows/security.yml`).

## If you find a vulnerability or leaked secret

Stop, tell the owner what is exposed and since when, and do not paste the secret anywhere. The owner rotates credentials. Record security incidents in `security/soc/incidents/` using its template, and in the changelog.
