# Service catalog

[Project library](../../PROJECT-LIBRARY.md) · [Product register](../products/README.md) · [Production runbook](../../devops/kubernetes/README.md)

Every deployable service, generated from [`services.yaml`](../../services.yaml) by `python scripts/service_catalog.py`.
Edit the catalog, not this page. The image of each service is `oxinov/<service>` in Amazon ECR.

| Service | Product | Kind | Source | Build target | Workload | Port | Public host | Owner |
| --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| `lms-api` | lms | api | [backend/products/lms-api](../../backend/products/lms-api/) | backend | edu-api | 4000 | internal | @hxznx |
| `platform-api` | platform | api | [backend/platform-api](../../backend/platform-api/) | platform-api | platform-api | 4200 | internal | @hxznx |
| `edu-web` | lms | web | [frontend/products/lms-web](../../frontend/products/lms-web/) | edu-web | edu-web | 3002 | `edu.oxinov.com` | @hxznx |
| `platform-web` | platform | web | [frontend/platform-web](../../frontend/platform-web/) | platform-web | platform-web | 3001 | `app.oxinov.com` | @hxznx |
| `migrate` | platform | job | [backend/workers/migrate](../../backend/workers/migrate/) | migrate | none | - | internal | @hxznx |
| `mail-relay` | platform | worker | [backend/workers/mail-relay](../../backend/workers/mail-relay/) | mail-relay | mail-relay | 2525 | internal | @hxznx |
| `keycloak` | platform | identity | [devops/keycloak](../../devops/keycloak/) | `devops/keycloak/Dockerfile` | keycloak | 8080 | `id.oxinov.com` | @hxznx |
| `backup` | platform | job | [devops/docker](../../devops/docker/) | backup | none | - | internal | @hxznx |

## Adding a service

1. Add the source folder on its product shelf ([placement rules](PROJECT-STRUCTURE.md)) and a Dockerfile target.
2. Add an entry to `services.yaml`, then run `python scripts/service_catalog.py`.
3. Add the Helm `services:` entry named after `workload`, and map `helm_tag` in the chart.
4. Plan and apply the starter Terraform stack: it creates the ECR repository from the catalog.
5. Push. The release planner builds and deploys the new image like every other service.

`python scripts/service_catalog.py --check` (run by `scripts/validate_project.py` in CI) fails when a derived
file is stale, a path, Dockerfile target or chart entry is missing, or a port or host disagrees with the chart.
