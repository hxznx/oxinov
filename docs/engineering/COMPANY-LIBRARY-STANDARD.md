# Company library and growth standard

Oxinov is the company; Edu is one product. Organize by stable responsibility, not by whichever product was built first.
This guide applies the existing [company blueprint](../company/PLATFORM-BLUEPRINT.md), [product boundaries](COMPANY-PROJECT-STRUCTURE.md) and [research process](../research/README.md).
It does not approve additional products, introduce new runtime technologies or move existing applications.

## Two navigation views, one source

- **By responsibility:** the [file catalog](FILE-CATALOG.md) groups all repository files by engineering area and sorts paths alphabetically.
- **By business offering:** the [product register](../products/README.md) links each product's charter, requirements, actual implementation and operational guides.

Do not copy files into a second hierarchy just to support another navigation view. Link to their canonical location.
Company policies apply across products; platform documentation describes shared capabilities; product documentation owns product behavior.

## Classify a new initiative

| Kind | Documentation home | Implementation policy |
| --- | --- | --- |
| Company-wide policy, brand or strategy | `docs/company/`, `docs/design/`, `docs/marketing/` | Reuse across products; assign a document owner |
| Shared platform capability | Existing platform requirements and architecture documents | Extend the control plane only for cross-product responsibilities |
| Software product, marketplace or AI application | Charter in `docs/products/`; product FRD in `docs/requirements/` after approval | Independent product plane using the existing template; AI additionally follows AI governance |
| Consulting or managed service | Service charter in `docs/products/` when proposed as an offering | Do not create an application solely because the offering exists; add approved portal workflows only when needed |
| Hardware, robotics or IoT offering | Charter plus research evidence and operating requirements | Record firmware, CAD, manufacturing and device-data needs first; approve repository/storage/stack choices through architecture decisions before creating new technical roots |
| Research experiment | `docs/research/` using its project template | Time-boxed evidence and review; research status does not authorize a product deployment |
| Media or licensed content offering | Charter and rights/provenance references | Large source media belongs in approved asset storage; keep specifications and non-sensitive references here |

These are filing rules, not a list of approved products. Financial records, HR files, customer contracts, identity documents, private research data and credentials belong in appropriately restricted systems. Keep only non-sensitive policies and reference identifiers in this source repository.

## Stable identifiers and optional components

Give each approved product a stable lowercase technical slug, separate from its public display name.
Existing `lms` remains the technical slug for Oxinov Edu; a brand rename alone does not rename imports, databases or deployments.
Avoid generic slugs such as `app2`, `new-product` or dates.

Create only components justified by an approved scope:

| Component | Established location |
| --- | --- |
| Web client | `frontend/products/<slug>-web/` |
| Mobile client | `frontend/mobile/<slug>/` |
| Product API | `backend/products/<slug>-api/` |
| Product worker | `backend/products/<slug>-worker/` |
| Product database assets | `database/products/<slug>/` |
| API/event contracts | `packages/contracts/<slug>/` |
| Additional product guides | `docs/products/<slug>/` when the charter alone becomes insufficient |

The API, database and tenant boundaries remain governed by the target architecture. A service offering without software does not require these components.
Shared reusable libraries go into `packages/` only when their responsibility is stable; never put one product's business rules there simply to shorten imports.
Hardware or other new repository shapes need a recorded decision rather than an improvised `misc/` directory.

## Product lifecycle and registration

1. Record an idea as a candidate in the appropriate charter or research portfolio, with an owner explicitly marked unassigned when unknown.
2. Use the [product record template](../products/PRODUCT-RECORD-TEMPLATE.md) to record scope, product kind, dependencies and canonical links.
3. Obtain the existing release-gate approval before scaffolding product code, databases or deployments. A registry row is not approval.
4. Add only the approved components, with a README, checks and an operational owner. Record actual paths and any legacy exceptions.
5. Register release evidence separately from implementation status. CI passing does not establish all business readiness criteria.
6. On retirement, preserve the charter and decision history; record replacement, data-retention obligations and shutdown evidence. Remove executable components only through a reviewed migration.

Use lifecycle values consistently: **Candidate → Approved → In development → Pilot → Live → Retired**.
Existing draft charters map to Candidate. Do not advance status without evidence and owner sign-off; requirement statuses remain governed by the requirements standard.

## Document metadata and maintenance

For new or materially revised product documents, record: product slug, display name, kind, accountable owner, lifecycle, last review date, next review trigger, source of approval and canonical links.
Do not manufacture owner names or approval dates. Use `Unassigned`, `Not approved` or `Not verified` where appropriate.

- Directory READMEs explain purpose, contents, dependencies, validation and relevant external storage references.
- Product register rows sort by display name; file indexes sort by path; migrations remain chronological.
- Use descriptive subject names; avoid `final-v2-new` copies. Git records versions; ADRs preserve decisions.
- Review the register and documentation when adding a component, changing an owner, renaming a brand, deploying a release or retiring a product.
- Run catalog generation and documentation/workspace validation after changes. The catalog automatically discovers new non-ignored paths, without a hard-coded list of product names.

## Compatibility and rollback

Edu's existing paths remain documented exceptions until a dedicated tested migration. Do not move shared documents while another agent is active.
This standard and template add navigation and operating guidance only. Rollback removes their register/map links and documents, then regenerates the catalog; no service or database migration is required.
