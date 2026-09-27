# Oxinov product charters

This is the company offering register, independent of technical folder layout. Use the
[company library standard](../engineering/COMPANY-LIBRARY-STANDARD.md) and
[product record template](PRODUCT-RECORD-TEMPLATE.md) for future software, service, hardware or content offerings.
Research candidates remain in the research portfolio until approved for product transfer.

Each Oxinov product plane has a charter before implementation starts. A charter records the owner, customer problem, scope, exclusions, data classification, regulatory review, architecture boundary, success metrics, and release gate status defined in the [company blueprint](../company/PLATFORM-BLUEPRINT.md).

| Product | Address | Pillar | Origin | Charter status |
| --- | --- | --- | --- | --- |
| [Oxinov Market](COMMODITY-MARKET.md) | `market.oxinov.com` | Production & Trade / AgriTech | Flo Softwares concept (`comodity-market`, `BT-Bazz-ComodityMarket-server`) expanded to all commodities & second-hand items ([Agri Market](AGRI-MARKET.md) superseded) | Draft charter and [proposed FRD](../requirements/frd/MARKET-FRD.md) |
| [Oxinov Edu](lms/README.md) | `edu.oxinov.com` | Education | Oxinov | Approved and live ([FRD](../requirements/frd/EDU-FRD.md)); internal technical slug remains `lms` |
| [Oxinov HR](hr/README.md) | `hr.oxinov.com` | Services / talent | Oxinov plus adopted Flo Softwares HR/jobs concept | Candidate unified product: direct-hiring requirements approved; managed recruitment proposed ([FRD](../requirements/frd/HR-FRD.md), ADR-025) |
| [Oxinov Services Market](SERVICES-MARKET.md) | `services.oxinov.com` | Services | Flo Softwares concept (`service-platform`, `service-platform-frontend`) | Draft charter and [proposed FRD](../requirements/frd/SERVICES-MARKET-FRD.md) |
| Oxinov Studio | Future | Media & Studio | Owner-requested requirements draft | Requirements-only candidate ([FRD](../requirements/frd/STUDIO-FRD.md)); charter and release gate pending |
| Oxinov JP | To be decided | Cross-product Edu / HR | Owner-requested requirements draft | Requirements-only candidate ([FRD](../requirements/frd/JP-FRD.md)); definition, charter, and release gate pending |
| Oxinov Tech | Portal module unless later approved | Engineering / Services | Owner-requested requirements draft | Requirements-only candidate ([FRD](../requirements/frd/TECH-FRD.md)); definition, charter, and release gate pending |

A draft charter does not authorize scaffolding product folders, databases, or deployments. The product moves to implementation only after every release-gate item is resolved and recorded here. See [ADR-010](../architecture/ADR.md#adr-010-adopt-flo-softwares-marketplace-concepts-as-oxinov-product-planes) and its consolidation amendment [ADR-025](../architecture/ADR.md#adr-024-two-product-modules-nowoxinov-edu-and-unified-oxinov-hr).

## Shared rules for all products

### Current implementation locations

| Offering | Technical slug | Canonical implementation / evidence |
| --- | --- | --- |
| Oxinov Market | `market` | Draft charter and proposed FRD above; no application scaffold authorized |
| Edu | `lms` | [Product record](lms/README.md), [web](../../frontend/products/lms-web/README.md), [API](../../backend/products/lms-api/README.md), [database](../../database/products/lms/README.md), [release history](../planning/CHANGELOG.md) |
| HR and direct hiring | `hr` | [Product record](hr/README.md); unified FRD only, no application scaffold exists |
| Services Market | `services` | Draft charter and proposed FRD above; no application scaffold authorized |
| Studio | `studio` | Proposed FRD only; no application scaffold authorized |
| JP | `jp` | Reserved in the proposed FRD; no address or application scaffold authorized |
| Tech | `tech` | Reserved in the proposed FRD; expected to begin in the account portal, no application scaffold authorized |

These are location and charter records, not assertions that every release condition is satisfied.
Future non-software offerings use the same register but do not require an application merely to exist.

### Product plane rules

- Every product has its own frontend, backend, and database following the [product plane template](../engineering/COMPANY-PROJECT-STRUCTURE.md#product-plane-template).
- Users sign in once with their Oxinov account and reach every launched product without signing up again. Each charter lists the trust level and policy required for each action, per [identity and access](../architecture/IDENTITY-AND-ACCESS.md) and [platform policies](../company/PLATFORM-POLICIES.md).
- Every product is based on continuous user research. Its charter links observed evidence to user needs and critical journeys; implementation and release require representative usability, accessibility, device, network, trust, recovery, and support evidence under the [user-centred product standard](../research/USER-CENTERED-PRODUCT-STANDARD.md).

## Shared rules for adopted products

- Rebuild on the Oxinov stack and patterns. Source repositories are reference material for requirements, data models, screens, and business rules; their code is not copied in unreviewed.
- Use the shared identity, organizations, entitlements, KYC, payments ledger, notifications, messaging, file storage, and audit services from the platform control plane. Products do not ship their own login, OTP, password reset, wallet, or KYC tables.
- Training, courses, exams, and certifications belong to Oxinov Edu. Other products link to LMS certificates through a versioned API.
- Each product owns its database, migrations, row-level security policies, workers, dashboards, alerts, runbooks, and release lifecycle.
