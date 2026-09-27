# Oxinov company platform target structure

## Migration rule

Oxinov Edu now lives at its product-plane paths (`frontend/products/lms-web`, `backend/products/lms-api`, `database/products/lms`). Any later move or rename happens only in a dedicated migration with import, Docker, CI, and test updates in the same change.

## Target repository layout

For different future offering types, stable product slugs, lifecycle tracking and external asset storage,
follow the [company library standard](company-library-standard.md). The runtime layout below applies to
software product planes; it does not require consulting, hardware or research initiatives to create web applications.

The repository follows the company structure: **company** (public website) → **platform** (one account, identity, shared services) → **products** (independent product planes). Every product has its own frontend, backend, and database folder. Folders marked *after release gate* are created only when that product's charter in `docs/02-products/` is approved.

```text
frontend/
  company-web/                 oxinov.com public company site, divisions, legal pages
  platform-web/                app.oxinov.com account portal, product launcher, KYC, billing
  products/
    lms-web/                   edu.oxinov.com
    market-web/                market.oxinov.com       after release gate
    hr-web/                    hr.oxinov.com           after unified HR release gate
    services-web/              services.oxinov.com     after release gate
  mobile/
    lms/                       Oxinov Edu Android and iOS
    marketplace/               shared Commodity and Services mobile app if approved

backend/
  gateway/                     api.oxinov.com routing and edge policy
  platform-api/                users, trust levels, policies, organizations, entitlements, KYC, payments ledger, audit
  workers/
    platform-worker/           notifications, billing, KYC checks, outbox, scheduled work
  products/
    lms-api/                   LMS business API
    lms-worker/                LMS media, results, certificates, scheduled work
    lms-chat/                  LMS realtime gateway
    market-api/                listings, orders, escrow, price indices    after release gate
    market-worker/             price feeds, escrow timers, dispute SLAs  after release gate
    hr-api/                    HR network, recruitment, jobs, applications after unified HR release gate
    services-api/              services, demands, bookings               after release gate

database/
  platform/                    platform Prisma schema, migrations, seeds, RLS policies
  products/
    lms/                       LMS schema, migrations, seeds, RLS policies
    market/                    Commodity Market schema                    after release gate
    hr/                        HR and direct-hiring schema                after unified HR release gate
    services/                  Services Market schema                     after release gate

packages/
  contracts/                   versioned API and event contracts
  design-system/               tokens and accessible shared web components
  server-kit/                  shared NestJS building blocks: config, token verification, errors, logging, metrics, security events, HTTP hardening
  auth/                        OIDC validation and authorization primitives
  observability/               logging metrics tracing and correlation
  security-events/             safe normalized security event client
  config/                      typed configuration loaders
  testing/                     approved test builders and fixtures

devops/
  docker/                      development and image builds
  kubernetes/                  environment and product deployment definitions
  terraform/                   cloud projects networks databases storage and DNS
  ansible/                     host configuration only where required

monitoring/                    Prometheus Alertmanager Grafana Loki Tempo OTel
security/                      CI security SOC detections runbooks and evidence policy
docs/                          company product architecture engineering and operations
prompts/                       reviewed coding-agent commands
```

## Product plane template

Every product plane has the same shape so teams and coding agents can move between products:

| Part | Location | Rule |
| --- | --- | --- |
| Web frontend | `frontend/products/<product>-web/` | Next.js App Router; signs in through `id.oxinov.com`; shows the shared product launcher; calls only its own API and the platform API |
| API | `backend/products/<product>-api/` | NestJS; validates Oxinov tokens with `packages/auth`; checks entitlement and trust level from the platform before protected actions |
| Worker | `backend/products/<product>-worker/` | Added only when the product needs background jobs |
| Database | `database/products/<product>/` | Own PostgreSQL database and service account; RLS for tenant- or owner-scoped rows; stores the platform user ID, never a copy of login data |
| Contracts | `packages/contracts/<product>/` | Versioned OpenAPI and event schemas |
| Charter and requirements | `docs/02-products/<product>/` | Approved before any folder above is created |
| Operations | `monitoring/`, `devops/`, `security/` | Dashboards, alerts, runbooks, deployment definition, and security events per product |

## Dependency rules

- Frontends depend on generated contracts and shared UI packages, never database clients.
- Product modules may use platform APIs and events; they may not import control-plane internals.
- The platform control plane may not import product business logic.
- One product cannot read or migrate another product's database.
- Shared packages contain stable cross-product concerns, not a miscellaneous collection of helpers.
- Deployment definitions identify an owner, environment, health check, resources, secret references, dashboards, alerts, and rollback method.

## Transition steps

1. Add `company-web`, `platform-web`, `platform-api`, and the platform database without moving LMS code.
2. Establish shared OIDC, contracts, configuration, observability, security events, and design tokens.
3. Connect the existing LMS to platform identities and entitlements through APIs.
4. Rename the existing LMS folders to the target product paths once container builds and CI protect the migration. **Done 2026-09-26.**
5. Add future product folders only when their product charter and release gate are approved.
