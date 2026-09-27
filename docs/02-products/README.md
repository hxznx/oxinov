# Oxinov product charters

This is the company offering register, independent of technical folder layout. Use the
[company library standard](../08-engineering/company-library-standard.md) and
[product record template](product-record-template.md) for future software, service, hardware or content offerings.
Research candidates remain in the research portfolio until approved for product transfer.

Each Oxinov product plane has a charter before implementation starts. A charter records the owner, customer problem, scope, exclusions, data classification, regulatory review, architecture boundary, success metrics, and release gate status defined in the [company blueprint](../01-company/platform-blueprint.md).

| Product | Address | Pillar | Origin | Charter status |
| --- | --- | --- | --- | --- |
| [Oxinov Market](market/market-charter.md) | `market.oxinov.com` | Production & Trade / AgriTech | Flo Softwares concept (`comodity-market`, `BT-Bazz-ComodityMarket-server`) expanded to all commodities & second-hand items ([Agri Market](market/market-charter.md) superseded) | Draft charter and [proposed FRD](../03-requirements/frd/market-frd.md) |
| [Oxinov Edu](edu/README.md) | `edu.oxinov.com` | Education | Oxinov | Approved and live ([FRD](../03-requirements/frd/edu-frd.md)); technical slug `edu` (ADR-027) |
| [Oxinov HR](hr/README.md) | `hr.oxinov.com` | Services / talent | Oxinov plus adopted Flo Softwares HR/jobs concept | Candidate unified product: direct-hiring requirements approved; managed recruitment proposed ([FRD](../03-requirements/frd/hr-frd.md), ADR-025) |
| [Oxinov Services Market](services-market/services-market-charter.md) | `services.oxinov.com` | Services | Flo Softwares concept (`service-platform`, `service-platform-frontend`) | Draft charter and [proposed FRD](../03-requirements/frd/services-market-frd.md) |
| Oxinov Studio | Future | Media & Studio | Owner-requested requirements draft | Requirements-only candidate ([FRD](../03-requirements/frd/studio-frd.md)); charter and release gate pending |
| Oxinov JP | To be decided | Cross-product Edu / HR | Owner-requested requirements draft | Requirements-only candidate ([FRD](../03-requirements/frd/jp-frd.md)); definition, charter, and release gate pending |
| Oxinov Tech | Portal module unless later approved | Engineering / Services | Owner-requested requirements draft | Requirements-only candidate ([FRD](../03-requirements/frd/tech-frd.md)); definition, charter, and release gate pending |

A draft charter does not authorize scaffolding product folders, databases, or deployments. The product moves to implementation only after every release-gate item is resolved and recorded here. See [ADR-010](../04-architecture/adr/adr-010-flo-softwares-adoption.md) and its consolidation amendment [ADR-025](../04-architecture/adr/adr-025-two-products-edu-hr.md).

## Shared rules for all products

### Current implementation locations

| Offering | Technical slug | Canonical implementation / evidence |
| --- | --- | --- |
| Oxinov Market | `market` | Draft charter and proposed FRD above; no application scaffold authorized |
| Edu | `edu` | [Product record](edu/README.md), [web](../../frontend/products/edu-web/README.md), [API](../../backend/products/edu-api/README.md), [database](../../database/products/edu/README.md), [release history](../11-planning/changelog.md) |
| HR and direct hiring | `hr` | [Product record](hr/README.md); unified FRD only, no application scaffold exists |
| Services Market | `services` | Draft charter and proposed FRD above; no application scaffold authorized |
| Studio | `studio` | Proposed FRD only; no application scaffold authorized |
| JP | `jp` | Reserved in the proposed FRD; no address or application scaffold authorized |
| Tech | `tech` | Reserved in the proposed FRD; expected to begin in the account portal, no application scaffold authorized |

These are location and charter records, not assertions that every release condition is satisfied.
Future non-software offerings use the same register but do not require an application merely to exist.

### Product plane rules

- Every product has its own frontend, backend, and database following the [product plane template](../08-engineering/company-project-structure.md#product-plane-template).
- Users sign in once with their Oxinov account and reach every launched product without signing up again. Each charter lists the trust level and policy required for each action, per [identity and access](../04-architecture/identity-and-access.md) and [platform policies](../01-company/platform-policies.md).
- Every product is based on continuous user research. Its charter links observed evidence to user needs and critical journeys; implementation and release require representative usability, accessibility, device, network, trust, recovery, and support evidence under the [user-centred product standard](../12-research/user-centered-product-standard.md).

## Shared rules for adopted products

- Rebuild on the Oxinov stack and patterns. Source repositories are reference material for requirements, data models, screens, and business rules; their code is not copied in unreviewed.
- Use the shared identity, organizations, entitlements, KYC, payments ledger, notifications, messaging, file storage, and audit services from the platform control plane. Products do not ship their own login, OTP, password reset, wallet, or KYC tables.
- Training, courses, exams, and certifications belong to Oxinov Edu. Other products link to Edu certificates through a versioned API.
- Each product owns its database, migrations, row-level security policies, workers, dashboards, alerts, runbooks, and release lifecycle.
