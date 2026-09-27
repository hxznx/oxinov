# Oxinov company platform roadmap

## Phase 0 Portfolio and governance

- Approve product names, owners, target customers, launch countries, and data classifications.
- Confirm ownership of `oxinov.com`, DNS, email, trademarks, brand assets, and required Nepal regulatory advice.
- Record AWS Mumbai as the primary deployment decision; approve AWS account ownership, budgets, production sizing, identity operations, payment providers, privacy policy, and support model.
- Create measurable first-release objectives and a cost ceiling.
- Establish the [R&D operating system](../research/README.md): appoint the portfolio roles, approve a quarterly capacity ceiling and horizon mix, screen the [candidate portfolio](../research/PORTFOLIO.md), and authorize no more than three first-wave research briefs.

## Phase 1 Company presence

- Build `oxinov.com` with company, product, research, services, careers, contact, privacy, terms, and security contact pages.
- Establish the design system, content workflow, analytics consent, accessibility checks, SEO metadata, and secure contact handling.
- Publish only real products and capabilities; label research and future initiatives accurately.

## Phase 2 Platform foundation

- Build `id.oxinov.com`, `app.oxinov.com`, the gateway, platform API, and platform PostgreSQL database.
- Implement identity linking, MFA, organizations, invitations, memberships, product catalogue, entitlements, audit, privacy controls, and support access.
- Add provider-neutral payment, notification, object-storage, and AI adapters.
- Add shared individual and organization KYC, conversations and messaging, and reviews primitives required by the adopted marketplace products (ADR-010).
- Add OpenTelemetry, dashboards, alerts, backups, restore tests, SIEM events, CI security gates, and runbooks.

## Phase 3 Oxinov Edu integration

- Connect existing LMS identities to the shared OIDC provider.
- Map LMS workspaces to platform organizations or individual owners.
- Enforce product entitlements at the gateway and LMS boundary.
- Add portal-to-LMS launch and LMS-to-portal navigation without another login.
- Complete the existing LMS web, mobile, payments, media, chat, AI, and launch backlog.

## Phase 4 Commercial readiness

- Integrate eligible Nepal payment providers using verified server-side confirmation.
- Add the plan and entitlement catalogue, Oxinov One, usage metering, prepaid Nepal billing, and app-store receipt verification per the [subscription model](../company/SUBSCRIPTION-MODEL.md) (ADR-012).
- Add plans, invoices, refunds, reconciliation, tax handling, customer support, status page, and service-level reporting.
- Complete security, privacy, accessibility, disaster recovery, load, and incident exercises.
- Launch to a small controlled customer group and measure activation, reliability, support load, and unit cost.

## Phase 5 Additional product pilots

- Deliver the current product modules one at a time: Oxinov Edu first, then unified [Oxinov HR](../products/hr/README.md) when its release gate closes. Commodity Market and Services Market remain future candidates (ADR-010, ADR-025).
- Before the first of them: confirm written rights to the Flo Softwares code, designs, and names, and rotate secrets committed to those repositories.
- Select any further product using customer evidence and company strategy.
- Approve its product charter, product owner, budget, architecture boundary, regulatory assessment, data policy, and exit criteria.
- Reuse the platform control plane and build an independent product plane.
- Do not start several new product implementations concurrently without teams that can own them.

## First 30 days

1. Decide the first customer segment and launch country for Oxinov Edu.
2. Confirm the domain registrar and DNS owner and inventory existing email and cloud accounts.
3. Create the AWS organization/account plan, budgets, billing alerts, deployment roles, and OIDC operations ownership.
4. Apply for Khalti and eSewa merchant access or record the selected payment alternative.
5. Create company brand assets and approve public legal pages.
6. Scaffold the company website and platform control plane through the reviewed AI command.
7. Keep the LMS backlog moving behind stable platform contracts.
8. Assign R&D governance roles and approve or reject the proposed first-wave experiments without delaying the platform and LMS commitments.

## Release gate for every new product

A product enters implementation only when it has an accountable owner, observed user evidence and evidence-backed needs, validated critical journeys, usability and accessibility measures, scope exclusions, success metrics, pricing or strategic justification, data classification, regulatory review, architecture boundary, operations and support plan, delivery budget, and an approved stop or continue checkpoint. It follows the [user-centred product standard](../research/USER-CENTERED-PRODUCT-STANDARD.md) through discovery, prototype, beta, launch, and live improvement.
