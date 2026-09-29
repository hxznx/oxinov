---
name: oxinov-security-operations
description: Run Oxinov security operations - security logging and auditing, security events and the event schema, audit trails, detecting and monitoring abuse, rate limiting, security misconfiguration and hardening, minimizing attack surface, vulnerable dependencies and supply chain risks (pinning, Dependabot, Trivy), and backup and recovery. Use when adding audit or security logging, limits, configuration, dependencies, or anything that changes exposure or recoverability.
---

# Security operations

Sources: [SOC](../../../docs/09-security/soc.md), [security baseline](../../../docs/09-security/security-baseline.md) (with the costed roadmap), [logging](../../../docs/08-engineering/logging.md), [dependency policy](../../../docs/08-engineering/dependency-policy.md), [backup and recovery](../../../docs/10-devops/backup-recovery.md), [secure development standard](../../../docs/09-security/secure-development-standard.md). Code: `security/`, `packages/server-kit`.

## Logging and auditing

| Record | Use | Where |
| --- | --- | --- |
| Application log | Operations and debugging | `server-kit` `JsonLogger`: one JSON line with request ID; keys like `token`, `secret`, `password`, `cookie`, `authorization` are redacted |
| Security event | Detection: denials, cross-tenant attempts, suspicious input, admin actions | `SecurityEventsService` against `security/soc/event-schema.json`; catalog in `security/soc/EVENT-CATALOG.md` |
| Audit event | Accountability: who changed what, append-only | Platform `audit_events` (insert and select only for the request role) |

Steps for a security-relevant action:

1. Add the event to `EVENT-CATALOG.md` and the schema if it is new.
2. Emit it with actor, target, tenant, outcome, reason code, and request ID; never secrets, raw bodies, private messages, exam answers, KYC documents, or raw AI prompts.
3. For changes people must be accountable for (roles, ownership, policies, payments), also write an audit record.
4. Add a detection rule under `security/soc/detections` when an operator should act on it, with a runbook link.

## Monitoring (and the gap)

Today: CloudWatch alarms, probes, the smoke test, and logs through `oxctl logs`. There is **no SIEM and no production metrics yet**; say so when a design depends on detection. Until then, security events are written to logs and should be searchable by `action`.

## Rate limiting and abuse

- `RateLimitMiddleware` in `server-kit` limits each client IP per API instance (`RATE_LIMIT_PER_MINUTE`, default 600) and returns 429 `RATE_LIMITED` with `Retry-After`; probes and metrics are exempt.
- Add tighter limits for sensitive actions (sign-in attempts are covered by Keycloak's brute-force protection; join codes, certificate lookups, uploads, exam submissions) in the service, keyed by user and tenant as well as IP.
- Limits are per instance; with more replicas a shared limiter or AWS WAF (security roadmap #6, from about US$6 a month) is needed.

## Security misconfiguration and attack surface

- Startup validation refuses unsafe configuration; add rules for every new setting.
- Headers: HSTS and nosniff at Traefik; `X-Frame-Options: DENY`, nosniff, and referrer policy in the web apps; a strict CSP and `no-referrer` on the APIs; `x-powered-by` removed.
- Workloads: non-root, read-only root, dropped capabilities, seccomp, deny-by-default network policy, resource limits.
- No public host for APIs, no public Keycloak admin console, no SSH, only ports 80 and 443, IMDSv2.
- Swagger UI (`/docs`) only in local and CI.
- Remove unused routes, dependencies, services, and permissions in the same change that makes them unused.
- Gap: AWS Config is not enabled (security roadmap).

## Vulnerable dependencies and supply chain

- Exact versions; the pnpm catalog for shared ones; commit the lockfile; `pnpm install --frozen-lockfile` in CI.
- Before adding a dependency: is it needed, maintained, widely used, licence-compatible, and small? Prefer the platform and existing packages.
- Dependabot opens updates; Trivy scans the repository (secrets, vulnerabilities, misconfiguration) and every image; HIGH and CRITICAL with fixes block the build. Fix by upgrading; an unavoidable finding gets a written, expiring `.trivyignore` entry.
- Base images, tools, charts, and GitHub Actions are pinned by version and digest or SHA-256.
- Gap: CodeQL and dependency review need GitHub Advanced Security.

## Backup and recovery

- Nightly `pg_dumpall` to S3 (kept 30 days) and daily disk snapshots (7 days). `oxctl backup` takes one now; `oxctl backups` lists them.
- Any new data store must state how it is backed up and restored before it goes live.
- Restores overwrite data and need the owner's approval; follow [backup and recovery](../../../docs/10-devops/backup-recovery.md).
- A backup counts only when a restore is tested: the quarterly restore test (NFR-05) is still open in the task list.

## Incidents

Use the oxinov-server incident steps; security incidents also get a record in `security/soc/incidents/` from `INCIDENT-TEMPLATE.md`.
