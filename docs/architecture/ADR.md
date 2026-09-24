# Architecture decision records

Record each decision with date, status, context, choice, consequences, and alternatives considered. Do not silently change the stack in the FRD.

## ADR-001: PostgreSQL as system of record

**Status:** Proposed. Use containerized PostgreSQL for transactional LMS data. Default to shared tenant-scoped tables with RLS and API authorization; offer dedicated PostgreSQL only for a justified customer tier. Redis and object storage are supporting systems.

## ADR-002: Separate frontend and backend

**Status:** Proposed. Next.js renders web UI; NestJS owns APIs and business rules used by web and mobile. Separate Docker targets support independent builds and scaling.

## ADR-003: One shared mobile app

**Status:** Proposed. A single Expo app lets users switch their tenant workspaces and renders tenant branding. Separately branded binaries require a future decision because they multiply store releases.

## ADR-004: Prometheus and Grafana observability baseline

**Date:** 2026-09-23. **Status:** Accepted for the initial implementation. Services expose Prometheus-compatible metrics only on the private network. Prometheus stores short-term metrics and evaluates version-controlled rules; Alertmanager routes alerts; Grafana loads data sources and dashboards from version-controlled provisioning files. PostgreSQL and Redis use dedicated exporters. Do not use tenant IDs, user IDs, email addresses, URLs with identifiers, or other unbounded values as metric labels. Production may replace these containers with compatible managed services while preserving metric names, dashboards, and alert behavior.

## ADR-005: Separate security operations pipeline

**Date:** 2026-09-24. **Status:** Accepted as the baseline design. Operational metrics remain in Prometheus/Grafana. Security events follow the versioned schema under `security/soc/` and are sent to an access-controlled SIEM. OpenSearch Security Analytics with portable Sigma rules is the initial SIEM recommendation; a compatible managed SIEM may replace it. Falco supplies production Linux/Kubernetes runtime detections. Wazuh is optional when endpoint/host agents, file-integrity monitoring, inventory, or compliance capabilities justify the additional platform. Actual incident evidence is never stored in Git.

## ADR-006: Tenant context through transaction-local settings and a non-bypass role

**Date:** 2026-09-24. **Status:** Accepted for the first backend slice. The API connects as `oxinov_app` (no superuser, no `BYPASSRLS`, no DDL, no delete on audit history). Every data operation runs inside one transaction that first calls `set_config('app.tenant_id' | 'app.user_id' | 'app.auth_subject', value, true)`; row-level security policies compare rows to those settings and match nothing when they are absent. Tenant-owned tables also use composite `(tenant_id, id)` foreign keys so cross-tenant references are rejected by constraints. Consequences: every query needs a short transaction (acceptable at current scale; revisit with PgBouncer transaction pooling, which is compatible), and each new table must add its policy and grants in the same migration. Alternatives considered: per-request `SET ROLE` per tenant (role explosion), schema-per-tenant (migration fan-out), application checks only (single point of failure).

## ADR-007: Identity token verification and local development tokens

**Date:** 2026-09-24. **Status:** Accepted. The API verifies bearer tokens against an approved OIDC provider's JWKS (`AUTH_ISSUER`, `AUTH_JWKS_URL`, optional `AUTH_AUDIENCE`) without depending on a provider SDK. Only the subject, `email`, and `email_verified` claims are used by the current LMS slice; tenant roles always come from PostgreSQL. The provider client must supply the required verified-email claims before tenant creation can succeed. For local work and tests, HS256 tokens with issuer `oxinov-dev` are accepted when `AUTH_DEV_JWT_SECRET` is set; configuration refuses that secret when `NODE_ENV` or `DEPLOY_ENVIRONMENT` is `production`.

## ADR-008: Shared company control plane with independent product planes

**Date:** 2026-09-24. **Status:** Accepted as the target architecture. `oxinov.com` provides the public company presence, `app.oxinov.com` provides one account and product launcher, and an OIDC identity service provides single sign on. The control plane owns organizations, product catalogue, plans, entitlements, shared billing records, audit, privacy, and support access. OxinovLMS and every later product own their product workflows, deployments, and data and integrate through versioned APIs and events. Begin with modular applications and a transactional outbox; extract services or introduce a message platform only for measured scale, availability, security, data, or team-ownership needs. Keycloak is the default OIDC implementation while the application contract remains provider-neutral. Existing OxinovLMS code is migrated incrementally rather than rewritten.

## Pending

Choose company-platform product owners, cloud provider, identity operations model, production deployment topology, Nepal and international payment providers, SIEM hosting/retention/on-call ownership, AI provider, tenant billing plans, and mobile purchase approach by market. See [RISKS.md](../planning/RISKS.md).
