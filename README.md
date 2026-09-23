# Oxinov LMS

Documentation-first scaffold for a cloud-hosted, multi-tenant learning platform covering JLPT N5–N1, SSW skills, other languages, and IT. Customers create branded LMS workspaces; learners use web and Android/iOS apps.

## Start here

1. Read [project brief](docs/00-PROJECT-BRIEF.md), [PRD](docs/01-PRD.md), [FRD](docs/02-FRD.md), and [NFR](docs/03-NFR.md).
2. Review [architecture](docs/architecture/ARCHITECTURE.md), [database design](docs/data/DATABASE-DESIGN.md), and [roadmap](docs/planning/ROADMAP.md).
3. Coding agents follow [AGENTS.md](AGENTS.md). See [project structure](docs/engineering/PROJECT-STRUCTURE.md) before adding applications.
4. For local infrastructure, copy `.env.example` to `.env` and run `docker compose up -d postgres redis minio` after Docker is installed.
5. Start local monitoring with `docker compose --profile monitoring up -d`. Open Grafana at `http://localhost:3001`, Prometheus at `http://localhost:9090`, and Alertmanager at `http://localhost:9093`.

## Repository areas

| Folder | Ownership |
| --- | --- |
| `frontend/` | Next.js web and Expo mobile clients |
| `backend/` | NestJS API, worker, and chat services |
| `database/` | Prisma schema, migrations, seeds, and PostgreSQL policies |
| `devops/` | Docker build, Kubernetes, Terraform, and Ansible assets |
| `monitoring/` | Prometheus, Alertmanager, exporters, and Grafana provisioning |
| `security/` | CI security policy, SOC event schema, Sigma detections, runbooks, and incident templates |
| `packages/` | Shared contracts and pure domain packages |

## Current state

The first backend slice exists in `backend/api` (NestJS): workspaces, catalog, free-course enrollment, and server-graded timed exams, backed by the Prisma schema, numbered migrations, PostgreSQL row-level security, and a two-tenant JLPT N5 seed under `database/`. See [the API README](backend/api/README.md) for routes, local setup, and tests. Paid checkout (Stripe), lesson progress, certificates, the web and mobile apps, the worker, and chat are not implemented yet. Frontend, worker, and chat Docker targets and the deployment manifests remain templates. No production deployment target is configured.

## Decisions still needed

Launch markets, tenant pricing, cloud provider, payment policy, AI provider, and initial course inventory are tracked in [risks and decisions](docs/planning/RISKS.md) and [ADR](docs/architecture/ADR.md).
