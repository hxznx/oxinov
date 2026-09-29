---
name: oxinov-new-product
description: Take a new Oxinov product, module, or offering from idea to its first release - classifying the initiative, the release gate, choosing a stable slug, the product record, FRD block, and creating only the approved components (web, mobile, API, worker, database, contracts). Use when someone proposes a new product, module, marketplace, service offering, or project, or asks to scaffold one.
---

# Launching a new Oxinov product or module

Sources: [company library standard](../../../docs/08-engineering/company-library-standard.md), [product register](../../../docs/02-products/README.md), [product record template](../../../docs/02-products/product-record-template.md), [release gate](../../../docs/11-planning/company-roadmap.md#release-gate-for-every-new-product), [target structure](../../../docs/08-engineering/company-project-structure.md). Decisions: ADR-008, ADR-019, ADR-025.

## The model: one company, one platform, many product planes

```text
oxinov.com (company website)
  └─ Oxinov platform (one account, portal, entitlements, policies, billing)   ← shared, never product logic
       ├─ Oxinov Edu      edu-web · edu-api · database/products/edu          ← live
       ├─ Oxinov HR       hr-web  · hr-api  · database/products/hr           ← FRD only
       └─ <next product>  <slug>-web · <slug>-api · database/products/<slug> ← only after its gate
```

Each product is independent: its own web app, API, database, and release, joined to the others only through the platform and APIs or events.

## Step 1: classify the initiative

| Kind | Where it starts | Builds software? |
| --- | --- | --- |
| Software product, marketplace, or AI application | Charter in `docs/02-products/<slug>/` | Yes, after the gate |
| Shared platform capability (used by every product) | Platform FRD and architecture | Extend the control plane only |
| Consulting or managed service | Service charter in `docs/02-products/` | Only portal workflows that are needed |
| Hardware, robotics, IoT | Charter plus research evidence | Needs an ADR before any new repository shape |
| Research experiment | `docs/12-research/` project template (oxinov-research) | No deployment |
| Module inside an existing product | That product's FRD (oxinov-requirements) | Yes, inside the existing services |

A new **module** of an existing product is almost always a new feature folder in its API and web app, not a new product.

## Step 2: register it as a candidate

1. Choose a stable lowercase slug (for example `hr`, `market`); never `app2`, `new`, or a date. The slug names every folder, package, database, image, and token audience, and changing it later is a production migration (see ADR-027).
2. Copy the [product record template](../../../docs/02-products/product-record-template.md) to `docs/02-products/<slug>/README.md` and add a row to the product register. Lifecycle: **Candidate**.
3. Take the next free requirement block from the [area registry](../../../docs/03-requirements/README.md#area-registry) and write a proposed FRD in `docs/03-requirements/frd/<slug>-frd.md`.

Never invent an owner, price, or approval; write `Unassigned` or `Not approved`.

## Step 3: pass the release gate (the owner decides)

The gate needs an accountable owner, user evidence, validated journeys, usability and accessibility measures, scope exclusions and success metrics, pricing or strategic justification, data classification and regulatory review, an architecture boundary, an operations and support plan, a delivery budget, and a stop-or-continue checkpoint. **Nothing is scaffolded before the owner approves it.** Record the approval (an ADR if it changes the architecture).

## Step 4: create only the approved components

| Component | Location | Skill |
| --- | --- | --- |
| Web app | `frontend/products/<slug>-web` | oxinov-new-service, oxinov-frontend |
| Mobile app | `frontend/mobile/<slug>` | oxinov-mobile |
| API | `backend/products/<slug>-api` | oxinov-new-service, oxinov-backend |
| Worker | `backend/products/<slug>-worker` | oxinov-events-and-jobs |
| Database | `database/products/<slug>` | oxinov-database, oxinov-multi-tenancy |
| API and event contracts | `packages/contracts/<slug>` | oxinov-api-design |
| Product documents | `docs/02-products/<slug>/<slug>-*.md` | oxinov-documentation |

Then connect it to the platform (oxinov-platform-integration): product key, entitlements, sign-in client and audience, accent token, and its `<slug>.oxinov.com` host.

## Step 5: check capacity and cost before the first deploy

Add up the new memory requests against `memoryBudgetMi` (3,300 MiB) and the new AWS cost against US$50 a month. Two or more live products is a trigger for the EKS step in the [scalability strategy](../../../docs/04-architecture/scalability.md) (oxinov-scaling).

## Step 6: advance the lifecycle with evidence

**Candidate → Approved → In development → Pilot → Live → Retired.** Each move needs evidence and the owner's sign-off; update the product record, [current state](../../../docs/04-architecture/current-state.md) when it goes live, and the changelog. Retiring keeps the charter and decisions, records data-retention duties, and removes code only through a reviewed migration.
