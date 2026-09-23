# Cross-tenant access runbook

## Trigger

One confirmed cross-tenant data disclosure, or repeated `tenant.cross_access.denied` events that indicate enumeration or control probing.

## Triage

1. Open an incident record and preserve the alert, deployment version, correlation IDs, actor ID, tenant IDs, normalized route, source address, and relevant audit events.
2. Confirm whether the request was denied. Treat any successful cross-tenant response as critical severity.
3. Determine the affected API, search, media, chat, background job, webhook, export, or AI retrieval path.

## Containment and recovery

1. Revoke the suspected session or service credential when authorized.
2. Disable the affected operation or deployment through the approved rollback/feature-flag procedure.
3. Preserve database and object-access evidence. Do not modify original evidence.
4. Fix both application authorization and PostgreSQL RLS where applicable, then run two-tenant positive and negative tests.
5. Assess notification and regulatory duties with the privacy/legal owner before communicating externally.

## Closure

Document scope, root cause, access timeline, affected tenants and records, corrective actions, new tests/detections, and follow-up owners.
