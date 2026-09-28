# Risks and open decisions

**Owner and due date:** assign before implementation of the affected feature. Open items are not silent defaults.

**Status:** Current · **Owner:** Founder · **Last reviewed:** 2026-09-29

## Decisions needed before final approval

| Decision | Why it matters |
| --- | --- |
| Product owner, customer, release gate, budget, and stop/continue checkpoint for each Oxinov product | Prevents the broad company objectives from becoming simultaneous unsupported software projects. |
| R&D executive sponsor, portfolio owner, reviewer independence, quarterly capacity ceiling, and core/adjacent/frontier allocation | Determines whether research is systematic and evidence-led without starving the platform, Oxinov Edu, security, support, or recovery work. |
| R&D participant, dataset, publication, partnership, and IP procedures | Required before research uses people, personal or tenant data, third-party datasets, university or industry partners, patentable work, or public claims. |
| Product-research owner, participant access, incentives, consent, secure research repository, and coverage across language, disability, digital confidence, device, and network contexts | Without these, Oxinov may build polished products around internal assumptions, miss excluded users, or collect research data without adequate protection. |
| Registrar/DNS ownership, subdomain map, company email, trademark/brand assets, and public legal-page owners | Required to operate `oxinov.com`, company communications, product routing, and trustworthy public content. |
| OIDC operations model: hardened/managed Keycloak or another approved managed provider | Identity is a company-wide critical dependency and requires MFA, backups, upgrades, monitoring, incident ownership, and recovery. |
| Control-plane organization and product-entitlement model | Determines how one account launches several products without sharing product roles or product databases. |
| Nepal merchant onboarding for Khalti/eSewa and eligibility for international payment providers | A Nepal-registered entity cannot assume every global provider is available; this determines checkout, reconciliation, refunds, currencies, and launch schedule. |
| Launch countries, currencies, tax handling, and payment methods | Determines checkout, invoices, compliance, and which payment providers are available for each launch market. |
| One-time purchases, subscriptions, or both in the first release | Determines pricing screens and entitlement rules. Both are target capabilities above. |
| Instructor revenue share, payout schedule, refund window, and disputes | Determines payout adapter design, reconciliation, and financial reports. |
| Initial traffic, concurrency, target regions, and video quality | Finalizes performance, recovery, and cost targets. |
| Upload limits, moderation rules, assignment late policy, and retention | Finalizes validation and operations. |
| Transactional email provider and sender domain | Required for email one-time sign-in codes, verification, and announcements. |
| B2B seats and Organization Manager launch timing | Optional scope needs separate acceptance criteria if selected. |
| Launch course inventory and teaching languages for the interface | The platform supports all named programs; authors must still create or license each actual course and question bank. |
| Official exam alignment and content licensing | Determines which exam patterns, sample questions, and branding can be used and when they must be updated. |
| SSW field review owner and review frequency | Official field and exam details can change; the registry needs an accountable maintainer. |
| Mobile storefronts, countries, and purchase model | Determines whether each in-app purchase uses store billing, an authorized alternative, or web-only purchase. |
| Chat availability, moderation staffing, and age policy | Determines direct messaging permissions, retention, reporting, and safeguarding controls. |
| Offline downloads and live classes | Both are outside the current requirements and would need separate access and rights rules if added. |
| SaaS plans, trial length, tenant quotas, and suspension behavior | Determines provisioning, platform billing, and what learners can still access when a tenant is past due. |
| Default shared PostgreSQL or dedicated PostgreSQL tier for selected customers | Determines cost, data residency, backup, migration, and isolation operations. PostgreSQL remains required in either tier. |
| AWS account owners, support plan, service quotas, production sizing, monthly budget, and Hyderabad recovery activation criteria | AWS and Mumbai are selected; these operating decisions determine cost control, deployment capacity, recovery readiness, and escalation. |
| One shared mobile app or separately branded app binaries per tenant | The current requirement assumes one shared app with in-app tenant selection and tenant branding. |
| AI executive sponsor, product owner, platform lead, data steward, security/privacy owner, domain reviewers, and FinOps/on-call owner | The Bedrock-first architecture is selected, but implementation cannot start safely without accountable outcome, data, release, cost, and incident owners. |
| Initial AI model aliases, exact Bedrock models/features, inference profiles, processing Regions, retention mode, and fallback provider | Model and regional availability changes; this determines data flow, quality, latency, resilience, and cost for each approved use case. |
| AI allowed data classes, approved source inventory, customer-training policy, evaluation thresholds, pilot budget, quotas, and stop conditions | Determines which prompts/RAG inputs are legal and safe, how quality is proven, and how leakage or uncontrolled spend is prevented. Customer content is excluded from shared training by default. |
| Language providers and native-speaker reviewers for Japanese, Korean, Chinese, Nepali, English, Russian, Arabic, and Spanish | AWS language coverage and features differ. Nepali is listed for Transcribe but not in the reviewed Translate or Polly tables, so translation, voice, and pronunciation parity cannot be assumed. |
| SIEM hosting, security-event retention/residency, on-call owner, notification channel, and whether Wazuh endpoint agents are needed | Determines SOC cost, access control, response coverage, evidence handling, and whether OpenSearch alone meets the production need. |
| Written rights from Flo Softwares contributors to the adopted code, designs, and product names | Required before any adopted concept is reused (ADR-010); unclear ownership weakens Oxinov intellectual property and investor due diligence. |
| Rotation of secrets committed to Flo Softwares repositories | `.env` files and test credentials were found in those repositories; any live value must be treated as compromised. |
| Marketplace payment model: direct provider payment, licensed escrow, or payouts | Holding customer funds or operating a wallet may require Nepal Rastra Bank authorization; determines Commodity Market escrow and Services Market checkout. |
| Nepal e-commerce registration and consumer protection obligations | Applies to Commodity Market and Services Market before public launch. |
| Foreign employment licensing | Required before Oxinov HR arranges overseas placements; Oxinov Edu training alone is not placement. |
| KYC provider, reviewer staffing, and document retention | Determines T3/T4 verification speed, cost, privacy risk, and seller or employer onboarding time. |
| SMS provider for phone verification in Nepal | Required for trust level T2 before messaging, orders, bookings, or applications. |
| Email one-time-code sign-in implementation in Keycloak | May require a reviewed extension or custom authenticator (ADR-011). |
| Minimum user age per product | Determines sign-in eligibility, parental consent, and marketplace restrictions. |
| Policy owners and Nepal counsel review of Terms, Privacy, and product-role policies | Sign-in cannot launch publicly without published, reviewed policies. |
| Plan prices, free-tier limits, and Oxinov One contents | Determines revenue, AI cost exposure, and conversion; current NPR prices are untested hypotheses. |
| Recurring billing availability from Khalti, eSewa, and banks | Without auto-debit, subscriptions start as prepaid periods with renewal reminders. |
| International subscription payments for a Nepal entity | Needs an eligible card provider or merchant-of-record service before selling outside Nepal. |
| Google Play Billing and Apple In-App Purchase fees and rules per product | Determines in-app pricing, which purchases must use store billing, and margin by channel. |
| VAT and tax treatment of digital subscriptions and marketplace commission | Determines displayed prices, invoices, and accounting. |
| Licensed bank escrow or settlement partner for Commodity Market | Required before any high-value escrow order; Oxinov must not hold customer funds as a stored balance (ADR-013). |
| Second-hand vehicle and heavy-machinery sales rules | Department of Transport Management ownership-transfer checks and legal review decide whether those categories launch. |
| Inspection partner network and liability | Determines condition-grade trust, inspection coverage by district, and dispute outcomes. |
