# Oxinov product charters

Each Oxinov product plane has a charter before implementation starts. A charter records the owner, customer problem, scope, exclusions, data classification, regulatory review, architecture boundary, success metrics, and release gate status defined in the [company blueprint](../company/PLATFORM-BLUEPRINT.md).

| Product | Address | Pillar | Origin | Charter status |
| --- | --- | --- | --- | --- |
| OxinovLMS | `lms.oxinov.com` | Education | Oxinov | Approved (existing FRD in `docs/02-FRD.md`) |
| [Oxinov Commodity Market](COMMODITY-MARKET.md) | `market.oxinov.com` | Production & Trade / AgriTech | Flo Softwares concept (`comodity-market`, `BT-Bazz-ComodityMarket-server`) expanded to all commodities & second-hand items ([Agri Market](AGRI-MARKET.md) superseded) | Draft |
| [Oxinov Jobs](JOBS.md) | `jobs.oxinov.com` | Education | Flo Softwares concept (`hr-backend`, `hr-frontend`) | Draft |
| [Oxinov Services Market](SERVICES-MARKET.md) | `services.oxinov.com` | Services | Flo Softwares concept (`service-platform`, `service-platform-frontend`) | Draft |

A draft charter does not authorize scaffolding product folders, databases, or deployments. The product moves to implementation only after every release-gate item is resolved and recorded here. See [ADR-010](../architecture/ADR.md#adr-010-adopt-flo-softwares-marketplace-concepts-as-oxinov-product-planes) for the adoption rules that apply to all three Flo Softwares concepts.

## Shared rules for all products

- Every product has its own frontend, backend, and database following the [product plane template](../engineering/COMPANY-PROJECT-STRUCTURE.md#product-plane-template).
- Users sign in once with their Oxinov account and reach every launched product without signing up again. Each charter lists the trust level and policy required for each action, per [identity and access](../architecture/IDENTITY-AND-ACCESS.md) and [platform policies](../company/PLATFORM-POLICIES.md).
- Every product is based on continuous user research. Its charter links observed evidence to user needs and critical journeys; implementation and release require representative usability, accessibility, device, network, trust, recovery, and support evidence under the [user-centred product standard](../research/USER-CENTERED-PRODUCT-STANDARD.md).

## Shared rules for adopted products

- Rebuild on the Oxinov stack and patterns. Source repositories are reference material for requirements, data models, screens, and business rules; their code is not copied in unreviewed.
- Use the shared identity, organizations, entitlements, KYC, payments ledger, notifications, messaging, file storage, and audit services from the platform control plane. Products do not ship their own login, OTP, password reset, wallet, or KYC tables.
- Training, courses, exams, and certifications belong to OxinovLMS. Other products link to LMS certificates through a versioned API.
- Each product owns its database, migrations, row-level security policies, workers, dashboards, alerts, runbooks, and release lifecycle.
