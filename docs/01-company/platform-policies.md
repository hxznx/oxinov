# Oxinov platform policies

The framework for the policies that govern every Oxinov product: which policies exist, what each must cover, and how acceptance and enforcement work. Read it before you change a policy, add a product role, or build a flow that asks someone to accept terms.

**Status:** Proposed · **Owner:** Legal and trust owner · **Last reviewed:** 2026-09-28

Oxinov Pvt. Ltd. runs every product under one set of company-wide policies plus short product-role policies. This framework does not state legal conclusions. Qualified Nepal counsel must draft or review the legal text of each policy before publication. The required behavior is in the POLICY requirements of the [Platform FRD](../03-requirements/frd/platform-frd.md) (FR-POLICY-2401 to FR-POLICY-2404).

## Policy set

| Policy | Scope | Accepted when | Public URL | Published today |
| --- | --- | --- | --- | --- |
| Oxinov Terms of Service | All products | First sign-in (trust level T1) | `oxinov.com/legal/terms` | Yes; text awaits legal review |
| Oxinov Privacy Policy | All products | First sign-in (T1) | `oxinov.com/legal/privacy` | Yes; text awaits legal review |
| Acceptable Use and Community Policy | All products | Included in the Terms | `oxinov.com/legal/acceptable-use` | Yes; text awaits legal review |
| KYC and Verification Policy | Identity and business verification (KYC: "know your customer") | Starting KYC (T3/T4) | `oxinov.com/legal/verification` | No |
| Payments, Escrow, Refunds, and Disputes Policy | Any paid transaction, including milestone escrow | First payment, escrow deposit, or payout | `oxinov.com/legal/payments` | No |
| Marketplace Seller Policy | Oxinov Market (Commodity Market) sellers, dealers, cooperatives, and enterprises | First listing | `oxinov.com/legal/market-seller` | No |
| Inspector Partner Agreement | Market depot and inspection partners | Partner onboarding (signed contract) | Not public; linked from the partner portal | No |
| Provider Policy | Oxinov Services Market providers | First service listing | `oxinov.com/legal/services-provider` | No |
| Employer Policy | Oxinov HR employers and client organizations | First direct job posting or hiring mandate | `oxinov.com/legal/employer` | No |
| Instructor Policy | Oxinov Edu instructors and tenants | Becoming an instructor | `oxinov.com/legal/instructor` | No |
| Cookie Policy | Websites | Consent banner (non-essential cookies off by default) | `oxinov.com/legal/cookies` | Yes; text awaits legal review |
| Security Disclosure Policy | Researchers | Not accepted; published | `oxinov.com/security` | Yes |

Trust levels T0 to T4 are defined in [identity and access](../04-architecture/identity-and-access.md). The websites set no trackers or non-essential cookies today, so no consent banner is shown (FR-SITE-2105).

## Minimum content

| Policy | Must cover |
| --- | --- |
| Terms | Eligibility and minimum age, account responsibilities, one account per person, Oxinov's role as a platform versus a party to trades, prohibited conduct, content licence, termination, liability limits, governing law (Nepal), and contact details for Oxinov Pvt. Ltd., Lalitpur, Nepal |
| Privacy | Data collected per product, Google sign-in data used (name, email, photo), purpose and lawful basis, KYC document handling, processors and cross-border transfers, retention, and how to export or delete data |
| Acceptable use | Fraud, fake listings or jobs, impersonation, harassment, spam, prohibited goods and services, off-platform payment steering, scraping, and security abuse |
| Product-role policies | For that role: listing accuracy, condition disclosures and inspection reports for second-hand equipment and commodities, quality and quantity claims, pricing and fees, delivery and escrow milestones, cancellations, reviews, and disputes |

## Acceptance records

The platform database stores each acceptance with:

- user ID;
- policy ID;
- version;
- accepted-at timestamp;
- channel (web, Android, iOS);
- locale.

Records are append-only. A material change requires re-acceptance before the next protected action. A minor change is announced by notification and email.

Today the account portal's first-sign-in welcome records acceptance of the Terms and Privacy Policy (FR-ID-2205, FR-POLICY-2402).

## Enforcement ladder

| Step | Example trigger | Effect |
| --- | --- | --- |
| Notice | First minor violation | Warning with the policy reference |
| Content action | Misleading listing or job | Content hidden until corrected |
| Role restriction | Repeated violations as a seller, provider, or employer | That product role suspended; other products unaffected |
| Product suspension | Fraud inside one product | Product access removed |
| Account suspension | Severe fraud, safety risk, or law-enforcement requirement | All Oxinov sessions revoked |

Every enforcement action:

- records a reason code and the actor;
- notifies the person, with the appeal route;
- emits audit and security events.

A different staff member reviews each appeal within a published target time.

## Governance

- Each policy has an owner, a version history, and a review date.
- Policies are written in plain English only (ADR-020). Readers may use a translator; the English text is the binding version.
- Policy text is published on the company website and linked from every product footer, the sign-in page, and the relevant just-in-time acceptance screen.
