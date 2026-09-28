# Oxinov Platform

The company and product monorepo of **Oxinov Pvt. Ltd.**: the public website, the shared Oxinov platform (one account, sign-in, account portal, platform API), and the products built on it. The first product, **Oxinov Edu**, is a cloud-hosted, multi-tenant online classroom for schools and teachers covering languages (such as JLPT N5–N1), SSW skills, IT, and exam preparation. Everything is written in English only (ADR-020).

## Start here

| You want to | Open |
| --- | --- |
| Get the code running and understand the system | [Onboarding](docs/00-onboarding/README.md) |
| Find any document | [Documentation map](docs/README.md) |
| Find any file | [Project library](PROJECT-LIBRARY.md) and the [file catalog](docs/08-engineering/file-catalog.md) |
| Know the rules every contributor and coding assistant follows | [AGENTS.md](AGENTS.md) |
| Know what runs in production today | [Current state](docs/04-architecture/current-state.md) |

To work locally you need Node.js 22, pnpm 12.6.0, Python 3.9 or newer, and Docker. Run `pnpm install --frozen-lockfile` at the root, then follow [developer setup](docs/10-devops/dev-setup.md).

## Company, platform, and products

| Layer | Address | Status |
| --- | --- | --- |
| Company website | `oxinov.com` | Live; deployed on every push to `main` |
| One Oxinov account and sign-in | `id.oxinov.com` | Live with email one-time codes; Google sign-in needs the owner's OAuth client |
| Account portal and product launcher | `app.oxinov.com` | Live, foundation |
| [Oxinov Edu](docs/02-products/edu/README.md) | `edu.oxinov.com` | Live, in development |
| [Oxinov HR](docs/02-products/hr/README.md) | `hr.oxinov.com` | Candidate unified HR and direct-hiring product; not built or public |
| [Oxinov Market](docs/02-products/market/market-charter.md) | `market.oxinov.com` | Draft charter; not built |
| [Oxinov Services Market](docs/02-products/services-market/services-market-charter.md) | `services.oxinov.com` | Draft charter; not built |

Oxinov Studio, JP, and Tech exist only as proposed requirements ([product register](docs/02-products/README.md)). Each product has its own frontend, backend, and database; one Oxinov account signs in to all of them.

## What is built

The company website, account portal, platform API, Edu web app, and Edu API run in production. Edu covers workspaces, the catalog, free enrollment and one-time paid courses (Khalti and eSewa, ADR-023), authoring, video and audio lessons, quizzes and mock exams, assignments, notes, resources, the class stream, and certificates. Subscriptions, coupons, refunds, dashboards, native mobile apps, and most platform capabilities are still open; the [Edu FRD's implementation table](docs/03-requirements/frd/edu-frd.md) and [current state](docs/04-architecture/current-state.md) are authoritative.

Production runs on one k3s node in AWS Mumbai. Terraform manages it, every green push to `main` deploys automatically with automatic rollback (ADR-017, ADR-018), and spend stays within US$50 a month. Open work is in the [task list](docs/11-planning/tasks.md); decisions still needed are in [risks and decisions](docs/11-planning/risks.md).

## Repository areas

| Folder | Contents |
| --- | --- |
| `frontend/` | Company website, account portal, product web apps, and future mobile clients |
| `backend/` | Platform and product APIs, workers, and future gateways |
| `database/` | Platform and product schemas, migrations, seeds, and row-level security policies |
| `packages/` | Shared libraries (`server-kit`, `web-auth`, `design-system`) and reserved boundaries |
| `devops/` | Docker build, Keycloak, Kubernetes chart, Terraform, and delivery scripts |
| `monitoring/` | Prometheus, Alertmanager, and Grafana provisioning |
| `security/` | Security event schema, detections, SOC runbooks, and incident templates |
| `docs/` | Numbered documentation, from company to marketing |
| `prompts/` | Reviewed, milestone-scoped commands for coding assistants |
| `scripts/` | Validation, catalogs, service scaffolding, and the quarantine tool |
