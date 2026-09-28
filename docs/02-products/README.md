# Oxinov products

The register of every Oxinov product and candidate offering, with its address, charter status, and where its documents and code live. Read it before you plan work on any product; it is independent of the technical folder layout.

**Status:** Current · **Owner:** Founder · **Last reviewed:** 2026-09-28

## How a product enters this register

- Each Oxinov product plane has a charter before implementation starts. A charter records the owner, customer problem, scope, exclusions, data classification, regulatory review, architecture boundary, success metrics, and release-gate status, as defined in the [company blueprint](../01-company/platform-blueprint.md).
- Future software, service, hardware, or content offerings use the [company library standard](../08-engineering/company-library-standard.md) and the [product record template](product-record-template.md).
- Research candidates stay in the research portfolio until they are approved for product transfer.
- A draft charter does not authorize product folders, databases, or deployments. A product moves to implementation only after every release-gate item is resolved and recorded here. See [ADR-010](../04-architecture/adr/adr-010-flo-softwares-adoption.md) and its consolidation amendment [ADR-025](../04-architecture/adr/adr-025-two-products-edu-hr.md).

## Product register

| Product | Address | Pillar | Origin | Charter status |
| --- | --- | --- | --- | --- |
| [Oxinov Edu](edu/README.md) | `edu.oxinov.com` | Education | Oxinov | Approved and live ([FRD](../03-requirements/frd/edu-frd.md)); technical slug `edu` (ADR-027) |
| [Oxinov HR](hr/README.md) | `hr.oxinov.com` | Services / talent | Oxinov plus the adopted Flo Softwares HR and jobs concept | Candidate unified product: direct-hiring requirements approved, managed recruitment proposed ([FRD](../03-requirements/frd/hr-frd.md), ADR-025) |
| [Oxinov Market](market/market-charter.md) | `market.oxinov.com` | Production & Trade / AgriTech | Flo Softwares concept (`comodity-market`, `BT-Bazz-ComodityMarket-server`), expanded to all commodities and second-hand items; the earlier [Agri Market](market/market-charter.md) scope is superseded (ADR-013) | Draft charter and [proposed FRD](../03-requirements/frd/market-frd.md) |
| [Oxinov Services Market](services-market/services-market-charter.md) | `services.oxinov.com` | Services | Flo Softwares concept (`service-platform`, `service-platform-frontend`) | Draft charter and [proposed FRD](../03-requirements/frd/services-market-frd.md) |
| Oxinov Studio | Future | Media & Studio | Owner-requested requirements draft | Requirements-only candidate ([FRD](../03-requirements/frd/studio-frd.md)); charter and release gate pending |
| Oxinov JP | To be decided | Cross-product Edu / HR | Owner-requested requirements draft | Requirements-only candidate ([FRD](../03-requirements/frd/jp-frd.md)); definition, charter, and release gate pending |
| Oxinov Tech | Portal module unless later approved | Engineering / Services | Owner-requested requirements draft | Requirements-only candidate ([FRD](../03-requirements/frd/tech-frd.md)); definition, charter, and release gate pending |

## Where each product lives

| Offering | Technical slug | Canonical implementation or evidence |
| --- | --- | --- |
| Oxinov Edu | `edu` | [Product record](edu/README.md), [web](../../frontend/products/edu-web/README.md), [API](../../backend/products/edu-api/README.md), [database](../../database/products/edu/README.md), [release history](../11-planning/changelog.md) |
| Oxinov HR, including direct hiring | `hr` | [Product record](hr/README.md); unified FRD only, no application scaffold exists |
| Oxinov Market | `market` | Draft charter and proposed FRD above; no application scaffold authorized |
| Oxinov Services Market | `services` | Draft charter and proposed FRD above; no application scaffold authorized |
| Oxinov Studio | `studio` | Proposed FRD only; no application scaffold authorized |
| Oxinov JP | `jp` | Reserved in the proposed FRD; no address or application scaffold authorized |
| Oxinov Tech | `tech` | Reserved in the proposed FRD; expected to begin in the account portal; no application scaffold authorized |

These rows record locations and charters. They do not claim that every release condition is met. Future non-software offerings use the same register and do not need an application just to exist.

## Rules for every product

- **Own product plane.** Every product has its own frontend, backend, and database, following the [product plane template](../08-engineering/company-project-structure.md#product-plane-template).
- **One account.** People sign in once with their Oxinov account and reach every launched product without signing up again. Each charter lists the trust level and policy that each action needs, per [identity and access](../04-architecture/identity-and-access.md) and [platform policies](../01-company/platform-policies.md).
- **Research first.** Every product rests on continuous user research. Its charter links observed evidence to user needs and critical journeys. Implementation and release need representative usability, accessibility, device, network, trust, recovery, and support evidence under the [user-centred product standard](../12-research/user-centered-product-standard.md).

## Rules for adopted products

- **Rebuild, do not copy.** Rebuild on the Oxinov stack and patterns. Source repositories are reference material for requirements, data models, screens, and business rules; their code is not copied in unreviewed.
- **Use the platform.** Use the shared identity, organizations, entitlements, KYC (know your customer), payments ledger, notifications, messaging, file storage, and audit services of the platform control plane. Products do not ship their own login, one-time password, password reset, wallet, or KYC tables.
- **Learning belongs to Edu.** Training, courses, exams, and certifications belong to Oxinov Edu. Other products link to Edu certificates through a versioned API.
- **Own your operations.** Each product owns its database, migrations, row-level security policies, workers, dashboards, alerts, runbooks, and release lifecycle.
