---
name: oxinov-security
description: Start any Oxinov security work here - the security principles (zero trust, deny by default, least privilege, defense in depth, secure by default, fail securely, minimize attack surface, data isolation), a quick threat check, the request pipeline, and which specialised security skill to load for authentication, access control, input and output, secrets and crypto, or security operations. Use for any change that touches identity, permissions, personal data, files, money, secrets, or public exposure.
---

# Oxinov security

Standard: [secure development standard](../../../docs/09-security/secure-development-standard.md) (principles, pipeline, and the risk-to-control map). Rules: [security rules](../../../docs/14-ai-knowledge/security-rules.md). Sources: [security baseline](../../../docs/09-security/security-baseline.md), [threat model](../../../docs/09-security/threat-model.md), [privacy](../../../docs/09-security/privacy.md), [SOC](../../../docs/09-security/soc.md).

## Principles, applied

| Principle | Ask yourself |
| --- | --- |
| Zero trust | Is every caller's token verified, even from inside the cluster? |
| Deny by default | If I forget a check, is the result "no access" (global `AuthGuard`, RLS with no context returns nothing, deny-by-default network policy)? |
| Least privilege | Does this role, token, pod, or database grant have only what it needs? |
| Defense in depth | If the API check has a bug, does row-level security still stop it? |
| Secure by default | Is the safe setting the default, and does unsafe configuration fail at startup? |
| Fail securely | On error, do we deny, hide details, and log server-side? |
| Minimize attack surface | Did I add a public route, port, host, dependency, or permission that is not needed? |
| Data isolation | Can data cross a tenant or product boundary? |

## Five-minute threat check before building

1. What can an attacker reach: which route, file, message, or event?
2. Who should be allowed, and what stops everyone else?
3. What input do they control, and where does it end up (SQL, HTML, a URL fetch, a file key, a log)?
4. What is sensitive here (tokens, personal data, exam answers, money)?
5. What happens if the same request arrives twice at once?
6. How would we notice abuse?

## Which skill to load

| Topic | Skill |
| --- | --- |
| JWT, OIDC sign-in, sessions, cookies, CSRF, sign-in failures | oxinov-authentication-sessions |
| Middleware, guards, controllers, roles, RLS, tenant isolation, IDOR, mass assignment, race conditions | oxinov-access-control (and oxinov-multi-tenancy) |
| Input validation, output encoding, SQL and NoSQL injection, XSS, SSRF, path traversal, file uploads, error handling, data exposure | oxinov-secure-input-output |
| Secrets, encryption, hashing, signatures, randomness | oxinov-secrets-and-crypto |
| Logging and auditing, monitoring, rate limiting, misconfiguration, dependencies and supply chain, backup and recovery | oxinov-security-operations |
| Payments | oxinov-payments |
| AI features | oxinov-ai-feature |

## Production rules

- Sign-in, the Keycloak realm, email sending, and DNS are production changes: rehearse, state the user-visible effect, push only when asked. A change to `devops/keycloak/configure-realm.sh` re-applies the realm on push.
- Never ask for, accept, or type passwords, MFA codes, keys, or tokens.
- Never weaken a gate (tests, Trivy, validation, drift check) to ship.

## Checks

```bash
pnpm validate:security
pnpm --filter @oxinov/server-kit test
pnpm --filter @oxinov/web-auth test
pnpm --filter @oxinov/edu-api db:test-policies
pnpm --filter @oxinov/edu-api test:integration
```

## If you find a vulnerability or leaked secret

Stop and tell the owner what is exposed and since when; never paste the secret anywhere. The owner rotates credentials. Record security incidents in `security/soc/incidents/` using `INCIDENT-TEMPLATE.md`, and in the changelog. A known gap that is accepted goes into [risks and decisions](../../../docs/11-planning/risks.md) with the owner's acceptance.
