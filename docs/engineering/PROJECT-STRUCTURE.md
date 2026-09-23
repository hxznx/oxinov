# Project source structure

```text
frontend/
  web/              Next.js browser application
  mobile/           Expo Android/iOS application
backend/
  api/              NestJS REST/OpenAPI service
  worker/           background jobs
  chat/             WebSocket gateway
database/
  prisma/           Prisma schema and client configuration
  migrations/       reviewed, numbered database migrations
  seeds/            deterministic development/test seed data
  policies/         PostgreSQL RLS and database policy definitions
devops/
  docker/           application Dockerfile and Docker guidance
  kubernetes/       future Kubernetes deployment templates
  terraform/        future cloud infrastructure definitions
  ansible/          future host configuration
monitoring/
  prometheus/       scrape configuration and alert rules
  alertmanager/     alert routing configuration
  grafana/          provisioned data source and dashboards
security/
  ci/               CI security scanning policy
  soc/              security-event schema, Sigma detections, runbooks, and incidents
  evidence/         evidence-handling policy; actual evidence is ignored by Git
packages/
  contracts/        shared API types and generated client
  domain/           pure domain types and rules where sharing is safe
docs/               product, architecture, engineering, and operations specifications
scripts/            repository validation and maintenance utilities
.github/workflows/  GitHub Actions CI, security, and deployment gates
docker-compose.yml  root entry point for local containers and profiles
```

Each application owns its runtime and Docker build target. Packages must not import from applications. Only `backend/api` and `backend/worker` may use the database client; `frontend/web` and `frontend/mobile` call the versioned API. Database migrations and policies live in `database/` and are executed by controlled backend or CI tasks. Monitoring configuration never imports product code. Security detections consume normalized events and cannot bypass application authorization or query production databases directly. GitHub requires executable workflows under `.github/workflows/`; DevOps design and provider assets remain under `devops/`. Do not share secrets or database clients into a frontend bundle. Create backend modules for tenant, identity, catalog, learning, exams, chat, billing, and AI commands. `backend/api` is scaffolded (tenancy, catalog, learning, and exams in one module for now); the other applications have not been scaffolded yet.
