# Oxinov company platform roadmap

The order in which Oxinov builds the company, from governance and the public website to shared platform services and product pilots. Read it before you plan work that crosses products or needs a company decision.

**Status:** Current · **Owner:** Founder · **Last reviewed:** 2026-09-28

## How to read this roadmap

- The phases are an order of work, not promised dates. A phase starts when the phase before it no longer blocks it, and several phases can be in progress at once.
- The "Progress" line under each phase states only what [current state](../04-architecture/current-state.md) or the [changelog](changelog.md) confirms. Everything else is planned.
- Product roadmaps live with their product, for example the [Edu roadmap](../02-products/edu/edu-roadmap.md). Open work items are in [tasks](tasks.md), and open decisions are in [risks and decisions](risks.md).

## Phase 0: portfolio and governance

- Approve product names, owners, target customers, launch countries, and data classifications.
- Confirm ownership of `oxinov.com`, DNS, email, trademarks, brand assets, and required Nepal regulatory advice.
- Record AWS Mumbai as the primary deployment decision; approve AWS account ownership, budgets, production sizing, identity operations, payment providers, privacy policy, and support model.
- Create measurable first-release objectives and a cost ceiling.
- Establish the [R&D operating system](../12-research/README.md): appoint the portfolio roles, approve a quarterly capacity ceiling and horizon mix, screen the [candidate portfolio](../12-research/portfolio.md), and authorize no more than three first-wave research briefs.

**Progress:** AWS Mumbai is the production Region (ADR-009, ADR-017). The monthly AWS budget is US$50 with Terraform-managed alerts (NFR-18). Khalti and eSewa are the selected payment providers for Oxinov's own courses (ADR-023). Owners, launch markets, and R&D roles are still open ([risks and decisions](risks.md)).

## Phase 1: company presence

- Build `oxinov.com` with company, product, research, services, careers, contact, privacy, terms, and security contact pages.
- Establish the design system, content workflow, analytics consent, accessibility checks, SEO metadata, and secure contact handling.
- Publish only real products and capabilities; label research and future initiatives accurately.

**Progress:** `oxinov.com` is live on S3 and CloudFront, with SEO, accessibility, link, and product-status tests in CI ([current state](../04-architecture/current-state.md), [SEO](../13-marketing/seo/README.md)). The site loads no analytics, so analytics consent is not needed today. Legal review of the policy pages is still open ([tasks](tasks.md)).

## Phase 2: platform foundation

- Build `id.oxinov.com`, `app.oxinov.com`, the gateway, platform API, and platform PostgreSQL database.
- Implement identity linking, MFA, organizations, invitations, memberships, product catalogue, entitlements, audit, privacy controls, and support access.
- Add provider-neutral payment, notification, object-storage, and AI adapters.
- Add shared individual and organization KYC (know your customer), conversations and messaging, and reviews primitives required by the adopted marketplace products (ADR-010).
- Add OpenTelemetry, dashboards, alerts, backups, restore tests, SIEM (security information and event management) events, CI security gates, and runbooks.

**Progress:** `id.oxinov.com` (Keycloak, email one-time codes) and the `app.oxinov.com` foundation (`platform-web`, `platform-api`, `oxinov_platform` database) are live. The platform slice covers accounts, policy acceptance, the product catalogue, and entitlements. Staff MFA for Keycloak administrators, nightly backups, CloudWatch alarms, and Trivy gates are in place. The gateway, OpenTelemetry, SIEM, restore tests, KYC, and messaging are planned.

## Phase 3: Oxinov Edu integration

- Connect existing Edu identities to the shared OIDC provider.
- Map Edu workspaces to platform organizations or individual owners.
- Enforce product entitlements at the gateway and Edu boundary.
- Add portal-to-Edu launch and Edu-to-portal navigation without another sign-in.
- Complete the existing Edu web, mobile, payments, media, chat, AI, and launch backlog.

**Progress:** started. Edu is live at `edu.oxinov.com`. The changelog records single sign-on into Edu (FR-ID-2207), the portal app launcher, and footers that link Edu and the portal back to the company website. The platform product key is `edu` (ADR-027). Paid checkout with Khalti and eSewa is built but off in production until the owner enters provider keys (ADR-023). Mobile, chat, and AI have not started ([Edu roadmap](../02-products/edu/edu-roadmap.md)).

## Phase 4: commercial readiness

- Integrate eligible Nepal payment providers using verified server-side confirmation.
- Add the plan and entitlement catalogue, Oxinov One, usage metering, prepaid Nepal billing, and app-store receipt verification per the [subscription model](../01-company/subscription-model.md) (ADR-012).
- Add plans, invoices, refunds, reconciliation, tax handling, customer support, status page, and service-level reporting.
- Complete security, privacy, accessibility, disaster recovery, load, and incident exercises.
- Launch to a small controlled customer group and measure activation, reliability, support load, and unit cost.

**Progress:** server-side payment verification for Khalti and eSewa is built for Edu (ADR-023). Everything else in this phase is planned.

## Phase 5: additional product pilots

- Deliver the current product modules one at a time: Oxinov Edu first, then unified [Oxinov HR](../02-products/hr/README.md) when its release gate closes. Oxinov Market (the website calls it Commodity Market) and Oxinov Services Market remain future candidates (ADR-010, ADR-025).
- Before the first of them: confirm written rights to the Flo Softwares code, designs, and names, and rotate secrets committed to those repositories.
- Select any further product using customer evidence and company strategy.
- Approve its product charter, product owner, budget, architecture boundary, regulatory assessment, data policy, and exit criteria.
- Reuse the platform control plane and build an independent product plane.
- Do not start several new product implementations concurrently without teams that can own them.

**Progress:** not started. Oxinov HR has a unified FRD and product record only; nothing is built or public (ADR-025).

## First 30 days

These actions were set as the first month's work. The roadmap records no start date, so none of them has a due date.

| # | Action | Status |
| --- | --- | --- |
| 1 | Decide the first customer segment and launch country for Oxinov Edu. | Open |
| 2 | Confirm the domain registrar and DNS owner and inventory existing email and cloud accounts. | Open |
| 3 | Create the AWS organization and account plan, budgets, billing alerts, deployment roles, and OIDC operations ownership. | Partly done: budget alerts and GitHub OIDC deploy roles are live ([current state](../04-architecture/current-state.md)) |
| 4 | Apply for Khalti and eSewa merchant access or record the selected payment alternative. | Providers selected (ADR-023); merchant keys not yet entered in production |
| 5 | Create company brand assets and approve public legal pages. | Brand assets exist ([brand](../07-design/brand.md)); legal review open |
| 6 | Scaffold the company website and platform control plane through the reviewed AI command. | Done: both are live |
| 7 | Keep the Edu backlog moving behind stable platform contracts. | Ongoing |
| 8 | Assign R&D governance roles and approve or reject the proposed first-wave experiments without delaying the platform and Edu commitments. | Open |

## Release gate for every new product

A product enters implementation only when it has all of the following, and then follows the [user-centred product standard](../12-research/user-centered-product-standard.md) through discovery, prototype, beta, launch, and live improvement:

- an accountable owner
- observed user evidence and evidence-backed needs
- validated critical journeys
- usability and accessibility measures
- scope exclusions and success metrics
- pricing or strategic justification
- data classification and regulatory review
- an architecture boundary
- an operations and support plan
- a delivery budget
- an approved stop or continue checkpoint
