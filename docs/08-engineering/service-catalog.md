# Service catalog

[Project library](../../PROJECT-LIBRARY.md) · [Product register](../02-products/README.md) · [Production runbook](../../devops/kubernetes/README.md)

Every deployable service, generated from [`services.yaml`](../../services.yaml) by `python scripts/service_catalog.py`.
Edit the catalog, not this page. The image of each service is `oxinov/<service>` in Amazon ECR.

| Service | Product | Kind | Source | Build target | Workload | Port | Public host | Owner |
| --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| `lms-api` | edu | api | [backend/products/lms-api](../../backend/products/lms-api/) | backend | edu-api | 4000 | internal | @hxznx |
| `platform-api` | platform | api | [backend/platform-api](../../backend/platform-api/) | platform-api | platform-api | 4200 | internal | @hxznx |
| `edu-web` | edu | web | [frontend/products/lms-web](../../frontend/products/lms-web/) | edu-web | edu-web | 3002 | `edu.oxinov.com` | @hxznx |
| `platform-web` | platform | web | [frontend/platform-web](../../frontend/platform-web/) | platform-web | platform-web | 3001 | `app.oxinov.com` | @hxznx |
| `migrate` | platform | job | [backend/workers/migrate](../../backend/workers/migrate/) | migrate | none | - | internal | @hxznx |
| `mail-relay` | platform | worker | [backend/workers/mail-relay](../../backend/workers/mail-relay/) | mail-relay | mail-relay | 2525 | internal | @hxznx |
| `keycloak` | platform | identity | [devops/keycloak](../../devops/keycloak/) | `devops/keycloak/Dockerfile` | keycloak | 8080 | `id.oxinov.com` | @hxznx |
| `backup` | platform | job | [devops/docker](../../devops/docker/) | backup | none | - | internal | @hxznx |

## Adding a service

Run `oxctl new-service <product> <api|web|worker>` (try `--dry-run` first). It creates `<product>-<kind>` on
its product shelf ([placement rules](project-structure.md)) as a small standard-library Node.js service with
health endpoints and a test, adds its Dockerfile stage, `services.yaml` entry and Helm entry (with network
access: web public, API from the product's web app, worker none), and regenerates this page. The product
needs a record in `docs/02-products/<product>/` first, so the release gate still applies. Then:

1. `pnpm install` to add the package to the lockfile, and run its test.
2. Plan and apply the starter Terraform stack: it creates the ECR repository from the catalog (and add a
   public host to `var.hosts` for its DNS record).
3. Push. The release planner builds and deploys the new image like every other service.
4. Grow the code into the product stack (NestJS with `@oxinov/server-kit`, or Next.js) as it needs more.

`python scripts/service_catalog.py --check` (run by `scripts/validate_project.py` in CI) fails when a derived
file is stale, a path, Dockerfile target or chart entry is missing, or a port or host disagrees with the chart.

## Sharing the node (ADR-022)

Every product runs on the one k3s node. Each chart workload has a `priority` tier: `critical` (PostgreSQL,
Keycloak, mail relay), `core` (live products and the platform, the default), or `growth` (new products; new
services start here and move to core at launch). Under memory pressure Kubernetes preempts and evicts lower
tiers first. `--check` also fails when the production memory requests of all workloads exceed
`memoryBudgetMi` in the chart values, so crowding shows up in CI instead of in production.
