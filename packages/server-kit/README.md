# @oxinov/server-kit

Shared NestJS building blocks for every Oxinov API, so security-critical behavior is written and tested once:

| Module | Provides |
| --- | --- |
| `config` | `loadServiceConfig`: fail-fast configuration, audience required and development tokens refused in staging and production (ADR-007) |
| `auth` | `TokenVerifier` (OIDC JWKS: issuer, audience, signature, expiry), `AuthGuard`, `@Public()`, `IdentityResolver` contract |
| `errors`, `http-exception.filter` | `DomainError`, `CommonErrors`, and the stable error envelope (docs/06-api/api-errors.md) |
| `logger` | `JsonLogger` with redaction of secrets, tokens, codes, and personal fields |
| `metrics`, `request-context.middleware` | Bounded-label HTTP metrics (`HttpMetrics`, extend it for domain counters) and request IDs |
| `security-events` | Schema-valid security events (`security/soc/event-schema.json`) |
| `http-hardening.middleware` | Security headers and the per-client rate limiter |

Each API still owns its Prisma client, `DatabaseContext`, identity resolver, and domain errors.

```bash
pnpm --filter @oxinov/server-kit test
pnpm --filter @oxinov/server-kit build   # APIs import the compiled CommonJS output
```

## Assistant skills

Coding assistants working here follow [oxinov-backend-architecture](../../.claude/skills/oxinov-backend-architecture/SKILL.md), [oxinov-authentication-sessions](../../.claude/skills/oxinov-authentication-sessions/SKILL.md), [oxinov-access-control](../../.claude/skills/oxinov-access-control/SKILL.md), [oxinov-security-operations](../../.claude/skills/oxinov-security-operations/SKILL.md), [oxinov-shared-package](../../.claude/skills/oxinov-shared-package/SKILL.md), [oxinov-backend](../../.claude/skills/oxinov-backend/SKILL.md), [oxinov-validation](../../.claude/skills/oxinov-validation/SKILL.md), [oxinov-observability](../../.claude/skills/oxinov-observability/SKILL.md), [oxinov-security](../../.claude/skills/oxinov-security/SKILL.md), [oxinov-testing](../../.claude/skills/oxinov-testing/SKILL.md). All rules and skills: [AI knowledge](../../docs/14-ai-knowledge/README.md).
