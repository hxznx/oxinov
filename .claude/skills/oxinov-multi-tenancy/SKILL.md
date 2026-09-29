---
name: oxinov-multi-tenancy
description: Build multi-tenant features in Oxinov products - tenants (workspaces), memberships and role ranks, TenantGuard and RequireRole, transaction-local tenant context with DatabaseContext, row-level security helper functions, invites and join codes, tenant quotas, and isolation tiers. Use for any feature that stores or shows data belonging to a school, company, or workspace.
---

# Multi-tenancy in Oxinov products

Rules: [database rules](../../../docs/14-ai-knowledge/database-rules.md), [security rules](../../../docs/14-ai-knowledge/security-rules.md). Sources: [database design](../../../docs/05-data/database-design.md), [scalability](../../../docs/04-architecture/scalability.md). Decisions: ADR-006, ADR-019. Requirements: FR-TENANT-16xx in the [Edu FRD](../../../docs/03-requirements/frd/edu-frd.md).

## The model (as built in Edu)

| Piece | Where | What it does |
| --- | --- | --- |
| Tenant (workspace) | `Tenant` model in the product schema | A school, company, or teacher's space |
| Membership and role | `tenantMembership` with status and role `LEARNER < INSTRUCTOR < ADMIN < OWNER` | Higher roles include lower ones (`src/tenancy/roles.ts`, `hasRole`) |
| Invites and join codes | `TenantInvite` | How people join a workspace |
| Guard | `src/tenancy/tenant.guard.ts` (`TenantGuard`, `RequireRole`) | Requires an ACTIVE membership for `/v1/tenants/:tenantId/...`; non-members get 404; emits a security event on denial |
| Tenant context | `src/database/database-context.service.ts` (`DatabaseContext`) | Sets `app.tenant_id` and `app.user_id` for the transaction |
| Database enforcement | Row-level security using `app_current_tenant_id()`, `app_current_user_id()`, `app_is_tenant_staff()`, under the request role `oxinov_app` | Blocks cross-tenant rows even if the API has a bug |

## Steps for a new tenant-scoped feature

1. Route it under `v1/tenants/:tenantId/...` with `@UseGuards(TenantGuard)`; add `@RequireRole('INSTRUCTOR')` (or higher) for staff actions.
2. Give every new table a `tenant_id`, grants for the request role only, `ENABLE` and `FORCE ROW LEVEL SECURITY`, and policies with the helper functions (oxinov-database).
3. Run every query through `DatabaseContext` with the caller's scope; filter by `tenantId` in the query too.
4. Answer `RESOURCE_NOT_FOUND` for another tenant's objects.
5. Test with two tenants: allowed for a member, 404 for a non-member, 403 for a lower role, and SQL policy tests as the request role.
6. Keep per-tenant limits (uploads, exam attempts, future AI usage) so one large tenant cannot starve others.

## A new product copies this pattern

Copy the tenant, membership, invite, guard, and context design into the new product's own database and API. Do not share tenant tables between products: a person's workspaces in two products are linked through the platform account, not a shared table.

## Scaling tenants

A tenant whose size, data residency, or contract needs it can later get a dedicated database or account (scalability step 7, ADR-019). Design so that nothing assumes all tenants share one database: always scope by `tenant_id`, never by global lists.
