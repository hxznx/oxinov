# Oxinov company and product library

Find any file using **category → responsibility → feature → alphabetical file list**.
Runtime paths stay stable; folders are not renamed merely to change display order.

This is the company library, not an Edu-only structure. Browse by business offering through the
[product register](docs/products/README.md), or by technical responsibility through the file catalog.
The [company growth standard](docs/engineering/COMPANY-LIBRARY-STANDARD.md) explains how software,
services, hardware, content and research fit without duplicating shared files.

## Start here

1. [Complete file and folder catalog](docs/engineering/FILE-CATALOG.md): clickable paths and roles for every repository file, alphabetically.
2. [Current structure and placement rules](docs/engineering/PROJECT-STRUCTURE.md): active applications, planned locations and naming rules.
3. [Documentation map](docs/README.md): requirements, architecture, decisions and operating procedures by subject.
4. [Company growth standard](docs/engineering/COMPANY-LIBRARY-STANDARD.md) and [product record template](docs/products/PRODUCT-RECORD-TEMPLATE.md): add future offerings consistently after the appropriate approvals.

## Shelves, alphabetically

| Shelf | Contents | Entry point |
| --- | --- | --- |
| `.claude/` | Agent launch configuration | [Agent instructions](AGENTS.md) |
| `.github/` | CI, deployments and dependency updates | [CI/CD](docs/devops/CI-CD.md) |
| `backend/` | APIs and server-side workers | [Backend](backend/README.md) |
| `database/` | Schemas, migrations, policies and seeds | [Database](database/README.md) |
| `devops/` | Images, identity, Kubernetes, Terraform and delivery scripts | [Production runbook](devops/kubernetes/README.md) |
| `docs/` | Requirements, decisions, planning and research | [Documentation map](docs/README.md) |
| `frontend/` | Company site, portal and product interfaces | [Frontend](frontend/README.md) |
| `monitoring/` | Dashboards and alert rules | [Monitoring](monitoring/README.md) |
| `packages/` | Shared libraries and explicitly reserved boundaries | [Package directory](docs/engineering/PROJECT-STRUCTURE.md#shared-packages) |
| `prompts/` | Reviewed milestone instructions | [Platform build](prompts/BUILD-OXINOV-PLATFORM.md) |
| `scripts/` | Repository maintenance and validation | [Maintenance](#maintenance) |
| `security/` | Events, detections and incident procedures | [Security](security/README.md) |

## Find work by product

Every product uses one technical slug and the same shelves, so a new product is found the same way as Edu:

| Shelf | Path pattern | Oxinov Edu (`lms`) |
| --- | --- | --- |
| Product record | `docs/products/<slug>/README.md` | [docs/products/lms](docs/products/lms/README.md) |
| Requirements | `docs/requirements/frd/<PRODUCT>-FRD.md` | [EDU-FRD.md](docs/requirements/frd/EDU-FRD.md) |
| Web client | `frontend/products/<slug>-web/` | [lms-web](frontend/products/lms-web/README.md) |
| API | `backend/products/<slug>-api/` | [lms-api](backend/products/lms-api/README.md) |
| Worker, realtime | `backend/products/<slug>-worker/`, `<slug>-chat/` | planned |
| Database | `database/products/<slug>/` | [lms](database/products/lms/README.md) |

Shared company layers sit beside the products: `frontend/company-web` and `frontend/platform-web`,
`backend/platform-api` and `backend/workers/`, `database/platform/`, and `packages/`.
The [product register](docs/products/README.md) lists every offering, including those without software.

## Find work by subject

| Subject | Open |
| --- | --- |
| Assignments, courses, exams, media, notes and discussions | [Edu product record](docs/products/lms/README.md), [Edu API](backend/products/lms-api/README.md), [Edu web](frontend/products/lms-web/README.md) |
| Branding and tokens | [Design system](packages/design-system/README.md) |
| Company website | [Company web](frontend/company-web/README.md) |
| Database changes | [Migration strategy](docs/data/MIGRATION-STRATEGY.md) |
| Deployment and rollback | [Production runbook](devops/kubernetes/README.md), [service catalog](docs/engineering/SERVICE-CATALOG.md) |
| Identity and accounts | [Keycloak](devops/keycloak/README.md), [web authentication](packages/web-auth/README.md), [platform API](backend/platform-api/README.md) |
| Scope and priorities | [Requirements](docs/requirements/README.md), [backlog](docs/planning/TASKS.md) |
| Recent changes | [Changelog](docs/planning/CHANGELOG.md) |

## Maintenance

Run from the root after adding, removing or renaming files:

```bash
python scripts/project_catalog.py
python scripts/project_catalog.py --check
python scripts/validate_project.py
node scripts/validate-workspace.mjs
```

Shortcuts: `pnpm catalog:update` and `pnpm catalog:check`.
The existing CI documentation validator checks catalog freshness. Regenerate after all files for a change exist and include the catalog diff in that change.
Update category descriptions and status classifications in the generator when boundaries change.

The inventory includes tracked and non-ignored new files, not dependencies, caches, local environment files, Terraform state, private evidence or empty folders.
It follows Git ignore rules; never add private material to Git. `.env.example` files are public configuration templates.
Local temporary work belongs under ignored `.tmp/` instead of additional root folders.

## Change discipline

- Preserve functional boundaries and sort the indexes, rather than adding number prefixes to source folders.
- Link each new document from `docs/README.md`; cite requirements for behavior changes.
- Label placeholders. Catalog presence does not prove implementation or production readiness.
- Coordinate path migrations with other agents and update imports, Docker, CI and tests together.
- This user-requested reproducible Markdown index is versioned documentation; generated caches and build output remain excluded.

## Rollback

This milestone affects documentation and catalog checks, with no runtime or database migration.
To undo it, remove the catalog hook and commands together with the library files and restore the previous guides. Re-run documentation and workspace validation.
