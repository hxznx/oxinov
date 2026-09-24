# Oxinov company platform target structure

## Migration rule

The current `frontend/web`, `frontend/mobile`, `backend/api`, `backend/worker`, `backend/chat`, and `database/` implementation belongs to OxinovLMS. Keep it working while the platform foundation is added. Move or rename existing code only in a dedicated migration with import, Docker, CI, and test updates in the same change.

## Target repository layout

```text
frontend/
  company-web/                 oxinov.com
  platform-web/                app.oxinov.com
  products/
    lms-web/                   lms.oxinov.com
  mobile/
    lms/                       OxinovLMS Android and iOS

backend/
  gateway/                     api.oxinov.com routing and edge policy
  platform-api/                organizations products plans entitlements audit
  workers/
    platform-worker/           notifications billing outbox and scheduled work
  products/
    lms-api/                   LMS business API
    lms-worker/                LMS media results certificates and scheduled work
    lms-chat/                  LMS realtime gateway

database/
  platform/                    platform Prisma schema migrations seeds policies
  products/
    lms/                       LMS Prisma schema migrations seeds policies

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
