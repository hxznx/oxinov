# Oxinov company platform target structure

## Migration rule

The current `frontend/web`, `frontend/mobile`, `backend/api`, `backend/worker`, `backend/chat`, and `database/` implementation belongs to OxinovLMS. Keep it working while the platform foundation is added. Move or rename existing code only in a dedicated migration with import, Docker, CI, and test updates in the same change.

## Target repository layout

The repository follows the company structure: **company** (public website) → **platform** (one account, identity, shared services) → **products** (independent product planes). Every product has its own frontend, backend, and database folder. Folders marked *after release gate* are created only when that product's charter in `docs/products/` is approved.

```text
frontend/
  company-web/                 oxinov.com public company site, divisions, legal pages
  platform-web/                app.oxinov.com account portal, product launcher, KYC, billing
  products/
    lms-web/                   lms.oxinov.com
    agri-web/                  agri.oxinov.com         after release gate
    jobs-web/                  jobs.oxinov.com         after release gate
    services-web/              services.oxinov.com     after release gate
  mobile/
    lms/                       OxinovLMS Android and iOS
    marketplace/               shared Agri, Jobs, and Services mobile app if approved

backend/
  gateway/                     api.oxinov.com routing and edge policy
  platform-api/                users, trust levels, policies, organizations, entitlements, KYC, payments ledger, audit
  workers/
    platform-worker/           notifications, billing, KYC checks, outbox, scheduled work
  products/
    lms-api/                   LMS business API
    lms-worker/                LMS media, results, certificates, scheduled work
    lms-chat/                  LMS realtime gateway
    agri-api/                  listings, orders, market prices            after release gate
    agri-worker/               price imports, order timeouts             after release gate
    jobs-api/                  postings, applications, matching          after release gate
    services-api/              services, demands, bookings               after release gate

database/
  platform/                    platform Prisma schema, migrations, seeds, RLS policies
  products/
    lms/                       LMS schema, migrations, seeds, RLS policies
    agri/                      Agri Market schema                         after release gate
    jobs/                      Jobs schema                                after release gate
    services/                  Services Market schema                     after release gate

packages/
  contracts/                   versioned API and event contracts
  design-system/               tokens and accessible shared web components
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
| Charter and requirements | `docs/products/<PRODUCT>.md` | Approved before any folder above is created |
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
4. Rename the existing LMS folders to the target product paths only after contract tests and container builds protect the migration.
5. Add future product folders only when their product charter and release gate are approved.
