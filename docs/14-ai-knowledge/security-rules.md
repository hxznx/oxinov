# Security rules

The security rules every change must keep, in short form. Read them before you touch sign-in, authorization, secrets, personal data, or anything public.

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

Source: [AGENTS.md](../../AGENTS.md) sections 3, 6, and 9, [security baseline](../09-security/security-baseline.md), [threat model](../09-security/threat-model.md), [secrets management](../09-security/secrets-management.md), [privacy](../09-security/privacy.md), [SOC](../09-security/soc.md), and [identity and access](../04-architecture/identity-and-access.md).

## Identity and access

- One Oxinov account works across all products. Customers sign in with Google, Apple (iOS), or an email one-time code, never a password (ADR-011, ADR-016). Products never store login data.
- Authorize every protected action on the server: audience, tenant membership, role, entitlement, trust level (T0–T4), and policy acceptance.
- Treat a change to sign-in, the Keycloak realm, email sending, or DNS as a production change: rehearse it, state the effect on users, and push only when asked. A change to `devops/keycloak/configure-realm.sh` re-applies the production realm on push.
- The Keycloak admin console and master realm are never public.

## Secrets and credentials

- Keep secrets in SSM Parameter Store (SecureString) and encrypted Kubernetes Secrets, never in Git, Terraform state, logs, or images. `.env.example` files hold placeholders only.
- Access is keyless: GitHub OIDC roles for CI and deploy, the instance role on the server, Systems Manager for shell access. No SSH and no long-lived AWS keys.
- Never ask for, accept, or type passwords, MFA codes, access keys, or tokens. The owner signs in (`aws sso login`).

## Data and events

- Tenant isolation is enforced in the API and by row-level security, and tested in both directions.
- Emit security events only through `security/soc/event-schema.json`. Never include secrets, raw bodies, private messages, exam answers, KYC documents, or raw AI prompts.
- Keep personal data out of logs, metrics labels, fixtures, and prompts.

## Supply chain and workloads

- Pin exact versions, base images, tools, and charts (with SHA-256 or digests).
- Never weaken a gate to ship. Trivy blocks HIGH and CRITICAL findings that have fixes; fix by upgrading. An unavoidable upstream finding gets a written, expiring entry in that image's `.trivyignore`.
- Workloads run as non-root with a read-only root filesystem, dropped capabilities, `RuntimeDefault` seccomp, and deny-by-default network policies.

## Money and content

- Oxinov never holds a customer balance; escrow is a ledger state (ADR-013).
- Do not copy official exam questions or imply official certification without rights.

Skills: [oxinov-security](../../.claude/skills/oxinov-security/SKILL.md), [oxinov-validation](../../.claude/skills/oxinov-validation/SKILL.md), [oxinov-multi-tenancy](../../.claude/skills/oxinov-multi-tenancy/SKILL.md), [oxinov-platform-integration](../../.claude/skills/oxinov-platform-integration/SKILL.md), [oxinov-payments](../../.claude/skills/oxinov-payments/SKILL.md).
