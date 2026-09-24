# Oxinov company platform blueprint

## Purpose

Oxinov Platform is the digital foundation for Oxinov Pvt. Ltd. and its product portfolio. It gives customers one Oxinov account, one company portal, a consistent trust and billing layer, and access to separately operated products under `oxinov.com`.

OxinovLMS is the first product. The company objectives also identify future work in artificial intelligence, engineering, cloud and cybersecurity services, robotics and automation, IoT and electronics, media production, AgriTech, space technology, research, education, and production. These business areas are a portfolio roadmap. They are not requirements to place every capability in one application or release.

## Product model

Use three layers:

1. **Company presence:** public company, product, research, careers, newsroom, contact, and legal pages.
2. **Platform control plane:** identity, organizations, product catalogue, subscriptions, entitlements, billing records, notifications, support, audit, consent, and the customer product launcher.
3. **Product planes:** OxinovLMS and each later product own their workflows, APIs, deployments, and product data.

The control plane knows that a person or organization can use a product. It does not own the product's lessons, robot telemetry, media projects, agricultural observations, or research datasets.

## Portfolio and release order

| Product or capability | Customer value | Platform treatment | Release position |
| --- | --- | --- | --- |
| Oxinov company website | Explain the company, products, research, services, and contact routes | Public frontend with managed content | First |
| Oxinov account portal | One login, organization switcher, product launcher, plans, invoices, support, and privacy controls | Shared control plane | First |
| OxinovLMS | Multi-tenant language, SSW, IT, exam, media, assignment, chat, and administration platform | First independent product plane | First |
| Oxinov AI | AI tools, model services, evaluation, and governed agent capabilities | Independent product; reuse identity, billing, audit, and AI gateway | After platform foundation |
| Oxinov Engineering and Services | Software, cloud, networking, cybersecurity, consulting, and managed services | Service portal and project operations module | After platform foundation |
| Oxinov Robotics and IoT | Device management, telemetry, automation, laboratories, and customer projects | Independent device and telemetry platform | Later pilot |
| Oxinov Media and Studio | Production projects, media assets, licensing, streaming, and client delivery | Independent media product | Later pilot |
| Oxinov AgriTech | Farm operations, sensing, analytics, traceability, and pilots | Independent product with device integration | Later pilot |
| Oxinov Research and Space | Research portfolio, publications, intellectual property, data, and regulated programs | Separate restricted systems where required | Long horizon |

New product planes require a product owner, customer problem, revenue or strategic outcome, data classification, regulatory review, operational owner, and a funded release plan before implementation.

## Customer and organization model

- A person has one Oxinov identity and can belong to several customer organizations.
- An organization can subscribe to several Oxinov products.
- A product entitlement authorizes access to a specific product and plan.
- Product roles remain product-specific. An LMS instructor does not automatically become an administrator in another product.
- Consumer access can exist without an organization when a product requires it, but authorization still uses explicit entitlements.
- Oxinov staff access uses separate roles, MFA, time-limited support elevation, justification, and audit events.

## Domain plan

| Address | Purpose |
| --- | --- |
| `oxinov.com` and `www.oxinov.com` | Company website and product discovery |
| `app.oxinov.com` | Account portal and product launcher |
| `id.oxinov.com` | Central sign in and account security |
| `api.oxinov.com` | Public API gateway and versioned APIs |
| `lms.oxinov.com` | OxinovLMS web application |
| `status.oxinov.com` | Public service status |
| `docs.oxinov.com` | Customer and developer documentation when required |

Future products receive a subdomain only after they pass their release gate. Customer LMS domains continue to use verified subdomains or custom domains without changing the company portal model.

## Platform principles

- Start with modular applications and a small number of deployable services. Extract a service only for independent scaling, security, reliability, data ownership, or team ownership.
- Use documented APIs and events between the control plane and product planes. Do not read another product's database directly.
- Give every product an owner, service-level objectives, data retention rules, incident procedures, and cost reporting.
- Share design tokens, identity libraries, API contracts, observability, security event contracts, and infrastructure modules. Do not share product business tables.
- Use an adapter for identity, payments, storage, notifications, media, and AI providers so provider eligibility and regional needs do not rewrite product logic.
- Keep regulated aerospace, broadcasting, education, financial, import/export, and other activities behind legal and operational approval gates.

## First platform release

The first release is successful when a visitor can discover Oxinov and OxinovLMS, create or use one Oxinov account, open the account portal, create or join an organization, see entitled products, launch OxinovLMS, and return to the portal without signing in again. Operations must have backups, metrics, logs, traces, security events, and audited administrator access.
