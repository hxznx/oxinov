---
name: oxinov-access-control
description: Enforce authorization in Oxinov APIs - the middleware, guard, pipe, controller, service, and database order, deny by default with @Public, tenant membership and role checks, entitlements and trust levels, least-privilege database roles, row-level security and data isolation, preventing broken access control and IDOR, mass assignment, and race conditions. Use for any endpoint, query, or table that decides who may see or change something.
---

# Access control and data isolation

Standard: [secure development standard](../../../docs/09-security/secure-development-standard.md). Related skills: oxinov-multi-tenancy, oxinov-database, oxinov-backend. Decision: ADR-006.

## Layers, in request order

| Layer | Code | Job | Must not |
| --- | --- | --- | --- |
| Middleware | `server-kit`: request context, security headers, rate limit | Request ID, headers, throttling | Make authorization decisions |
| Global guard | `AuthGuard` (`server-kit/src/auth.ts`) | Verify the token; every route is private unless `@Public()` | Be bypassed; `@Public()` only for health, metrics, and public catalogues |
| Route guard | `TenantGuard`, `@RequireRole()` (`src/tenancy/`) | Active membership in the path's tenant; minimum role | Trust a tenant ID alone |
| Pipe | Global `ValidationPipe` | Reject unknown and invalid fields | - |
| Controller | `<feature>.controller.ts` | Route, pass `scope` and `user` to the service | Contain rules or queries |
| Service | `<feature>.service.ts` | Ownership, entitlements, trust level, policy, state rules | Skip checks because "the UI hides it" |
| Database | `DatabaseContext` + row-level security | Final filter by tenant and user | Run tenant queries outside `DatabaseContext` |

## Deny by default

- A new route is private automatically. Adding `@Public()` needs a reason in the change.
- `TenantGuard` answers 404 to non-members, so tenant IDs cannot be probed, and emits `tenant.cross_access.denied`.
- A table with row-level security and no matching policy returns nothing; that is the safe failure.

## Broken access control and IDOR

Every object ID in a path or body is attacker-controlled. For each one:

1. Load it **scoped**: `where: { id, tenantId: scope.tenantId }` (and `userId` for private objects such as notes).
2. Check the relationship: is this lesson in this course, this course in this tenant, this submission the caller's own (or is the caller staff)?
3. Missing or foreign → `Errors.notFound(...)`, never 403 that confirms it exists.
4. Test: learner A cannot read, change, or delete learner B's object; tenant A's staff cannot touch tenant B's.

## Least privilege

- Request roles `oxinov_app` and `oxinov_platform_app` get only the needed `GRANT`s per table, cannot bypass RLS, and cannot run migrations; migrations use the owner role.
- Append-only data (policy acceptances, audit events) is granted `SELECT, INSERT` only.
- Staff actions need `@RequireRole('INSTRUCTOR')` or higher; ownership transfer and billing need `OWNER`.
- Pods reach only the services in their `allowFrom`; only `edu-api`, `mail-relay`, and `backup` reach instance metadata.

## Mass assignment

- DTOs list only the fields a caller may set; `whitelist` plus `forbidNonWhitelisted` rejects the rest.
- Never spread a request body into a Prisma write (`data: { ...body }`); map fields one by one, and set `tenantId`, `userId`, `role`, `status`, and prices on the server.
- Separate DTOs for create, update, and staff-only updates.

## Race conditions

- Prefer a unique constraint and handle Prisma `P2002` over check-then-insert (see enrollments, invites, exams, payments, certificates).
- Change state with a conditional update (`updateMany` with the expected current status) and check the count, so two concurrent requests cannot both succeed.
- Keep a multi-step rule inside one `DatabaseContext` transaction.
- Test by firing the same request concurrently: one succeeds, the other gets `CONFLICT` or the same result.

## Checks

`pnpm --filter @oxinov/edu-api test:integration` (with tests for other tenant, other user, lower role, no entitlement) and `pnpm --filter @oxinov/edu-api db:test-policies`.
