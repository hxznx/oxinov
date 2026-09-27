# Functional Requirements Document: Oxinov Market

**Version:** 0.1  
**Status:** Proposed discovery draft; release gate remains closed  
**Product address:** `market.oxinov.com` after approval  
**Technical slug:** `market`  
**Source:** [Commodity Market charter](../../products/COMMODITY-MARKET.md), ADR-010, ADR-013, and ADR-026

## 1. Purpose and scope

Oxinov Market is the customer-facing name used in this FRD for the planned Oxinov Commodity Market. It supports verified B2B and B2C trade in agricultural and industrial commodities, wholesale goods, productive machinery, and circular second-hand assets. The first release must make listing condition, ownership, price, delivery, inspection, payment, and dispute state understandable without Oxinov holding a customer balance.

This document specifies behavior only. It does not approve implementation, a production subdomain, a payment provider, an escrow arrangement, or new infrastructure. The charter release gate and qualified legal review must close first.

## 2. Roles and access

| Role | Minimum trust | Scope |
| --- | --- | --- |
| Visitor | T0 | Browse approved public listings and price information |
| Member | T1 | Save searches, listings, and alerts |
| Buyer | T2 | Create RFQs, orders, messages, reviews, and disputes |
| Individual seller | T3 | Publish permitted listings and receive provider settlement |
| Business seller | T4 organization | Bulk listings, auctions, staff access, and reports |
| Inspector | T4 certified partner | Assigned inspections only |
| Market operations | Staff role with MFA and elevation | Taxonomy, moderation, disputes, and feed oversight |

All owner-, organization-, order-, and conversation-scoped data must be isolated in the API and PostgreSQL row-level security. Cross-owner unknown or forbidden resources return not found.

## 3. Platform dependencies

Oxinov Market depends on Platform FRs for identity, trust, policy acceptance, organizations, KYC, payments ledger, notifications, messaging, privacy, operations, and audit. It must not store passwords, duplicate KYC documents, treat a browser redirect as payment proof, or create an Oxinov stored-value balance.

## 4. Functional requirements

### 4.1 Catalog and discovery

**FR-MKT-5001 — Governed taxonomy.** Operations must manage versioned categories, attributes, units, grades, prohibited-item rules, and required evidence for commodities, wholesale goods, machinery, vehicles, and second-hand assets.
*Priority:* Must. *Status:* Proposed. *Access:* Market operations. *Source:* Commodity Market charter.
- Acceptance: An authorized operator can publish a taxonomy revision without changing historical listing snapshots.
- Acceptance: An unauthorized user cannot change taxonomy or prohibited-item rules.

**FR-MKT-5002 — Listing discovery.** Visitors must be able to search and filter approved listings by category, location, price, quantity, unit, grade, condition, seller verification, inspection availability, and transaction mode.
*Priority:* Must. *Status:* Proposed. *Access:* T0 public approved data. *Source:* Commodity Market charter.
- Acceptance: Search results expose only published, non-suspended listings and clearly identify applied filters.
- Acceptance: Private drafts, moderation notes, owner documents, and exact private addresses never appear in public results.

**FR-MKT-5003 — Comparable prices and units.** The system must show the listing currency, sale unit, minimum quantity, applicable taxes or fees, and a normalized comparison unit where a reliable conversion exists.
*Priority:* Must. *Status:* Proposed. *Access:* T0. *Source:* Commodity Market charter.
- Acceptance: A buyer can distinguish total, per-unit, and volume-tier prices before requesting or placing an order.
- Acceptance: The system does not invent a conversion or market price when unit data is missing or incompatible.

**FR-MKT-5004 — Saved searches and alerts.** Members may save a bounded number of searches and opt into material price, availability, and matching-listing alerts.
*Priority:* Should. *Status:* Proposed. *Access:* T1 owner scope. *Source:* Subscription model.
- Acceptance: A member can review, pause, and delete each alert and its delivery channels.
- Acceptance: Alerts are not delivered after opt-out, entitlement expiry, or listing suppression.

### 4.2 Seller and listing lifecycle

**FR-MKT-5010 — Seller eligibility.** The system must verify the required trust level, seller policy version, category permissions, payout readiness, and organization authority before allowing publication.
*Priority:* Must. *Status:* Proposed. *Access:* T3 individual seller or T4 business seller. *Source:* Marketplace Seller Policy and charter.
- Acceptance: An eligible seller can create a draft and submit it for moderation.
- Acceptance: A seller missing KYC, policy acceptance, payout readiness, or organization authority cannot publish.

**FR-MKT-5011 — Structured listing draft.** A seller must provide category-required title, description, quantity, unit, price mode, location region, delivery terms, grade or condition, evidence, and disclosure fields before submission.
*Priority:* Must. *Status:* Proposed. *Access:* Eligible seller, owner or organization scope. *Source:* Commodity Market charter.
- Acceptance: Valid data can be saved as a private draft and safely resumed after a recoverable failure.
- Acceptance: Missing mandatory disclosures produce field-specific errors and never create a public listing.

**FR-MKT-5012 — Media and document safety.** Listing images, videos, certificates, and ownership evidence must use private storage, permitted file types and sizes, malware scanning before public access, and short-lived authorized URLs for non-public evidence.
*Priority:* Must. *Status:* Proposed. *Access:* Seller, assigned operations, buyer only when explicitly disclosed. *Source:* Security baseline and charter.
- Acceptance: Approved public media can be viewed while protected evidence remains access-controlled and audited.
- Acceptance: A failed scan, unsupported file, or expired URL cannot be downloaded or published.

**FR-MKT-5013 — Condition and provenance disclosure.** Listings must capture the applicable commodity grade or asset condition, evidence source, inspection status, known defects, operating history, ownership basis, and last verification date.
*Priority:* Must. *Status:* Proposed. *Access:* Seller writes; T0 reads approved public fields. *Source:* ADR-013.
- Acceptance: A buyer sees the exact seller-declared condition and whether it was independently verified.
- Acceptance: A seller cannot label an item certified, organic, inspected, or title-verified without valid evidence and authorization.

**FR-MKT-5014 — Moderation lifecycle.** Listings must move through draft, submitted, changes requested, approved, published, paused, sold, expired, rejected, or removed states with reason codes and audit history.
*Priority:* Must. *Status:* Proposed. *Access:* Seller and market operations. *Source:* Commodity Market charter.
- Acceptance: Sellers see actionable reasons without access to confidential moderation controls.
- Acceptance: Rejected, removed, expired, or paused listings cannot accept new transactions.

**FR-MKT-5015 — Inventory and availability.** The system must prevent confirmed sales beyond available quantity and must make quantity adjustments idempotent and auditable.
*Priority:* Must. *Status:* Proposed. *Access:* Seller writes; buyers read availability. *Source:* Commodity Market charter.
- Acceptance: Concurrent confirmations cannot reduce inventory below zero.
- Acceptance: Retrying the same reservation or provider event does not duplicate an adjustment.

### 4.3 RFQ, orders, auctions, and delivery

**FR-MKT-5020 — Request for quote.** Contact-verified buyers may submit an RFQ with item, quantity, unit, destination region, target date, and optional target price; eligible sellers may respond with expiring quotes.
*Priority:* Must. *Status:* Proposed. *Access:* T2 buyer and invited eligible sellers. *Source:* Commodity Market charter.
- Acceptance: A buyer can compare active quotes using consistent units, fees, delivery terms, and expiry times.
- Acceptance: Uninvited users and competing sellers cannot read another seller's private quote.

**FR-MKT-5021 — Fixed-price order.** A buyer may create an order from an available fixed-price listing, with an immutable commercial snapshot and an idempotency key.
*Priority:* Must. *Status:* Proposed. *Access:* T2 buyer; eligible seller. *Source:* Commodity Market charter.
- Acceptance: The order preserves the accepted item, quantity, price, currency, fees, disclosures, and delivery terms.
- Acceptance: A replayed request does not create a second order or reserve inventory twice.

**FR-MKT-5022 — Auction and tender controls.** Approved business sellers may run timed auctions or tenders with published rules, reserve handling, bid increments, opening and closing times, and an auditable winner calculation.
*Priority:* Should. *Status:* Proposed. *Access:* T4 seller organization; T2 qualified bidder. *Source:* Commodity Market charter.
- Acceptance: Qualified bidders can place valid bids before the UTC closing instant and see the applicable rules.
- Acceptance: Late, below-increment, self-dealing, withdrawn-user, or ineligible bids cannot win.

**FR-MKT-5023 — Delivery milestones.** Orders must track seller readiness, dispatch, carrier or pickup details, delivery evidence, inspection window, acceptance, completion, cancellation, and dispute states using UTC timestamps.
*Priority:* Must. *Status:* Proposed. *Access:* Order parties and authorized operations. *Source:* ADR-013.
- Acceptance: Each party sees the next required action and the deadline rendered in its local time zone.
- Acceptance: A user cannot skip required milestones or modify another party's evidence.

### 4.4 Inspection, payment, and disputes

**FR-MKT-5030 — Inspection request and assignment.** A buyer may request an available inspection; operations must assign only a qualified partner for the category and service region without exposing unnecessary party data.
*Priority:* Must for second-hand high-risk categories. *Status:* Proposed. *Access:* T2 buyer, certified inspector, operations. *Source:* ADR-013.
- Acceptance: The assigned inspector receives only the order, location, checklist, and contact details needed for the appointment.
- Acceptance: An unassigned or uncertified inspector cannot access the job or submit a report.

**FR-MKT-5031 — Signed inspection report.** Inspectors must submit a versioned checklist, readings, media, limitations, and outcome; corrections create a new signed version and preserve the original.
*Priority:* Must. *Status:* Proposed. *Access:* Assigned inspector writes; parties and operations read. *Source:* Inspector Partner Agreement.
- Acceptance: Parties can see who inspected, when, which standard was used, and what was not inspected.
- Acceptance: A report cannot be silently edited, backdated, or reused for another asset.

**FR-MKT-5032 — Server-verified payment state.** An order becomes paid or secured only after a verified, idempotently processed provider or licensed-bank event is reconciled to the order.
*Priority:* Must. *Status:* Proposed. *Access:* Order parties read; platform ledger controls state. *Source:* FR-PAY-2701–2703 and ADR-013.
- Acceptance: A valid provider event advances the order once and records the external reference without sensitive credentials.
- Acceptance: Browser redirects, screenshots, duplicate events, or mismatched amounts cannot mark the order paid.

**FR-MKT-5033 — Settlement authorization.** Settlement to a verified seller account may occur only after the contractual milestone, fees, refunds, holds, and dispute state are resolved through the platform ledger and licensed provider.
*Priority:* Must. *Status:* Proposed. *Access:* Platform ledger and authorized operations. *Source:* ADR-013.
- Acceptance: The parties see a clear ledger status and fee breakdown without an Oxinov wallet balance.
- Acceptance: A disputed, unreconciled, or identity-mismatched order cannot be released.

**FR-MKT-5034 — Dispute case.** An order party may open a reason-coded dispute during the permitted window, attach safe evidence, and receive an auditable timeline, response deadline, decision, and appeal route.
*Priority:* Must. *Status:* Proposed. *Access:* Order parties and time-limited operations elevation. *Source:* Platform dispute policy.
- Acceptance: A timely valid dispute places the relevant settlement action on hold and notifies both parties.
- Acceptance: Unrelated users cannot discover the case, and staff cannot decide it without justification and audit.

**FR-MKT-5035 — Reviews and abuse controls.** Completed-order parties may leave one review per side; reviews must identify verified transactions, support reporting, and resist retaliation, duplication, and prohibited content.
*Priority:* Should. *Status:* Proposed. *Access:* Completed order parties; T0 reads approved review fields. *Source:* Commodity Market charter.
- Acceptance: A valid completed order allows one attributable review and any disclosed moderation status.
- Acceptance: Users cannot review themselves, an uncompleted order, or the same side twice.

### 4.5 Operations and reporting

**FR-MKT-5040 — Safety interventions.** Operations must be able to quarantine listings, sellers, serial numbers, documents, or categories using reason codes, least-privilege access, review dates, and security events.
*Priority:* Must. *Status:* Proposed. *Access:* Authorized market operations. *Source:* ADR-013 and threat model.
- Acceptance: A quarantine immediately blocks new transactions while preserving evidence and affected-party notices where safe.
- Acceptance: A staff member without the required elevated role cannot apply or remove a quarantine.

**FR-MKT-5041 — Market reporting.** Authorized sellers and operations must receive scoped reports for listings, orders, quantity, GMV, fees, disputes, inspection outcomes, and completion time, with UTC source times and explicit currencies.
*Priority:* Should. *Status:* Proposed. *Access:* Seller organization scope or operations aggregate. *Source:* Commodity Market charter.
- Acceptance: A seller export contains only its organization data and documents applied filters and generation time.
- Acceptance: Reports do not expose another seller's private commercial data or personal contact details.

## 5. Out of scope

- Oxinov-held wallets or customer balances.
- Anonymous sales, unverified high-risk sellers, or prohibited and regulated goods without approval.
- Cross-product database reads, local passwords, or copied KYC records.
- Guaranteed price accuracy, investment advice, or invented inspection and certification claims.
- Production scaffolding until the release gate closes.

## 6. Open decisions and release gate

The product owner must approve launch categories and regions, evidence standards, prohibited items, pricing and commissions, quantity units, provider and bank model, escrow legality, tax handling, inspection partners, delivery responsibilities, dispute SLAs, retention, operational staffing, budget, and stop/continue checkpoint. Qualified Nepal counsel must review consumer protection, e-commerce, vehicle title, forest/mineral transit, auction, payment, and settlement obligations.

## 7. Suggested delivery slices

1. Taxonomy, seller eligibility, drafts, moderation, and public discovery.
2. RFQs and fixed-price orders with immutable snapshots.
3. Delivery milestones, inspections, disputes, and verified reviews.
4. Licensed payment/settlement integration only after legal and provider approval.
5. Auctions, market data, and advanced reporting after measured demand.
