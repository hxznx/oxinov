# Oxinov company platform blueprint

## Purpose

Oxinov Platform is the digital foundation for Ox inov Pvt. Ltd. and its product portfolio. It gives customers one Oxinov account, one company portal, a consistent trust and billing layer, and access to separately operated products under `oxinov.com`.

Oxinov Edu is the first product. The company objectives also identify future work in artificial intelligence, engineering, cloud and cybersecurity services, robotics and automation, IoT and electronics, media production, AgriTech, space technology, research, education, and production. These business areas are a portfolio roadmap. They are not requirements to place every capability in one application or release.

## Product model

Use three layers:

1. **Company presence:** public company, product, research, careers, newsroom, contact, and legal pages.
2. **Platform control plane:** identity, organizations, product catalogue, subscriptions, entitlements, billing records, notifications, support, audit, consent, and the customer product launcher.
3. **Product planes:** Oxinov Edu and each later product own their workflows, APIs, deployments, and product data.

Beneath all three layers is a cross-cutting **research evidence foundation**. User and product research validates needs, journeys, language, accessibility, trust, and live outcomes; technical R&D validates uncertain capabilities. The foundation is a decision process, not a shared runtime service or database. Every product follows the [user-centred product standard](../research/USER-CENTERED-PRODUCT-STANDARD.md).

The control plane knows that a person or organization can use a product. It does not own the product's lessons, robot telemetry, media projects, agricultural observations, or research datasets.

## Portfolio and release order

| Product or capability | Customer value | Platform treatment | Release position |
| --- | --- | --- | --- |
| Oxinov company website | Explain the company, products, research, services, and contact routes | Public frontend with managed content | First |
| Oxinov account portal | One login, organization switcher, product launcher, plans, invoices, support, and privacy controls | Shared control plane | First |
| Oxinov Edu | Multi-tenant language, SSW, IT, exam, media, assignment, chat, and administration platform | First independent product plane | First |
| [Oxinov HR](../products/hr/README.md) | Verified HR network, managed recruitment, direct job discovery, applications, and skill matching linked to Edu certificates | One unified `hr` product plane; direct hiring absorbs the former standalone Jobs plan (ADR-025) | Second product after Edu |
| [Oxinov Market](../requirements/frd/MARKET-FRD.md) | Verified marketplace for agricultural produce, raw materials, commercial machinery, and circular second-hand goods | Independent `market` product plane; Commodity Market charter remains the source (ADR-010, ADR-013, ADR-026) | Proposed FRD; future candidate after HR |
| [Oxinov Services Market](../requirements/frd/SERVICES-MARKET-FRD.md) | Book verified local service providers or post service needs | Independent `services` product plane; adopted Flo Softwares concept (ADR-010) | Proposed FRD; future candidate |
| Oxinov AI | AI tools, model services, evaluation, and governed agent capabilities | Independent product; reuse identity, billing, audit, and AI gateway | After platform foundation |
| [Oxinov Tech](../requirements/frd/TECH-FRD.md) | Software, cloud, networking, cybersecurity, consulting, and managed-service delivery | Begin as a client portal module; product plane requires a later ADR | Proposed definition; after platform foundation |
| Oxinov Robotics and IoT | Device management, telemetry, automation, laboratories, and customer projects | Independent device and telemetry platform | Later pilot |
| [Oxinov Studio](../requirements/frd/STUDIO-FRD.md) | Production projects, media assets, licensing, review, and client delivery | Future media product; broadcasting excluded | Proposed FRD; later pilot |
| [Oxinov JP](../requirements/frd/JP-FRD.md) | Guided Japan learning-to-work journey using consented Edu and HR records | Cross-product portal, not a duplicate system of record | Proposed definition; owner validation required |
| Oxinov AgriTech | Farm operations, sensing, analytics, traceability, and pilots | Independent product with device integration | Later pilot |
| Oxinov Research and Space | Research portfolio, publications, intellectual property, data, and regulated programs | Separate restricted systems where required | Long horizon |

New product planes require a product owner, customer problem, revenue or strategic outcome, data classification, regulatory review, operational owner, and a funded release plan before implementation.

Research may investigate opportunities before a product release gate, but it follows the [R&D operating system](../research/README.md): named ownership, a time-boxed hypothesis, reproducible evidence, safe data and environments, IP and regulatory review, and an explicit stop, continue, pivot, or transfer decision. Research status never authorizes a customer launch, product subdomain, production data access, or product-plane scaffold.

## Strategic pillars on oxinov.com

The incorporation objectives define ten strategic pillars. Every pillar gets a public division page on the company website from Phase 1. A pillar gets its own application subdomain only after one of its products passes the release gate.

| Pillar | Public page | Application address | Status |
| --- | --- | --- | --- |
| Oxinov Education | `oxinov.com/education` | `edu.oxinov.com` (Oxinov Edu) | First product |
| Oxinov AI | `oxinov.com/ai` | `ai.oxinov.com` after release gate | Future initiative |
| Oxinov Engineering | `oxinov.com/engineering` | Service portal module in `app.oxinov.com` | Future initiative |
| Oxinov Services | `oxinov.com/services` | `hr.oxinov.com` (Oxinov HR) after its unified release gate; `services.oxinov.com` (Oxinov Services Market) after its release gate; client portal module in `app.oxinov.com` | HR candidate; other services future |
| Oxinov Robotics & Automation | `oxinov.com/robotics` | `iot.oxinov.com` device platform after release gate | Future initiative |
| Oxinov Media & Studio | `oxinov.com/studio` | `studio.oxinov.com` after release gate | Future initiative |
| Oxinov AgriTech | `oxinov.com/agritech` | `market.oxinov.com` (Oxinov Commodity Market) after release gate | Future initiative |
| Oxinov Space | `oxinov.com/space` | Separate restricted system when approved | Long horizon, regulated |
| Oxinov Research | `oxinov.com/research` | Publications and IP pages on the company site | Long horizon |
| Oxinov Production | `oxinov.com/production` | Company site content only | Long horizon |

Regulated activities (broadcasting, space, aviation/drones, education approvals, import/export) are shown as future initiatives and are not offered to customers until the applicable approvals exist.

## Candidate modules by pillar

These are candidate product modules derived from the incorporation objectives. They are a backlog of options, not approved scope. Each module must pass the release gate below before implementation. Modules marked **Regulated** additionally require the named licence or approval before customer launch.

| Pillar | Candidate module | Summary | Notes |
| --- | --- | --- | --- |
| Education | Oxinov Edu | Courses, exams, assignments, certificates | In development (first product) |
| Education | Oxinov Academy | Bootcamps and professional training programs | Education approvals where applicable |
| Education | Virtual Labs | Online practice environments for robotics, IoT, networking, and cloud | |
| Services / Education | [Oxinov HR direct hiring](../products/hr/README.md) | Jobs, internships, applications, verified recruiters, and skill matching | Unified HR module (ADR-025); absorbs the former Jobs plan and Internship and Fellowship Portal |
| AI | AI Studio | Business chat, document Q&A, and AI tools | Uses the shared AI gateway |
| AI | Model Hub and AI API | Hosted vision, speech, and Nepali language models | |
| AI | Data Labeling Platform | Dataset creation and annotation | Privacy and copyright review |
| AI | AI Agents | Governed business automation assistants | Typed actions only |
| Engineering | Cloud and Hosting Panel | Customer hosting, domains, backups | Licensing review for hosting and domain services |
| Engineering | Cybersecurity Services | Audits and monitoring dashboards | |
| Engineering | Business SaaS | ERP, CRM, and e-commerce for Nepali businesses | |
| Services | [Oxinov Services Market](../products/SERVICES-MARKET.md) | Book verified local service providers | Draft charter (ADR-010) |
| Services | Client Project Portal | Quotes, contracts, project progress, invoices | |
| Services | Support Desk | Tickets and managed-service requests | |
| Services | R&D-as-a-Service | Intake for custom research projects | |
| Robotics & Automation | IoT Device Cloud | Device registry, telemetry, alerts | Shared by robotics, automation, and AgriTech |
| Robotics & Automation | Automation Dashboard | Factory monitoring, digital twins, predictive maintenance | |
| Robotics & Automation | Robotics Kit Store | Educational kits linked to LMS courses | |
| Media & Studio | Studio Booking | Animation, music, video, and podcast production | |
| Media & Studio | Media Asset Manager | Client file storage and delivery | |
| Media & Studio | Oxinov Stream | Educational and cultural streaming | **Regulated:** broadcasting authorization |
| Media & Studio | Dubbing and Subtitling | Nepali and multilingual localization | |
| AgriTech & Production | [Oxinov Commodity Market](../products/COMMODITY-MARKET.md) | Agricultural crops, industrial raw materials, commercial machinery, and circular second-hand listings | Draft charter (ADR-010) |
| AgriTech | Farm Management App | Crops, irrigation, and costs | |
| AgriTech | Smart Irrigation and Soil Sensing | Sensor-driven irrigation | Uses the IoT Device Cloud |
| AgriTech | Crop AI | Disease detection and yield prediction | |
| AgriTech | Supply-chain Traceability | Farm-to-market tracking | |
| Space | Earth Observation Portal | Satellite imagery for agriculture, disasters, and mapping | Data licensing review |
| Space | Geospatial Data Service | GIS maps and analytics | |
| Space | Mission Simulation Software | Education and research simulation | **Regulated:** real satellites or ground stations need government approval |
| Research | Publications and Reports | Research papers and technical reports | Company site content |
| Research | IP Portfolio | Patents and licensable technology | |
| Research | Innovation Lab and Incubator Portal | Startup applications and challenge programs | |
| Production | Product Catalog and Store | Electronics, IoT devices, kits | |
| Production | Order and Warranty Tracking | Repairs and after-sales support | |
| Production | B2B Import/Export Portal | Technology trade | **Regulated:** trade and customs permissions |

### Suggested evaluation order

| Order | Module | Reason |
| --- | --- | --- |
| 1 | Company website, identity, and account portal | Every product depends on them |
| 2 | Oxinov Edu | Existing product |
| 3 | Oxinov Commodity Market | Most complete adopted concept; expanded to all commodities and circular second-hand trade (ADR-010) |
| 4 | Oxinov HR | Connects Oxinov Edu graduates to employers and supports verified professional recruitment (ADR-025) |
| 5 | Oxinov Services Market | Reuses shared KYC, bookings, and payments (ADR-010) |
| 6 | Client Project Portal | Services revenue for Oxinov's own consulting |
| 7 | AI Studio and AI API | Market demand; reuses LMS content and the AI gateway |
| 8 | IoT Device Cloud | Foundation for robotics, automation, and AgriTech sensing |
| 9 | Farm Management App and Crop AI | Builds on Commodity Market users and the IoT Device Cloud |
| 10 | Studio Booking and Media Asset Manager | Reuses the LMS media pipeline |
| Later | Space, streaming, and import/export modules | Require licences and dedicated teams |

The order is a recommendation, not a commitment. Select the next module using customer evidence, and do not implement several new modules concurrently without teams that can own them.

## Customer and organization model

- A person has one Oxinov identity, signs in with Google or an email one-time code, and can belong to several customer organizations. See [identity and access](../architecture/IDENTITY-AND-ACCESS.md).
- First sign-in automatically grants a free member entitlement to every launched product; paid plans and organization seats add further entitlements.
- Actions that affect other people or move money require a higher trust level (verified phone, individual KYC, or business KYC) and acceptance of the relevant product-role policy. See [platform policies](PLATFORM-POLICIES.md).
- Plans follow one ladder (Free, Plus, Pro, Business, Enterprise). Oxinov One unlocks paid tiers across all products; `oxinov.com/pricing` governs every plan. See the [subscription model](SUBSCRIPTION-MODEL.md).
- An organization can subscribe to several Oxinov products.
- Product roles remain product-specific. An Edu instructor or Commodity Market seller does not automatically gain a role in another product.
- Oxinov staff access uses separate roles, MFA, time-limited support elevation, justification, and audit events.

## Domain plan

| Address | Purpose |
| --- | --- |
| `oxinov.com` and `www.oxinov.com` | Company website and product discovery |
| `app.oxinov.com` | Account portal and product launcher |
| `id.oxinov.com` | Central sign in and account security |
| `api.oxinov.com` | Public API gateway and versioned APIs |
| `edu.oxinov.com` | Oxinov Edu web application |
| `hr.oxinov.com` | Oxinov HR, including direct job discovery at `/jobs`, after its unified release gate |
| `market.oxinov.com` | Oxinov Commodity Market, after its release gate (alias `commodity.oxinov.com`) |
| `services.oxinov.com` | Oxinov Services Market, after its release gate |
| `oxinov.com/pricing` | Plans and prices for all products |
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
- Manage research as a balanced portfolio with evidence gates, protected core-product capacity, reproducible experiment records, and explicit transfer into an approved product owner. Track candidate work in the [R&D portfolio](../research/PORTFOLIO.md).

## First platform release

The first release is successful when a visitor can discover Oxinov and Oxinov Edu, create or use one Oxinov account, open the account portal, create or join an organization, see entitled products, launch Oxinov Edu, and return to the portal without signing in again. Operations must have backups, metrics, logs, traces, security events, and audited administrator access.
