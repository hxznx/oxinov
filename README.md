# Oxinov Platform

Company platform and product monorepo for Oxinov Pvt. Ltd. Oxinov Edu is the first product: a cloud-hosted, multi-tenant learning platform covering JLPT N5-N1, SSW skills, languages, and IT. The target company platform adds the public `oxinov.com` website, shared identity, an account and product portal, cross-product organizations and entitlements, and independent product planes.

## Start here

Open the [project library](PROJECT-LIBRARY.md) to browse by category, or the
[complete file catalog](docs/engineering/FILE-CATALOG.md) to find any repository file alphabetically.

1. Use the [documentation map](docs/README.md). Read the [company platform blueprint](docs/company/PLATFORM-BLUEPRINT.md), [company architecture](docs/architecture/COMPANY-PLATFORM-ARCHITECTURE.md), [company stack](docs/architecture/COMPANY-TECH-STACK.md), [AWS architecture](docs/architecture/AWS-CLOUD-ARCHITECTURE.md), [identity and access](docs/architecture/IDENTITY-AND-ACCESS.md), [platform policies](docs/company/PLATFORM-POLICIES.md), and [company roadmap](docs/planning/COMPANY-PLATFORM-ROADMAP.md).
2. For company AI work, read the [AI implementation strategy](docs/company/AI-IMPLEMENTATION-STRATEGY.md), [AI platform architecture](docs/architecture/AI-PLATFORM-ARCHITECTURE.md), [AI governance](docs/security/AI-GOVERNANCE.md), and [AI roadmap](docs/planning/AI-IMPLEMENTATION-ROADMAP.md).
3. For Oxinov Edu work, read its [project brief](docs/products/lms/BRIEF.md), [PRD](docs/products/lms/PRD.md), [FRD](docs/requirements/LMS-FRD.md), and [NFR](docs/requirements/NFR.md).
4. Coding agents follow [AGENTS.md](AGENTS.md), the [current structure](docs/engineering/PROJECT-STRUCTURE.md), and the [target company structure](docs/engineering/COMPANY-PROJECT-STRUCTURE.md). The reviewed [platform build command](prompts/BUILD-OXINOV-PLATFORM.md) and [AI foundation command](prompts/IMPLEMENT-AI-FOUNDATION.md) start approved milestones.
5. Install Node.js 22 and pnpm 12.6.0, then run `pnpm install --frozen-lockfile` from the repository root.
6. For local infrastructure, copy `.env.example` to `.env` and run `docker compose up -d postgres redis object-storage` after Docker is installed.
7. Start local monitoring with `docker compose --profile monitoring up -d`. Open Grafana at `http://localhost:3001`, Prometheus at `http://localhost:9090`, and Alertmanager at `http://localhost:9093`.

## Company, platform, and products

| Layer | Address | Status |
| --- | --- | --- |
| Company website | `oxinov.com` | Implemented; deployment workflow present |
| One Oxinov account and sign-in (Google or email code) | `id.oxinov.com` | Identity configuration implemented; provider readiness depends on environment |
| Account portal and product launcher | `app.oxinov.com` | Foundation implemented |
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

Implemented applications include company-web, platform-web, platform-api, Edu web and the Edu API. Edu includes workspaces, catalog, free enrollment, authoring, media, quizzes, assignments, notes, resources and discussions. See [Edu web](frontend/products/lms-web/README.md) and [the API guide](backend/products/lms-api/README.md) for scope and setup.

The repository includes production Terraform, Kubernetes/Helm delivery, a mail relay and a migration runner. Paid checkout, certificates, native mobile and broader platform capabilities remain open. Planned gateway, chat and general worker folders are not implemented services. Current release health must be checked in CI and production; source presence alone is not verification. Use the [current structure](docs/engineering/PROJECT-STRUCTURE.md) for active paths and the [changelog](docs/planning/CHANGELOG.md) for recorded delivery evidence.

## Decisions still needed

Company-platform ownership, AWS account and identity operations, launch markets, payment-provider eligibility, product pricing, exact AI pilot owners/models/data, and initial course inventory are tracked in [risks and decisions](docs/planning/RISKS.md) and [architecture decisions](docs/architecture/ADR.md).
