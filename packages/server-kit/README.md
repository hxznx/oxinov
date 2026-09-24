# @oxinov/server-kit

Shared NestJS building blocks for every Oxinov API, so security-critical behavior is written and tested once:

| Module | Provides |
| --- | --- |
| `config` | `loadServiceConfig`: fail-fast configuration, audience required and development tokens refused in staging and production (ADR-007) |
| `auth` | `TokenVerifier` (OIDC JWKS: issuer, audience, signature, expiry), `AuthGuard`, `@Public()`, `IdentityResolver` contract |
| `errors`, `http-exception.filter` | `DomainError`, `CommonErrors`, and the stable error envelope (docs/api/ERROR-HANDLING.md) |
| `logger` | `JsonLogger` with redaction of secrets, tokens, codes, and personal fields |
| `metrics`, `request-context.middleware` | Bounded-label HTTP metrics (`HttpMetrics`, extend it for domain counters) and request IDs |
| `security-events` | Schema-valid security events (`security/soc/event-schema.json`) |
| `http-hardening.middleware` | Security headers and the per-client rate limiter |

Each API still owns its Prisma client, `DatabaseContext`, identity resolver, and domain errors.

```bash
pnpm --filter @oxinov/server-kit test
pnpm --filter @oxinov/server-kit build   # APIs import the compiled CommonJS output
```
