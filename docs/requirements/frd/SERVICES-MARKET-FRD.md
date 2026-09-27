# Functional Requirements Document: Oxinov Services Market

**Version:** 0.1  
**Status:** Proposed discovery draft; release gate remains closed  
**Product address:** `services.oxinov.com` after approval  
**Technical slug:** `services`  
**Source:** [Services Market charter](../../products/SERVICES-MARKET.md), ADR-010, and ADR-025

## 1. Purpose and scope

Oxinov Services Market helps people and organizations discover verified local providers, describe a need, compare quotes, book work, document completion, pay through approved providers, resolve disputes, and review completed service. It excludes recruitment, education, product sales, and Oxinov's own consulting projects.

This proposed FRD records testable behavior but does not approve implementation, production infrastructure, regulated categories, or a payment arrangement.

## 2. Roles and access

| Role | Minimum trust | Scope |
| --- | --- | --- |
| Visitor | T0 | Browse approved public categories, services, and providers |
| Seeker | T2 to transact | Post needs, request quotes, book, message, dispute, and review |
| Individual provider | T3 | Offer approved services and receive settlement |
| Provider business | T4 organization | Staff, areas, services, bookings, and reports |
| Services operations | Staff role with MFA and elevation | Categories, provider review, safety, and disputes |

## 3. Platform dependencies

The product reuses Platform identity, trust, policy, organization, KYC, payment-ledger, notification, messaging, privacy, audit, and support requirements. It stores product workflows in its own boundary and never copies passwords or KYC documents.

## 4. Functional requirements

### 4.1 Categories, providers, and discovery

**FR-SVC-7001 — Service taxonomy.** Operations must manage versioned categories, subcategories, required qualifications, risk level, pricing modes, service units, and geographic availability.
*Priority:* Must. *Status:* Proposed. *Access:* Services operations. *Source:* Services Market charter.
- Acceptance: An authorized operator can publish a revision without changing historical booking snapshots.
- Acceptance: An unauthorized user cannot add a regulated category or weaken its qualification rules.

**FR-SVC-7002 — Provider eligibility.** A provider may publish only after the required trust level, Provider Policy, identity or business verification, qualifications, service area, and payout readiness are current.
*Priority:* Must. *Status:* Proposed. *Access:* T3 individual or T4 provider organization. *Source:* Services Market charter.
- Acceptance: An eligible provider can submit a service profile for review.
- Acceptance: Missing, expired, rejected, or mismatched verification prevents publication and booking acceptance.

**FR-SVC-7003 — Provider profile and service listing.** Providers must describe services, experience, verified qualifications, pricing type, availability, travel policy, service area, exclusions, cancellation terms, and accessible contact method without publishing private contact data.
*Priority:* Must. *Status:* Proposed. *Access:* Provider owner scope; T0 reads approved fields. *Source:* Services Market charter.
- Acceptance: Approved fields and verification status appear on the public profile with a last-reviewed date.
- Acceptance: Private documents, home addresses, moderation notes, and unverified claims are not public.

**FR-SVC-7004 — Service discovery.** Visitors must search and filter approved providers and services by category, area, availability, pricing type, verification, accessibility options, language capability, and rating.
*Priority:* Must. *Status:* Proposed. *Access:* T0. *Source:* Services Market charter.
- Acceptance: Results clearly distinguish provider claims, verified facts, estimates, and completed-booking reviews.
- Acceptance: Suspended providers and private drafts do not appear or accept inquiries.

**FR-SVC-7005 — Availability calendar.** Providers must manage UTC-backed availability, lead time, duration, breaks, blackout periods, capacity, and travel buffers.
*Priority:* Must. *Status:* Proposed. *Access:* Provider owner or authorized staff. *Source:* Services Market charter.
- Acceptance: Seekers see availability in their local time zone and cannot confirm an occupied slot.
- Acceptance: Concurrent requests cannot overbook provider capacity.

### 4.2 Demand, quotes, and booking

**FR-SVC-7010 — Service demand.** A seeker may create a private draft and publish a need with category, description, region, desired window, budget type, accessibility needs, and safe attachments.
*Priority:* Must. *Status:* Proposed. *Access:* T1 draft; T2 publish, owner scope. *Source:* Services Market charter.
- Acceptance: A valid published demand reaches only eligible matching providers and hides the exact address until needed.
- Acceptance: Prohibited content, unsafe files, missing required fields, or an unverified publisher cannot create a public demand.

**FR-SVC-7011 — Quote response.** Eligible providers may respond with scope, assumptions, exclusions, price and currency, taxes or fees, proposed schedule, validity, and cancellation terms.
*Priority:* Must. *Status:* Proposed. *Access:* Invited or matched provider; demand owner. *Source:* Services Market charter.
- Acceptance: The seeker can compare active quotes on consistent commercial fields before acceptance.
- Acceptance: Providers cannot see competitors' private quotes or respond outside their approved category and area.

**FR-SVC-7012 — Booking creation.** A seeker may book an available listed service or accept a quote; the system must preserve an immutable scope, price, schedule, addresses disclosed at the proper stage, terms, and idempotency key.
*Priority:* Must. *Status:* Proposed. *Access:* T2 seeker and eligible provider. *Source:* Services Market charter.
- Acceptance: A successful action creates one booking with a clear next step for both parties.
- Acceptance: A retry, stale quote, occupied slot, suspended provider, or changed material term cannot create a duplicate or silent acceptance.

**FR-SVC-7013 — Booking lifecycle.** A booking must use controlled requested, accepted, scheduled, en route where applicable, in progress, completion proposed, completed, cancelled, no-show, and disputed states.
*Priority:* Must. *Status:* Proposed. *Access:* Booking parties and authorized operations. *Source:* Services Market charter.
- Acceptance: State changes record actor, UTC time, reason, and required evidence and notify the other party.
- Acceptance: A party cannot skip required states, backdate an action, or change the other party's evidence.

**FR-SVC-7014 — Booking communication.** Each booking must provide a scoped conversation with safe attachments, delivery status, reporting, and retention rules.
*Priority:* Must. *Status:* Proposed. *Access:* Booking parties and justified staff elevation. *Source:* FR-MSG-3001–3002.
- Acceptance: Booking parties can coordinate without public phone or email disclosure.
- Acceptance: Unrelated providers, seekers, and staff without elevation cannot read the conversation.

### 4.3 Completion, payment, safety, and quality

**FR-SVC-7020 — Completion evidence.** The provider may propose completion with a summary, timestamps, deliverables, and permitted evidence; the seeker may accept or raise a reason-coded issue within the published window.
*Priority:* Must. *Status:* Proposed. *Access:* Booking parties. *Source:* Services Market charter.
- Acceptance: Acceptance completes the service and records the agreed evidence snapshot.
- Acceptance: Silence cannot release a disputed booking, and completion evidence cannot expose prohibited personal data publicly.

**FR-SVC-7021 — Server-verified payment.** Payment and refund state must change only from reconciled, idempotently processed provider events through the platform ledger.
*Priority:* Must. *Status:* Proposed. *Access:* Parties read; platform ledger writes. *Source:* FR-PAY-2701–2703.
- Acceptance: The booking shows amount, currency, fee, refund, and settlement status without an Oxinov balance.
- Acceptance: Redirects, screenshots, duplicate events, or amount mismatches cannot confirm payment.

**FR-SVC-7022 — Cancellation and no-show.** The system must calculate permitted cancellation, rescheduling, no-show, fee, and refund outcomes from the booking snapshot and recorded evidence.
*Priority:* Must. *Status:* Proposed. *Access:* Booking parties and authorized operations. *Source:* Services Market charter.
- Acceptance: Before confirmation, both parties can see the applicable deadline and consequence in local time.
- Acceptance: Neither party nor ordinary staff can override a charge or refund without authorized, audited justification.

**FR-SVC-7023 — Safety check-in and emergency guidance.** For categories designated in-person or elevated risk, the product must provide appointment sharing, check-in and check-out, masked contact options, reporting, and clear emergency-service guidance without claiming to provide emergency response.
*Priority:* Must for designated categories. *Status:* Proposed. *Access:* Booking parties; nominated contact receives minimum necessary data. *Source:* Threat model.
- Acceptance: A user can trigger the documented safety flow and see what information will be shared.
- Acceptance: The feature never promises monitoring or emergency intervention that operations cannot deliver.

**FR-SVC-7024 — Disputes.** A booking party may open a scoped dispute with reason, evidence, response deadline, settlement hold where applicable, decision, and appeal route.
*Priority:* Must. *Status:* Proposed. *Access:* Parties and time-limited operations elevation. *Source:* Platform dispute policy.
- Acceptance: A timely valid dispute preserves evidence and blocks conflicting completion or settlement actions.
- Acceptance: Unrelated users cannot discover the case and staff actions require justification and audit.

**FR-SVC-7025 — Verified reviews.** Each side may leave one review after a completed booking, subject to reporting, moderation, anti-retaliation, and conflict-of-interest controls.
*Priority:* Should. *Status:* Proposed. *Access:* Completed booking parties; T0 reads approved fields. *Source:* Services Market charter.
- Acceptance: The review indicates that it follows a verified booking without exposing private booking details.
- Acceptance: Self-reviews, duplicate reviews, and reviews for uncompleted bookings are rejected.

**FR-SVC-7030 — Provider and operations reporting.** Providers must see scoped demand, quote, booking, completion, response-time, cancellation, review, dispute, fee, and settlement reports; operations may see privacy-preserving aggregates.
*Priority:* Should. *Status:* Proposed. *Access:* Provider organization scope or authorized operations. *Source:* Services Market charter.
- Acceptance: A provider export contains only its own records, explicit currency, filters, and UTC generation time.
- Acceptance: Reports do not reveal other providers' private pricing, seeker addresses, or contact details.

## 5. Out of scope

- Recruitment or job applications, courses or certifications, product listings, transport marketplace, real estate, entertainment tickets, and Oxinov client consulting projects.
- Unlicensed regulated professional services.
- Oxinov-held balances, offline payment claims, or duplicated identity and KYC systems.
- Production scaffolding until the release gate closes.

## 6. Open decisions and release gate

The owner must approve launch city and categories, regulated-category policy, qualification evidence, provider supply, pricing and commissions, cancellation rules, safety operations, payment and settlement provider, dispute SLAs, retention, budget, staffing, and stop/continue checkpoint. Legal review must cover e-commerce, consumer protection, professional licensing, worker classification, tax, privacy, safety, payments, and settlement.

## 7. Suggested delivery slices

1. Categories, verified provider profiles, discovery, and availability.
2. Service demands, quotes, booking snapshots, and messaging.
3. Completion, cancellation, disputes, verified reviews, and reports.
4. Payment and settlement only after provider and legal approval.
