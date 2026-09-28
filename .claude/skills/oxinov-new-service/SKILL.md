---
name: oxinov-new-service
description: Add a new deployable service (API, web app, or worker) to an Oxinov product or the platform - the justification, services.yaml registration, oxctl new-service scaffolding, catalog generation, chart, Dockerfile, memory, and cost. Use when a task seems to need a new service, container, or product plane.
---

# Adding a new Oxinov service

Rules: [architecture rules](../../../docs/14-ai-knowledge/architecture-rules.md), [DevOps rules](../../../docs/14-ai-knowledge/devops-rules.md). Sources: [company library standard](../../../docs/08-engineering/company-library-standard.md), [target structure](../../../docs/08-engineering/company-project-structure.md), [service catalog](../../../docs/08-engineering/service-catalog.md). Decision: ADR-019.

## First: should it exist?

A new service costs memory on a 4 GiB node that is already about 75% used, and money under the US$50 budget. Add one only when:

- the product's release gate is approved (HR, Market, Services Market, Studio, JP, and Tech are **not** approved), and
- the work cannot live in the product's existing API or web app for a measured scaling, security, reliability, data, or ownership reason.

Otherwise, add a module to the existing service (oxinov-backend skill). A new product plane or a stack change also needs an ADR.

## Steps

1. Preview the scaffold:

   ```bash
   oxctl new-service <product> <api|web|worker> --dry-run
   ```

   (`python scripts/new_service.py` is the script behind it.) Options: `--port N`, `--host NAME`.
2. Run it without `--dry-run`. It creates `<product>-<kind>` on its product shelf (a minimal Node.js service with health endpoints, a README, and a test), a Dockerfile stage, the `services.yaml` entry, and the Helm values entry, then regenerates the derived files and checks that they agree. The product must already have a record at `docs/02-products/<product>/README.md`, or be `platform`.
3. Check the result and refresh the file catalog:

   ```bash
   python scripts/service_catalog.py --check
   python scripts/project_catalog.py
   ```

4. Replace the minimal service with the real one (oxinov-backend or oxinov-frontend), and tune the chart entry: probes, resources, priority class, `allowFrom`, and writable paths (oxinov-docker, oxinov-kubernetes).
5. State the memory request against `memoryBudgetMi` (3,300 MiB) and any new AWS cost (a new ECR repository is created by Terraform from `services.yaml` and needs a plan and "yes apply").
6. Run the checks: the service's own tests, `bash devops/scripts/check-delivery.sh`, and `bash devops/kubernetes/scripts/rehearse-local.sh`.
7. Document: product record, [current state](../../../docs/04-architecture/current-state.md) when it goes live, and the changelog.

The Terraform apply for the ECR repository must happen before the push that builds the image.
