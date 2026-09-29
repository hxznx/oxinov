# Secure development standard

How every Oxinov product, service, and module is built securely: the principles, the request pipeline every API follows, and a map from each common risk to the Oxinov control, where it lives in the code, how to test it, and what is still missing. Engineers and coding assistants read it before building anything that handles identity, data, files, or money.

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

The rules come from [AGENTS.md](../../AGENTS.md) and the [security baseline](security-baseline.md); this page shows how they are applied in code. The step-by-step procedures are the security skills listed at the end. What runs in production is in [current state](../04-architecture/current-state.md).

## Principles

| Principle | What it means at Oxinov |
| --- | --- |
| Zero trust | No request is trusted because of where it comes from. Every API call carries a token that is verified (issuer, audience, signature, expiry), and every pod has a deny-by-default network policy. |
| Deny by default | The global `AuthGuard` rejects every route not marked `@Public()`; `TenantGuard` defaults to the lowest role only for members; row-level security returns no rows without tenant context; Kubernetes ingress is denied unless allowed. |
| Least privilege | Request roles (`oxinov_app`, `oxinov_platform_app`) get only the grants they need and cannot bypass row-level security; only three pods reach instance metadata; CI and deploy use short-lived OIDC roles. |
| Defense in depth | Authorization in the API, then row-level security in PostgreSQL, then network policy, then non-root read-only containers. A bug in one layer does not expose data. |
| Secure by default | Configuration fails at startup when unsafe (for example a development token secret in production); new tables follow the RLS template; the chart applies the workload security settings. |
| Fail securely | An invalid token, unknown tenant, or tampered session is treated as signed out or "not found"; errors return a stable code and never internal detail. |
| Minimize attack surface | APIs have no public host; the Keycloak admin console is never public; no SSH; only ports 80 and 443; no unused services or dependencies. |
| Data isolation | Each product has its own database; each tenant's rows are separated by `tenant_id` and row-level security; each product has its own token audience. |

## The request pipeline (every API)

```text
Traefik (TLS, HSTS, security headers)
 → web app server (session cookie unsealed; token attached on the server)
   → API middleware: request ID · security headers · rate limit
     → AuthGuard (global): verify JWT, resolve the user          ← authentication
       → TenantGuard: active membership, minimum role           ← authorization
         → ValidationPipe: whitelist DTOs                       ← input validation
           → controller: route and response shape only
             → service: business rules, entitlements, trust level
               → DatabaseContext: transaction-local tenant context
                 → PostgreSQL row-level security                ← data isolation
 ← HttpExceptionFilter: stable error envelope, details only in server logs
```

## Risk and control map

| Risk | Oxinov control | Where | How to test | Gaps |
| --- | --- | --- | --- | --- |
| Broken access control, IDOR | Server-side checks in every service; `TenantGuard`; other tenants' objects answer 404; row-level security | `src/tenancy/`, services, migrations | Integration tests with two tenants and each role; `db:test-policies` | - |
| Authentication failures | OIDC through Keycloak, no passwords; JWT verified with `jose` (RS256 or ES256, issuer, audience, expiry); per-product audience | `packages/server-kit/src/auth.ts`, `config.ts` | Tokens with wrong audience, issuer, expiry, or algorithm are refused | - |
| Session failures | Tokens sealed with AES-256-GCM in an HttpOnly, Secure, SameSite=Lax cookie; separate keys per purpose; PKCE, state, and nonce on sign-in; 30-day cookie limited by Keycloak's idle session | `packages/web-auth/src/session.ts`, `oidc.ts`, `pkce.ts` | `pnpm --filter @oxinov/web-auth test` | - |
| CSRF | SameSite=Lax session cookie; Next.js server actions check the request origin; the API takes bearer tokens, not cookies | web apps, `web-auth` | A cross-site form post does not change state | - |
| Open redirect | `safeReturnTo` allows only same-site relative paths | `packages/web-auth/src/return-to.ts` | Unit tests | - |
| Mass assignment | `ValidationPipe` with `whitelist` and `forbidNonWhitelisted`; services map DTO fields explicitly into Prisma writes | `src/app.factory.ts`, services | Extra fields such as `role` or `tenantId` in a body return 400 | - |
| SQL injection | Prisma queries and tagged-template raw SQL only (parameters bound) | services, `database-context.service.ts` | Review: no `$queryRawUnsafe` or string-built SQL | - |
| NoSQL injection | No NoSQL database is used; any future one must use typed queries and validated operators | - | - | - |
| XSS | React escapes output; lesson Markdown renders without raw HTML and drops unsafe link protocols; JSON-LD serialized safely; uploads that browsers could run (HTML, SVG, scripts) are refused | `LessonMarkdown.tsx`, `src/seo/JsonLd.tsx`, `submission-files.ts` | Script and `javascript:` payloads render as text | Web apps have no Content Security Policy yet |
| SSRF | The API calls only configured provider hosts (payments, S3, identity); users cannot supply URLs the server fetches; submitted links are stored, never fetched | `payments/providers.ts`, `media/object-storage.ts` | Review: no fetch of a user-supplied URL | - |
| Path traversal | Object keys are built from server-generated IDs and `safeFileName`; no file system paths from input | `media/media-rules.ts`, `media.service.ts` | `../` in a file name cannot change the key's folder | - |
| Unsafe file uploads | Allow-listed types and size limits before a presigned URL; magic-byte check after upload; short-lived presigned URLs; downloads served as attachments; private bucket | `media/`, `assignments/submission-files.ts` | Wrong type, oversize, and disguised files are refused | Malware scanning before public sign-up (security roadmap #3) |
| Race conditions | Unique constraints plus handling of `P2002` instead of check-then-insert; idempotent fulfilment; transactions | enrollments, exams, invites, payments, certificates services | Concurrent requests create one record | - |
| Sensitive data exposure | Minimum data; log redaction; error filter hides internals; no personal data in metrics labels or events | `server-kit/src/logger.ts`, `http-exception.filter.ts` | Logs and errors contain no tokens, bodies, or other tenants' IDs | - |
| Secure error handling | Stable codes and a request ID in every error; stack traces logged server-side only | `http-exception.filter.ts`, `src/common/errors.ts` | 500s show only the generic message and request ID | - |
| Cryptographic mistakes | Standard libraries only (`jose`, `node:crypto`); constant-time comparison of signatures; random IDs from `randomUUID`; no custom crypto | `web-auth`, `payments/providers.ts` | Review | - |
| Secrets exposure | SSM Parameter Store and Kubernetes Secrets; `.env` ignored by Git and Docker; Trivy secret scanning | `bootstrap-node.sh`, `.gitignore`, `security.yml` | `pnpm validate:security` | - |
| Security misconfiguration | Startup validation; security headers at Traefik, API, and web apps; non-root read-only containers; IMDSv2; `x-powered-by` removed | chart, `server-kit`, `next.config.ts` | `check-delivery.sh`, `rehearse-local.sh` | AWS Config not enabled |
| Vulnerable dependencies, supply chain | Exact pins, pnpm catalog, lockfile, Dependabot, Trivy on images and repository, pinned base images and tools by digest | `pnpm-workspace.yaml`, `.github/` | CI | CodeQL and dependency review need GitHub Advanced Security |
| Rate limiting and abuse | In-process limiter per client IP (`RATE_LIMIT_PER_MINUTE`, default 600) returns 429 with `Retry-After` | `server-kit/src/http-hardening.middleware.ts` | Burst test returns 429 | Per instance only; no WAF yet (roadmap #6) |
| Insufficient logging and monitoring | JSON logs with request IDs; security events against a schema; platform audit events (append-only); CloudWatch alarms | `server-kit`, `security/soc/`, `database/platform` | Denials emit events | No SIEM or production metrics yet |
| Data loss | Nightly `pg_dumpall` to S3 (30 days); daily disk snapshots (7 days); restores need the owner | `backup` job, Terraform | Quarterly restore test (NFR-05) | First restore test still open |

A new product, service, or module must meet every row before its release gate closes, or record the gap in [risks and decisions](../11-planning/risks.md) with the owner's acceptance.

## Security skills

| Skill | Covers |
| --- | --- |
| [oxinov-security](../../.claude/skills/oxinov-security/SKILL.md) | Principles, threat check, and which skill to use |
| [oxinov-authentication-sessions](../../.claude/skills/oxinov-authentication-sessions/SKILL.md) | JWT, OIDC, sessions, CSRF, sign-in failures |
| [oxinov-access-control](../../.claude/skills/oxinov-access-control/SKILL.md) | Middleware, guards, controllers, roles, RLS, IDOR, mass assignment, race conditions |
| [oxinov-secure-input-output](../../.claude/skills/oxinov-secure-input-output/SKILL.md) | Validation, encoding, injection, XSS, SSRF, path traversal, uploads, errors |
| [oxinov-secrets-and-crypto](../../.claude/skills/oxinov-secrets-and-crypto/SKILL.md) | Secrets, encryption, cryptographic mistakes |
| [oxinov-security-operations](../../.claude/skills/oxinov-security-operations/SKILL.md) | Logging and auditing, monitoring, rate limiting, misconfiguration, supply chain, backup and recovery |
