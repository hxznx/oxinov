---
name: oxinov-code-review
description: Review an Oxinov change, pull request, or helper's work before it is committed or merged - correctness, tenant isolation and authorization, migrations, API compatibility, security, tests, delivery effect, documentation, and the definition of done. Use when asked to review code or a diff, or before accepting work from another agent.
---

# Reviewing an Oxinov change

Sources: [AGENTS.md](../../../AGENTS.md) sections 4-12, the [AI knowledge rule sets](../../../docs/14-ai-knowledge/README.md).

## Steps

1. Read the request and the requirement IDs; the change must do that and nothing unrelated.
2. Read the whole diff, plus the surrounding code it depends on.
3. Go through the checklist; report findings ranked by severity, each with the file, line, the failure scenario, and the fix.
4. Run the checks yourself where possible; do not trust a report that says "tests pass" without output.

## Checklist

| Area | Look for |
| --- | --- |
| Scope | Unrelated edits, files from other sessions, generated files, secrets, `.env` files |
| Correctness | Logic errors, missing awaits, off-by-one, time zones (UTC), money as floats |
| Authorization | Server-side checks for role, entitlement, trust level, policy; client-supplied roles ignored |
| Tenant isolation | Queries through `DatabaseContext`, filtered by tenant; RLS on new tables; cross-tenant returns 404; tests for both directions |
| Validation | DTOs on every input; unknown fields rejected; uploads checked |
| Migrations | New file only (never edited); expand-then-contract; works with the running image; schema has no drift |
| API compatibility | No removed or renamed fields, routes, or error codes without a migration path; OpenAPI regenerated |
| Security | No secrets or personal data in logs, events, fixtures; security events for denials; pinned dependencies |
| Idempotency | Retried requests and provider events do not duplicate records or payments |
| Tests | Allowed and denied paths; the FR ID cited; tests fail without the change |
| Performance | N+1 queries, unpaginated lists, large payloads through the API instead of presigned URLs |
| Delivery | What the push rebuilds or deploys; realm changes; memory against the budget; rehearsal done |
| Docs | FRD status, current state, changelog, catalogs; validator passes |
| Style | Reads like the surrounding code; no needless abstraction |

## Verdict

- **Accept** only when every required check passes and nothing unverified is claimed.
- **Request changes** with specific fixes.
- **Reject** work that weakens a security gate, edits a merged migration, touches production without approval, or invents facts.
