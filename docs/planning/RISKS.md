# Risks and open decisions

**Owner and due date:** assign before implementation of the affected feature. Open items are not silent defaults.

## Decisions needed before final approval

| Decision | Why it matters |
| --- | --- |
| Launch countries, currencies, tax handling, and payment methods | Determines checkout, invoices, compliance, and whether Stripe covers the launch market. |
| One-time purchases, subscriptions, or both in the first release | Determines pricing screens and entitlement rules. Both are target capabilities above. |
| Instructor revenue share, payout schedule, refund window, and disputes | Determines Connect setup and financial reports. |
| Initial traffic, concurrency, target regions, and video quality | Finalizes performance, recovery, and cost targets. |
| Upload limits, moderation rules, assignment late policy, and retention | Finalizes validation and operations. |
| Transactional email provider and sender domain | Required for verification, password reset, and announcements. |
| B2B seats and Organization Manager launch timing | Optional scope needs separate acceptance criteria if selected. |
| Launch course inventory and teaching languages for the interface | The platform supports all named programs; authors must still create or license each actual course and question bank. |
| Official exam alignment and content licensing | Determines which exam patterns, sample questions, and branding can be used and when they must be updated. |
| SSW field review owner and review frequency | Official field and exam details can change; the registry needs an accountable maintainer. |
| Mobile storefronts, countries, and purchase model | Determines whether each in-app purchase uses store billing, an authorized alternative, or web-only purchase. |
| Chat availability, moderation staffing, and age policy | Determines direct messaging permissions, retention, reporting, and safeguarding controls. |
| Offline downloads and live classes | Both are outside the current requirements and would need separate access and rights rules if added. |
| SaaS plans, trial length, tenant quotas, and suspension behavior | Determines provisioning, platform billing, and what learners can still access when a tenant is past due. |
| Default shared PostgreSQL or dedicated PostgreSQL tier for selected customers | Determines cost, data residency, backup, migration, and isolation operations. PostgreSQL remains required in either tier. |
| Cloud provider, production host count, domains, and backup storage | Determines deployment topology, TLS, disaster recovery, and scaling. |
| One shared mobile app or separately branded app binaries per tenant | The current requirement assumes one shared app with in-app tenant selection and tenant branding. |
| AI provider, allowed inputs, usage limits, and review policy | Determines cost, data processing, and which prompt-generated drafts may be proposed. |
| SIEM hosting, security-event retention/residency, on-call owner, notification channel, and whether Wazuh endpoint agents are needed | Determines SOC cost, access control, response coverage, evidence handling, and whether OpenSearch alone meets the production need. |
