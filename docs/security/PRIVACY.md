# Privacy

Oxinov Pvt. Ltd. is responsible for personal data processed by the Oxinov platform and its products. Tenant owners control their educational data in OxinovLMS subject to platform operations and law. The public Privacy Policy is part of the [platform policies](../company/PLATFORM-POLICIES.md); its legal text requires review by qualified Nepal counsel against the Individual Privacy Act and the laws of each launch market.

## Data collected by layer

| Layer | Data | Purpose |
| --- | --- | --- |
| Sign-in (`id.oxinov.com`) | Email, name, profile photo from Google or Apple, sign-in method, session and device metadata | Authenticate and secure the account |
| Platform | Country, phone number (T2), policy acceptances, organizations, entitlements, payments ledger, support cases | Operate one account across products |
| KYC (T3/T4) | Citizenship or passport images, date of birth, address, business registration and PAN documents, reviewer decisions | Verify sellers, providers, employers, and payout recipients |
| OxinovLMS | Enrollment, progress, exam attempts and results, assignments, chat, certificates | Deliver learning |
| Commodity Market | Listings, orders, RFQs, escrow records, delivery locations, inspection reports, vehicle and machinery ownership documents, messages, reviews | Operate the commodity and second-hand marketplace |
| Jobs | Candidate profile, CV, employment history, applications, employer messages | Match candidates and employers |
| Services Market | Service demands, bookings, service addresses, messages, reviews | Operate the services marketplace |

## Rules

- Collect only what the current action needs. Ask for phone and KYC data only when a person reaches the action that requires T2, T3, or T4.
- From Google sign-in, use only the email, verified flag, name, and photo. Do not request Gmail, contacts, or Drive scopes.
- KYC documents live in the platform in private encrypted storage. Products receive only the verification status and level, never the documents.
- Contact details are shared between users only when needed for an order, booking, or application.
- Candidates control profile visibility. Employers see full applications only for their own postings.
- Products never share personal data with each other except through documented platform APIs with a stated purpose.
- Define lawful basis, minimum age, regions, retention, processors, and cross-border transfer rules for each product before launch.
- People can view and export their data and request deletion from the account portal. Deletion covers every product, subject to legal retention.

## AI, public data, and security data

AI prompts must not mix tenants or expose private learner, candidate, KYC, or payment data without an approved purpose. Public certificate verification reveals only approved fields. Security events may contain restricted internal identifiers and source addresses needed for investigation; restrict access, minimize fields, define retention and legal hold, and include them in applicable export and deletion decisions. Incident evidence belongs in approved encrypted storage outside Git. See [retention](../data/DATA-RETENTION.md) and [SOC design](SOC.md).
