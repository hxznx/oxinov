# Oxinov Platform

Company platform and product monorepo for Oxinov Pvt. Ltd. Oxinov Edu is the first product: a cloud-hosted, multi-tenant learning platform covering JLPT N5-N1, SSW skills, languages, and IT. The target company platform adds the public `oxinov.com` website, shared identity, an account and product portal, cross-product organizations and entitlements, and independent product planes.

## Start here

1. Use the [documentation map](docs/README.md). Read the [company platform blueprint](docs/company/PLATFORM-BLUEPRINT.md), [company architecture](docs/architecture/COMPANY-PLATFORM-ARCHITECTURE.md), [company stack](docs/architecture/COMPANY-TECH-STACK.md), [AWS architecture](docs/architecture/AWS-CLOUD-ARCHITECTURE.md), [identity and access](docs/architecture/IDENTITY-AND-ACCESS.md), [platform policies](docs/company/PLATFORM-POLICIES.md), and [company roadmap](docs/planning/COMPANY-PLATFORM-ROADMAP.md).
2. For company AI work, read the [AI implementation strategy](docs/company/AI-IMPLEMENTATION-STRATEGY.md), [AI platform architecture](docs/architecture/AI-PLATFORM-ARCHITECTURE.md), [AI governance](docs/security/AI-GOVERNANCE.md), and [AI roadmap](docs/planning/AI-IMPLEMENTATION-ROADMAP.md).
3. For Oxinov Edu work, read its [project brief](docs/00-PROJECT-BRIEF.md), [PRD](docs/01-PRD.md), [FRD](docs/02-FRD.md), and [NFR](docs/03-NFR.md).
4. Coding agents follow [AGENTS.md](AGENTS.md), the [current structure](docs/engineering/PROJECT-STRUCTURE.md), and the [target company structure](docs/engineering/COMPANY-PROJECT-STRUCTURE.md). The reviewed [platform build command](prompts/BUILD-OXINOV-PLATFORM.md) and [AI foundation command](prompts/IMPLEMENT-AI-FOUNDATION.md) start approved milestones.
5. Install Node.js 22 and pnpm 12.6.0, then run `pnpm install --frozen-lockfile` from the repository root.
6. For local infrastructure, copy `.env.example` to `.env` and run `docker compose up -d postgres redis object-storage` after Docker is installed.
7. Start local monitoring with `docker compose --profile monitoring up -d`. Open Grafana at `http://localhost:3001`, Prometheus at `http://localhost:9090`, and Alertmanager at `http://localhost:9093`.

## Company, platform, and products

| Layer | Address | Status |
| --- | --- | --- |
| Company website | `oxinov.com` | Planned (Phase 1) |
| One Oxinov account and sign-in (Google or email code) | `id.oxinov.com` | Planned (Phase 2) |
| Account portal and product launcher | `app.oxinov.com` | Planned (Phase 2) |
| Oxinov Edu | `edu.oxinov.com` | First product, partially implemented |
| [Oxinov Commodity Market](docs/products/COMMODITY-MARKET.md) | `market.oxinov.com` | Draft charter (all commodities & second-hand items) |
| [Oxinov Jobs](docs/products/JOBS.md) | `jobs.oxinov.com` | Draft charter |
| [Oxinov Services Market](docs/products/SERVICES-MARKET.md) | `services.oxinov.com` | Draft charter |

Each product has its own frontend, backend, and database; one Oxinov account signs in to all of them.

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

The implemented code is currently Oxinov Edu. Its first backend slice exists in `backend/api` (NestJS): workspaces, catalog, free-course enrollment, and server-graded timed exams, backed by the Prisma schema, numbered migrations, PostgreSQL row-level security, and a two-tenant JLPT N5 seed under `database/`. See [the API README](backend/api/README.md) for routes, local setup, and tests.

The monorepo boundaries for the company website, account portal, shared control plane, and LMS product are established, but their application source is not implemented yet. Product-entitlement integration, LMS web and mobile apps, paid checkout, lesson progress, certificates, worker, and chat also remain unimplemented. Frontend, worker, and chat Docker targets and deployment manifests remain templates. No production deployment target is configured.

## Decisions still needed

Company-platform ownership, AWS account and identity operations, launch markets, payment-provider eligibility, product pricing, exact AI pilot owners/models/data, and initial course inventory are tracked in [risks and decisions](docs/planning/RISKS.md) and [architecture decisions](docs/architecture/ADR.md).
