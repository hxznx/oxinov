# Current project structure

Start with the [project library](../../PROJECT-LIBRARY.md) or the [complete alphabetical file catalog](FILE-CATALOG.md).
This guide describes current paths; the [target structure](COMPANY-PROJECT-STRUCTURE.md) describes future migrations.
Source presence does not establish production readiness.
For future product types and lifecycle registration, follow the [company library standard](COMPANY-LIBRARY-STANDARD.md).

```text
frontend/
  company-web/      implemented public company site
  platform-web/     implemented account portal
  products/lms-web/ implemented Edu web application
  web/              legacy placeholder; do not add application source here
  mobile/           planned mobile application
backend/
  api/              implemented Edu API; retained legacy location
  platform-api/     implemented platform API foundation
  products/lms-api/ target-path documentation only
  workers/          mail-relay and migrate implemented; platform-worker planned
  gateway/          planned gateway boundary
  worker/           planned Edu background jobs
  chat/             planned Edu realtime gateway
database/
  platform/         separate platform schema, migrations, policies and seeds
  products/lms/     target-path documentation only
  prisma/           Edu Prisma schema and client configuration
  migrations/       reviewed, numbered database migrations
  seeds/            deterministic development/test seed data
  policies/         PostgreSQL RLS and database policy definitions
devops/
  docker/           application Dockerfile and Docker guidance
  keycloak/         identity image and realm configuration
  kubernetes/       shared Helm chart, bootstrap, deploy and rehearsal scripts
  scripts/          operational CLI and delivery checks
  terraform/        state bootstrap and production edge/starter infrastructure
  ansible/          reserved host configuration
monitoring/
  prometheus/       scrape configuration and alert rules
  alertmanager/     alert routing configuration
  grafana/          provisioned data source and dashboards
security/
  ci/               CI security scanning policy
  soc/              security-event schema, Sigma detections, runbooks, and incidents
  evidence/         evidence-handling policy; actual evidence is ignored by Git
packages/
  design-system/    implemented tokens, brand assets and contrast checks
  server-kit/       implemented shared API infrastructure
  web-auth/         implemented shared web authentication
  contracts/        contract scaffold; generated clients not yet established
  domain/           reserved domain boundary
docs/               product, architecture, engineering, and operations specifications
scripts/            repository validation and maintenance utilities
.github/workflows/  GitHub Actions CI, security, and deployment gates
docker-compose.yml  root entry point for local containers and profiles
```

## Shared packages

Implemented packages are `design-system`, `server-kit` and `web-auth`.
`auth`, `config`, `domain`, `observability`, `security-events` and `testing` are documentation placeholders; `contracts` is a scaffold.
Inspect the implemented packages before introducing overlapping abstractions into the reserved folders.

## Placement and naming

- Keep root files for entry guides and workspace configuration. Application-specific settings stay in the application.
- Group API code by feature under its `src/`, keeping controllers, DTOs, services and rules together. Integration tests live in `test/`; focused tests may sit beside their implementation.
- Web routes live in `src/app/`. Route-specific components stay beside their route; reusable application components live in `src/components/`, helpers and API access in `src/lib/`.
- Use lowercase hyphenated folder names, framework filenames such as `page.tsx`, and existing React component and uppercase documentation conventions. Alphabetize indexes; do not rename runtime paths just for visual ordering.
- Keep migrations immutable and timestamp-ordered. Edu data currently uses the root database subfolders, while platform data uses `database/platform/`.
- Shared packages never import applications. Frontends never import database clients. Each backend uses only its own database; cross-product access uses APIs or events.
- Executable GitHub workflows belong in `.github/workflows/`; infrastructure and scripts in `devops/`; explanatory operating guides in `docs/devops/`.
- Organize documents by subject and link every document from `docs/README.md`. Local temporary files belong in ignored `.tmp/`.

## Transition and maintenance

The Edu API and database legacy paths are intentional. Migrate them only with imports, workspace, Docker, CI and tests updated together, coordinating with other active agents.
Do not create future product folders before release approval.

This library milestone supports NFR-12 maintainability without changing product behavior.
Each repository file must appear once in the generated catalog; deleted paths disappear and ignored local files stay excluded.
Regenerate using `python scripts/project_catalog.py`; the documentation validator checks freshness.
