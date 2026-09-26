# Oxinov platform policies

Oxinov Pvt. Ltd. operates every Oxinov product under one set of company-wide policies plus short product-role policies. This document defines the policy framework, what each policy must cover, and how acceptance and enforcement work. The legal text of each policy must be drafted or reviewed by qualified Nepal counsel before publication; this framework does not state legal conclusions.

## Policy set

| Policy | Scope | Accepted when | Public URL |
| --- | --- | --- | --- |
| Oxinov Terms of Service | All products | First sign-in (trust level T1) | `oxinov.com/legal/terms` |
| Oxinov Privacy Policy | All products | First sign-in (T1) | `oxinov.com/legal/privacy` |
| Acceptable Use and Community Policy | All products | Included in the Terms | `oxinov.com/legal/acceptable-use` |
| KYC and Verification Policy | Identity and business verification | Starting KYC (T3/T4) | `oxinov.com/legal/verification` |
| Payments, Escrow, Refunds, and Disputes Policy | Any paid transaction, including milestone escrow | First payment, escrow deposit, or payout | `oxinov.com/legal/payments` |
| Marketplace Seller Policy | Oxinov Commodity Market sellers, dealers, cooperatives, and enterprises | First listing | `oxinov.com/legal/market-seller` |
| Inspector Partner Agreement | Commodity Market depot and inspection partners | Partner onboarding (signed contract) | Not public; linked from the partner portal |
| Provider Policy | Oxinov Services Market providers | First service listing | `oxinov.com/legal/services-provider` |
| Employer Policy | Oxinov Jobs employers | First job posting | `oxinov.com/legal/employer` |
| Instructor Policy | Oxinov Edu instructors and tenants | Becoming an instructor | `oxinov.com/legal/instructor` |
| Cookie Policy | Websites | Consent banner (non-essential cookies off by default) | `oxinov.com/legal/cookies` |
| Security Disclosure Policy | Researchers | Not accepted; published | `oxinov.com/security` |

## Minimum content

- **Terms:** eligibility and minimum age, account responsibilities, one account per person, Oxinov's role as a platform versus a party to trades, prohibited conduct, content licence, termination, liability limits, governing law (Nepal), and contact details for Oxinov Pvt. Ltd., Lalitpur, Nepal.
- **Privacy:** data collected per product, Google sign-in data used (name, email, photo), purpose and lawful basis, KYC document handling, processors and cross-border transfers, retention, and how to export or delete data.
- **Acceptable use:** fraud, fake listings or jobs, impersonation, harassment, spam, prohibited goods and services, off-platform payment steering, scraping, and security abuse.
- **Product role policies:** listing accuracy, condition disclosures and inspection reports for second-hand equipment and commodities, quality and quantity claims, pricing and fees, delivery and escrow milestones, cancellations, reviews, and disputes for that role.

## Acceptance records

Store user ID, policy ID, version, accepted-at timestamp, channel (web, Android, iOS), and locale in the platform database. Records are append-only. A material change requires re-acceptance before the next protected action; a minor change is announced by notification and email.

## Enforcement ladder

| Step | Example trigger | Effect |
| --- | --- | --- |
| Notice | First minor violation | Warning with the policy reference |
| Content action | Misleading listing or job | Content hidden until corrected |
| Role restriction | Repeated violations as a seller, provider, or employer | That product role suspended; other products unaffected |
| Product suspension | Fraud inside one product | Product access removed |
| Account suspension | Severe fraud, safety risk, or law-enforcement requirement | All Oxinov sessions revoked |

Every action records a reason code and actor, notifies the person with the appeal route, and emits audit and security events. Appeals are reviewed by a different staff member within a published target time.

## Governance

Each policy has an owner, version history, and review date, and is written in plain English only (ADR-020); readers may use a translator, and the English text is the binding version. Policy text is published on the company website and linked from every product footer, the sign-in page, and the relevant just-in-time acceptance screen.
