# Oxinov Platform

Company platform and product monorepo for Oxinov Pvt. Ltd. OxinovLMS is the first product: a cloud-hosted, multi-tenant learning platform covering JLPT N5-N1, SSW skills, languages, and IT. The target company platform adds the public `oxinov.com` website, shared identity, an account and product portal, cross-product organizations and entitlements, and independent product planes.

## Start here

1. Read the [company platform blueprint](docs/company/PLATFORM-BLUEPRINT.md), [company architecture](docs/architecture/COMPANY-PLATFORM-ARCHITECTURE.md), [company stack](docs/architecture/COMPANY-TECH-STACK.md), [AWS architecture](docs/architecture/AWS-CLOUD-ARCHITECTURE.md), and [company roadmap](docs/planning/COMPANY-PLATFORM-ROADMAP.md).
2. For OxinovLMS work, read its [project brief](docs/00-PROJECT-BRIEF.md), [PRD](docs/01-PRD.md), [FRD](docs/02-FRD.md), and [NFR](docs/03-NFR.md).
3. Coding agents follow [AGENTS.md](AGENTS.md), the [current structure](docs/engineering/PROJECT-STRUCTURE.md), and the [target company structure](docs/engineering/COMPANY-PROJECT-STRUCTURE.md). The reviewed [AI build command](prompts/BUILD-OXINOV-PLATFORM.md) starts company-platform milestones.
4. For local infrastructure, copy `.env.example` to `.env` and run `docker compose up -d postgres redis minio` after Docker is installed.
5. Start local monitoring with `docker compose --profile monitoring up -d`. Open Grafana at `http://localhost:3001`, Prometheus at `http://localhost:9090`, and Alertmanager at `http://localhost:9093`.

## Repository areas

| Folder | Ownership |
| --- | --- |
| `frontend/` | Company, platform, product web, and product mobile clients |
| `backend/` | Platform and product APIs, workers, gateways, and realtime services |
| `database/` | Platform and product schemas, migrations, seeds, and PostgreSQL policies |
| `devops/` | Docker build, Kubernetes, Terraform, and Ansible assets |
| `monitoring/` | Prometheus, Alertmanager, exporters, Grafana, and future log/trace provisioning |
| `security/` | CI security policy, SOC event schema, Sigma detections, runbooks, and incident templates |
| `packages/` | Shared contracts, auth, design, configuration, observability, and domain packages |
| `prompts/` | Reviewed, milestone-scoped commands for coding agents |

## Current state

The implemented code is currently OxinovLMS. Its first backend slice exists in `backend/api` (NestJS): workspaces, catalog, free-course enrollment, and server-graded timed exams, backed by the Prisma schema, numbered migrations, PostgreSQL row-level security, and a two-tenant JLPT N5 seed under `database/`. See [the API README](backend/api/README.md) for routes, local setup, and tests.

The company website, account portal, shared control plane, product-entitlement integration, LMS web and mobile apps, paid checkout, lesson progress, certificates, worker, and chat are not implemented yet. Frontend, worker, and chat Docker targets and deployment manifests remain templates. No production deployment target is configured.

## Decisions still needed

Company-platform ownership, AWS account and identity operations, launch markets, payment-provider eligibility, product pricing, AI providers, and initial course inventory are tracked in [risks and decisions](docs/planning/RISKS.md) and [architecture decisions](docs/architecture/ADR.md).
