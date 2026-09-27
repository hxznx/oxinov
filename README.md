# Oxinov Platform

Company platform and product monorepo for Oxinov Pvt. Ltd., building technology for people everywhere (English only, ADR-020). Oxinov Edu is the first product: a cloud-hosted, multi-tenant online classroom for schools and teachers, covering languages (such as JLPT N5–N1), SSW skills, IT, and exam preparation. The target company platform adds the public `oxinov.com` website, shared identity, an account and product portal, cross-product organizations and entitlements, and independent product planes.

## Start here

Open the [project library](PROJECT-LIBRARY.md) to browse by category, or the
[complete file catalog](docs/08-engineering/file-catalog.md) to find any repository file alphabetically.

1. Use the [documentation map](docs/README.md). Read the [company platform blueprint](docs/01-company/platform-blueprint.md), [company architecture](docs/04-architecture/platform-architecture.md), [company stack](docs/04-architecture/tech-stack.md), [AWS architecture](docs/04-architecture/cloud-architecture.md), [identity and access](docs/04-architecture/identity-and-access.md), [platform policies](docs/01-company/platform-policies.md), and [company roadmap](docs/11-planning/company-roadmap.md).
2. For company AI work, read the [AI implementation strategy](docs/01-company/ai-strategy.md), [AI platform architecture](docs/04-architecture/ai-architecture.md), [AI governance](docs/09-security/ai-governance.md), and [AI roadmap](docs/11-planning/ai-roadmap.md).
3. For Oxinov Edu work, read its [project brief](docs/02-products/edu/edu-brief.md), [PRD](docs/02-products/edu/edu-prd.md), [FRD](docs/03-requirements/frd/edu-frd.md), and [NFR](docs/03-requirements/nfr.md).
4. Coding agents follow [AGENTS.md](AGENTS.md), the [current structure](docs/08-engineering/project-structure.md), and the [target company structure](docs/08-engineering/company-project-structure.md). The reviewed [platform build command](prompts/BUILD-OXINOV-PLATFORM.md) and [AI foundation command](prompts/IMPLEMENT-AI-FOUNDATION.md) start approved milestones.
5. Install Node.js 22 and pnpm 12.6.0, then run `pnpm install --frozen-lockfile` from the repository root.
6. For local infrastructure, follow the [local setup](docs/10-devops/dev-setup.md): copy `.env.example` to `.env` and run `docker compose up -d postgres object-storage` (add `--profile identity` for Keycloak and Mailpit).
7. Start local monitoring with `docker compose --profile monitoring up -d`. Open Grafana at `http://localhost:3001`, Prometheus at `http://localhost:9090`, and Alertmanager at `http://localhost:9093`.

## Company, platform, and products

| Layer | Address | Status |
| --- | --- | --- |
| Company website | `oxinov.com` | Live; deployed on every push to `main` |
| One Oxinov account and sign-in | `id.oxinov.com` | Live with email one-time codes; Google sign-in needs the owner's OAuth client |
| Account portal and product launcher | `app.oxinov.com` | Live, foundation |
| Oxinov Edu | `edu.oxinov.com` | Live, in development |
| [Oxinov Commodity Market](docs/02-products/market/market-charter.md) | `market.oxinov.com` | Draft charter (all commodities & second-hand items) |
| [Oxinov HR](docs/02-products/hr/README.md) | `hr.oxinov.com` | Candidate unified HR and direct-hiring product; not built or public |
| [Oxinov Services Market](docs/02-products/services-market/services-market-charter.md) | `services.oxinov.com` | Draft charter |

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

Production runs on one k3s node in AWS Mumbai, managed by Terraform and deployed automatically from every green `main` with automatic rollback (ADR-017, ADR-018); spend stays within US$50 a month. The verified picture (services, data, security controls, cost, and gaps) is in [current state](docs/04-architecture/current-state.md); open work is in the [backlog](docs/11-planning/tasks.md). Paid checkout, certificates, native mobile, and broader platform capabilities remain open. Planned gateway, chat, and general worker folders are not implemented services. Source presence alone is not verification. Use the [current structure](docs/08-engineering/project-structure.md) for active paths and the [changelog](docs/11-planning/changelog.md) for recorded delivery evidence.

## Decisions still needed

Company-platform ownership, AWS account and identity operations, launch markets, payment-provider eligibility, product pricing, exact AI pilot owners/models/data, and initial course inventory are tracked in [risks and decisions](docs/11-planning/risks.md) and [architecture decisions](docs/04-architecture/adr/README.md).
