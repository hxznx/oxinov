# Oxinov LMS

Documentation-first scaffold for a cloud-hosted, multi-tenant learning platform covering JLPT N5–N1, SSW skills, other languages, and IT. Customers create branded LMS workspaces; learners use web and Android/iOS apps.

## Start here

1. Read [project brief](docs/00-PROJECT-BRIEF.md), [PRD](docs/01-PRD.md), [FRD](docs/02-FRD.md), and [NFR](docs/03-NFR.md).
2. Review [architecture](docs/architecture/ARCHITECTURE.md), [database design](docs/data/DATABASE-DESIGN.md), and [roadmap](docs/planning/ROADMAP.md).
3. Coding agents follow [AGENTS.md](AGENTS.md). See [project structure](docs/engineering/PROJECT-STRUCTURE.md) before adding applications.
4. For local infrastructure, copy `.env.example` to `.env` and run `docker compose up -d postgres redis minio` after Docker is installed.

## Current state

The requirements and repository scaffold are present. Frontend, API, worker, chat, and mobile application code have not yet been implemented. Docker application targets and deployment manifests are templates until those apps exist. No production deployment target is configured.

## Decisions still needed

Launch markets, tenant pricing, cloud provider, payment policy, AI provider, and initial course inventory are tracked in [risks and decisions](docs/planning/RISKS.md) and [ADR](docs/architecture/ADR.md).
