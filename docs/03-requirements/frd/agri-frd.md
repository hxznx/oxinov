# Functional requirements document: Oxinov Agri

This discovery FRD specifies an agricultural store with free information, paid access, physical goods, and quoted manufacturing offerings. Product, design, engineering, and QA use it for owner review before implementation.

**Version:** 0.2  
**Date:** 2026-10-03  
**Status:** Proposed; owner-requested discovery draft, not implementation approval  
**Owner:** Founder; accountable product and operational owners unassigned  
**Product address:** Open decision; no subdomain approved  
**Technical slug:** `agri` (documentation candidate only; product boundary unresolved)  
**Standard:** [Requirements standard](../README.md); AGRI discovery reservation 8800–8899, IDs 8801–8850 in this draft  
**Sources:** [Product record and owner brief](../../02-products/agri/README.md), [Edu store decision](../../04-architecture/adr/adr-028-edu-knowledge-store.md), [proposed Agri discovery reservation](../../04-architecture/adr/adr-029-agri-requirements-discovery.md), [Market FRD](market-frd.md), and [Platform FRD](platform-frd.md).

This is the single canonical Agri FRD. Improve version 0.2 here; do not create parallel FRDs for revisions, audits, or delivery phases. Product records and ADRs provide context, while this file owns Agri functional behavior.

## Implementation status

All Agri requirements are Proposed. This revision changes requirements only. No Agri application, database, deployment, payment method, supplier integration, or purchase journey is implemented or verified by this change. The [current state](../../04-architecture/current-state.md) remains the authority for existing production capabilities.

## Purpose and scope

The owner's intended offering is selling seeds, plants, agricultural technology, equipment, tools, and agricultural manufacturing products. Unpaid people receive normal information; paying people receive the purchased access, following Edu's preview-and-unlock model.

This replaces the earlier conversational farm-management recommendation as the basis for this draft. A farm operations dashboard, cooperative record system, sensors, or agronomic AI is not the first release scope.

### Owner direction and proposed interpretation

- Owner-stated: agricultural product sales; the categories above; Edu-style free information and paid access.
- Proposed interpretation: Oxinov is the initial seller, as in Edu's own-store model. External suppliers may supply inventory, but independent seller accounts are excluded until approved.
- Unresolved: whether access is bought per offering, as Edu does, or through an overall Agri membership; whether membership is required before placing physical orders.
- This draft proposes per-offering access, keeps goods and membership charges distinct, and keeps physical checkout closed until the owner explicitly chooses its membership prerequisite policy. This is a design proposal, not an approved business rule.
- Manufacturing may mean finished machines, custom fabrication, designs, or licenses. Quoted manufacturing is proposed conditional scope; digital design licensing applies only to offerings the owner chooses to sell.
- Prices, fees, discounts, access periods, refund rules, delivery promises, and countries are open decisions. Edu's NPR prices and bank-payment approval do not authorize Agri prices or payment deployment.

### Terms and access matrix

| Term | Meaning |
| --- | --- |
| Offering | A published item with a declared goods, paid-access, service, or manufacturing-quote type |
| Paid access | Permission to specified digital resources or services for a disclosed period; not ownership of goods |
| Goods order | Quantity, total, accepted terms, fulfillment, and payment records for physical items |
| Quote | Versioned proposal whose acceptance creates only the agreed obligations |
| Seller | Proposed initial seller is Ox Inov Pvt. Ltd.; no external seller onboarding in the first slice |
| Normal information | Free introduction, basic specifications, previews, safety, price or quote basis, and buying terms |

| Actor | Free information | Paid information | Physical goods |
| --- | --- | --- | --- |
| Visitor T0 | Approved public information | Titles and previews only | Browse; sign-in and required trust before ordering |
| Signed-in unpaid member T1 | Free resources and own account | Locked unless explicitly granted | Eligibility follows the unresolved membership policy and required verification |
| Active entitled customer | Free information | Only purchased scope | Separately priced order; entitlement alone does not buy goods |
| Expired customer | Free information, receipts and existing order support | Locked unless another valid grant exists | Existing orders and warranty remain; new-order policy needs owner decision |
| Staff | Public information plus assigned duties | No unrestricted access by staff status | Scoped catalog, stock, payment, support, or fulfillment duties |

## Product-manager review and release focus

**Review date:** 2026-10-03. This section records product recommendations; it does not claim validated demand or owner approval.

### Customer jobs and product promise

The product promise is: understand an agricultural offering, know exactly what payment buys, and receive the purchased item, access or agreed service with visible support.

- Grower or gardener: identify suitable seeds, plants or tools and understand pack size, handling, cost and delivery.
- Farm or business buyer: compare compatible equipment, included components, installation and warranty before spending.
- Technology/design buyer: evaluate a free preview, understand the paid deliverable and license, and obtain the purchased access.
- Manufacturing requester: define a need and receive a private, clear quote with measurable delivery obligations; later release.

The first paying segment is not yet selected. Interview customers and observe their existing purchasing process before choosing assortment or prices. Competitor familiarity and founder preference are inputs, not evidence of willingness to pay.

### Revenue and benefit boundaries

Goods generate proposed gross margin; paid material/services generate proposed access revenue; custom work generates agreed project fees. These streams must be reported separately. Membership payments do not pay for stock, shipping or fabrication unless a disclosed bundle explicitly includes those items.

Paid material must provide defined value beyond normal sales information, such as a reviewed design package or a supported technology service. Basic compatibility, safety, return and warranty information remains visible. Agricultural courses and training stay in Edu. Subscription rights, purchased files, goods ownership and warranty obligations need separate end/retention rules; do not apply a learning-plan expiry to all four.

The review recommends validating per-offering access first, in keeping with Edu, and avoiding lifetime plans for ongoing costly services until obligations and cost are modeled. Neither recommendation decides whether paid membership is required to buy physical goods. Checkout must fail closed when that policy is undecided (8838).

### Pilot evidence and measures

Before R1, establish baselines and owner-approved targets for buying comprehension, successful tasks, payment/review time, grant delivery time, order fulfillment and support. Do not invent numerical demand or profitability targets.

- First value: time from discovery to finding an eligible offering and understanding the full commitment.
- Commercial: confirmed cash/recognized revenue and refunds by offering type; contribution after product cost, delivery, payment fees and direct support. Development, salaries and overhead remain necessary to calculate operating profit.
- Customer outcome: successful entitled opening or received order; repeat purchase/renewal measured on an appropriate seasonal cohort.
- Reliability: duplicate charges/grants/orders, oversold stock, confirmed-but-unfulfilled payments, lost drafts, and unauthorized data disclosure.
- Support: review backlog age, unresolved claim age, customer-understood next step, and staff time per sale.

Release requires passing allowed/denied/retry journeys and no unresolved critical financial, privacy, safety, accessibility or recovery failure. Founder review decides whether the pilot supports continuing, narrowing or stopping.

### Screen and workflow inventory

| Screen | Primary outcome |
| --- | --- |
| Store and category results | Find eligible offerings; distinguish goods, access and quotation |
| Offering and comparison | Understand specifications, included value, terms and purchase type |
| Access checkout and My Access | Buy a stated benefit, follow verification and open/renew the right scope |
| Goods cart and checkout | Confirm units, destination, all charges and eligible membership |
| Payment status | See awaiting/review/confirmed/rejected status and corrective action |
| My Orders and order detail | Track shipment, receipt, claim, cancellation and warranty |
| Account and support | Find own receipts, active access, cases and privacy controls |
| Studio catalog, stock and payments | Publish reviewed offers, reserve correct stock and reconcile purchases |
| Studio fulfillment and cases | Deliver, communicate, resolve claims and report only verified outcomes |
| Manufacturing enquiry and project | Later: quote, accept, track changes and confirm delivery |

Use the shared Oxinov shell and design tokens. Discovery may use the brand's approved intensity; checkout, payment review, specifications, licenses and support use Calm presentation. Daylight must remain usable outdoors, and ordinary product suitability must be explained without AI.

## Roles and access

Catalog editors draft offerings; reviewers publish approved items; pricing administrators maintain commercial settings; payment reviewers verify statements; inventory and fulfillment staff manage allocated stock and delivery; technical staff handle assigned manufacturing requests; support staff handle assigned cases; privacy and operations roles use approved platform controls. No role gains unrestricted customer or cross-tenant access.

Customer identity follows the [Platform FRD](platform-frd.md), including no customer passwords. T2 for goods ordering is a proposed alignment with Market, subject to owner and risk review. Any later third-party selling additionally needs the platform's approved seller/business verification and a separate scope decision.

## Platform dependencies

Agri references rather than duplicates FR-ID-2201–2208 for identity/session behavior; FR-TRUST-2301–2304 and POLICY requirements for required trust and consent; ORG requirements for organization authority; FR-PLAN-2601–2606 for plans, limits and access; FR-PAY-2701–2705 for verified payments and commercial records; KYC requirements for verified sellers if later approved; NOTIF and MSG for communications; and FR-PRIV-3201–3202 for export and deletion.

These references are dependencies, not claims that every platform feature exists today. Before building each slice, verify available contracts against current state and record missing capabilities. Agri must not establish a competing identity, wallet, KYC, or payment ledger.

Edu's FR-CATALOG-305–309 and ADR-028 inform access plans, payment review, previews, and expiry; they remain Edu requirements, not Agri approvals. Agricultural training, courses, exams, and certificates remain Edu-owned and can be linked when relevant approved offerings exist.

The proposed commerce overlaps with Market's FR-MKT-5010–5015, 5020–5023, and 5032–5034. The owner must decide whether Agri is a Market storefront/module or an independent product before implementation. No duplicate checkout, settlement, or inventory system is authorized. Shared APIs/events may integrate product boundaries; cross-product database reads are prohibited.

## Purchase and operational boundaries

A goods order owns its line quantities, accepted commercial snapshot, reservation, shipment and claim references. An access purchase owns its benefit, term, deliverable version and entitlement references. A manufacturing project owns its accepted quote and change orders. Identity, payment verification and financial records use platform contracts; their physical data ownership follows the unresolved Market boundary decision. These are logical responsibilities, not permission to create separate databases or duplicate platform ledgers.

Payment confirmation may initiate fulfillment but never proves dispatch or receipt. A refund does not automatically cancel delivery, revoke a perpetual license or restock returned goods. Each action must satisfy its own policy, authority and state checks. Confirmed payments with failed grants or unavailable goods remain visible in reconciliation until resolved. Cancellation before dispatch releases a reservation only once; goods already dispatched require the applicable delivery/return process.

The recommended architecture is an agricultural storefront or module using Market commerce capabilities where suitable. The founder must approve the boundary and record the ADR before implementation; this recommendation does not amend ADR-013 or approve a new runtime.

## Acceptance baseline

Every requirement below inherits all applicable statements:

- Allowed and denied tests must cover active membership, role, trust, entitlement, owner/tenant, guessed identifiers, suspended actors, and explicit staff scope. Use stable safe API errors; another tenant's protected resource answers not found.
- Prices use integer minor units and an explicit currency; timestamps use UTC and render in the reader's timezone. Separate access fees, goods totals, delivery, taxes, and manufacturing milestones.
- Writes, grants, inventory changes, payment events, approvals, refunds, and notifications must be retry-safe. Test concurrent writes, duplicate events, stale state, and partial failures.
- A payment or state transition records the scoped actor or integration, UTC timestamp, exact object and commercial snapshot, previous/new state, and reason where applicable. Audit and security records follow the existing security schema and retention policy, without secrets, raw evidence, addresses, or private drawings.
- Preserve valid user input on recoverable failure. Show pending, rejected, expired, unavailable, and completed states truthfully; browser redirects and uploads never prove successful payment.
- Files and external content need boundary validation, scanning and private access as appropriate. Material that cannot meet the promised protection must be removed or its limitation disclosed before purchase.
- [NFRs](../nfr.md), [accessibility](../../07-design/accessibility.md), [user research standard](../../12-research/user-centered-product-standard.md), [secure development](../../09-security/secure-development-standard.md), [privacy](../../09-security/privacy.md), and [retention](../../05-data/data-retention.md) apply. No new legal conclusion or retention duration is invented here.

## Functional requirements

### Discovery and offering information

**FR-AGRI-8801 — Agricultural catalog.** The system must provide published categories for seeds, plants and nursery products, agricultural technology, equipment, tools, and agricultural manufacturing offerings. Each offering must declare whether it sells goods, digital access, a service, or a quoted manufacturing project.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* T0 reads; catalog editor writes. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given published offerings and a category filter, when a visitor searches or filters, then only matching approved offerings appear with pagination and an explicit empty result.
- Acceptance: Given a paused offering, when its direct public URL is opened, then it cannot accept a purchase and no private details appear.

**FR-AGRI-8802 — Offering details.** The system must show the seller, description, images, applicable specifications, unit, availability, price or quotation basis, delivery coverage, warranty, support, and purchase terms before commitment. Unknown claims must be labeled unverified.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* T0 approved public information. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given a published seed pack, when a buyer opens its page, then variety, unit, quantity, applicable batch/expiry, seller, total price basis and terms are visible.
- Acceptance: Given required category fields missing, when an editor submits publication, then validation identifies missing fields and publication remains blocked.

**FR-AGRI-8803 — Free previews and paid items.** An editor must mark each optional resource FREE or PAID_ACCESS. Introduction, basic specifications, safety information, purchase terms, and physical order support must remain outside the paid information gate.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* T0 public previews; entitled customer paid resources. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given a FREE introduction and PAID_ACCESS drawing, when an unpaid user opens the offering, then the introduction opens and the drawing shows its title, included plan and locked state.
- Acceptance: Given no valid grant, when the protected drawing or source endpoint is requested, then content and source identifiers are denied.

**FR-AGRI-8804 — Seed and plant disclosures.** The system must capture applicable variety or species, quantity and unit, batch, expiry or sowing window, supplier, storage and handling instructions, and evidence for germination, certification, or health claims. Claim evidence must identify its source, tested lot, test date, applicable method and validity or limitations; a lot test must not imply guaranteed field yield. Administrators must define category-specific required fields after qualified category and destination review.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* T0 approved disclosures; catalog editor writes. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given a cleared seed batch and destination, when a buyer reviews the listing, then batch, quantity, storage, sowing/expiry information and delivery limitations appear.
- Acceptance: Given an expired or recalled batch, when checkout is confirmed, then the sale is refused before payment instructions are issued.

**FR-AGRI-8805 — Equipment and technology disclosures.** The system must capture model, condition, compatibility, power requirements, included components, exclusions, installation needs, maintenance, warranty, and supporting claim evidence where applicable.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* T0 approved disclosures; catalog editor writes. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given a published pump, when a buyer reviews the item, then power, compatibility, condition, included components and warranty appear.
- Acceptance: Given a missing mandatory safety field or unsupported certification, when publication is attempted, then the reviewer receives a validation failure and cannot publish.

### Accounts, roles, and paid access

**FR-AGRI-8806 — Shared account and permissions.** The system must use Oxinov identity and enforce active membership, role, trust, policy, ownership, and entitlement checks server-side. Buying access must never grant staff or seller privileges.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* T0 discovery; T1 own digital access; T2 proposed goods buyer; scoped staff. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given a valid account and intended offering, when sign-in completes, then the user returns to the offering with only their authorized permissions.
- Acceptance: Given a suspended membership or client-supplied admin role, when a protected action is attempted, then the server refuses it without changing records.

**FR-AGRI-8807 — Access plans.** Administrators must define paid access per offering with an explicit scope, currency, price, period, included resources, exclusions, and renewal terms. Plan periods may follow Edu's 1, 6, or 12 months or lifetime pattern; Agri prices and lifetime obligations require owner approval.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Pricing administrator; T1 purchases own access. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given an approved active plan, when the customer selects it, then scope, price/currency, exact access end or lifetime terms, renewal and exclusions appear before payment.
- Acceptance: Given an inactive or incomplete plan, when checkout is attempted, then no payment request is created.

**FR-AGRI-8808 — Grant access after verified payment.** The system must grant the paid entitlement once after a verified payment or authorized bank-statement review, with the payment, customer, offering, amount, currency, and access window linked.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Authorized reviewer or platform payment integration; customer reads own grant. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given a matching confirmed access payment, when it is processed twice, then one grant exists for that customer and purchased offering.
- Acceptance: Given pending review or a mismatched payment, when protected content is requested, then no new access is granted.

**FR-AGRI-8809 — Expiry and renewal.** The system must check expiry on every protected request and extend an active renewable plan from its existing end, or an expired plan from the approved renewal time. Free information and existing order records must remain available after expiry.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* T1 customer, own entitlement. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given access expiring at an explicit UTC instant, when the customer renews before expiry, then the purchased period starts at the existing end without losing paid days.
- Acceptance: Given an expired grant, when a premium resource is requested, then it is locked while receipts, free information and existing order support remain available.

**FR-AGRI-8810 — Protected material and licenses.** The system must disclose personal or commercial usage rights, versions, permitted actions, and access limitations for paid technical material. Commercial manufacturing rights must be separately agreed when not included. Viewer restrictions must not claim to prevent all copying. Permitted downloads and commercial license rights must follow FR-AGRI-8842 rather than assuming Edu-style view-only delivery.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Entitled customer with accepted license; content editor. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given valid access and accepted license version, when a permitted resource is opened, then its version and permitted viewing/download/commercial uses are shown.
- Acceptance: Given a personal-only grant, when commercial manufacturing rights are requested, then no commercial license is inferred.

**FR-AGRI-8811 — Customer account center.** The system must show the customer's own access plans, expiry, payments, receipts, physical orders, manufacturing requests, notifications, and support routes. My Access and My Orders must remain distinct.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* T1 own account; scoped organization records. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given a pending access payment and dispatched goods order, when their owner opens Account, then each shows its separate status, next action and support route.
- Acceptance: Given another customer or unauthorized organization member, when the records are requested, then they are not disclosed.

**FR-AGRI-8812 — Audited free access grants.** An authorized administrator may grant complimentary access with offering scope, recipient, reason, period, and an auditable revocation. Grants must not create payment receipts or imply free goods.
*Priority:* Should. *Release:* R2. *Status:* Proposed. *Access:* Authorized access administrator. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given a grant administrator and reasoned scoped grant, when it is saved and then revoked, then the access period and both audit events are recorded without a payment receipt.
- Acceptance: Given an editor without grant permission, when a free grant is submitted, then no entitlement or order change occurs.

### Goods purchases and fulfillment

**FR-AGRI-8813 — Separate goods and access checkout.** The system must distinguish BUY_ITEM, BUY_ACCESS, and REQUEST_QUOTE actions. Membership fees must not be presented as payment for physical goods. Whether membership is required to place new goods orders remains an owner decision.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* T1 access buyer; T2 proposed goods buyer. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given a greenhouse kit and optional design access, when a customer reviews purchasing choices, then goods price, access fee and separate included value appear before choosing.
- Acceptance: Given an access-only payment, when fulfillment is requested, then no kit order or shipment is generated.

**FR-AGRI-8814 — Cart and commercial snapshot.** The system must validate item, variant, quantity, unit, stock, destination, currency, fees, taxes, delivery or pickup, and terms, then preserve the accepted commercial snapshot on an idempotently created order.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* T2 buyer, own order. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given in-stock goods and a supported destination, when the buyer confirms current quantity and final total, then one order stores the accepted item, fees, currency, address and policy version.
- Acceptance: Given a changed price or repeated idempotency key, when confirmation is retried, then new price needs consent and the same accepted request returns the same order.

**FR-AGRI-8815 — Inventory reservations.** The system must reserve and release stock atomically with configured reservation expiry and audit references. Confirmed quantities must never exceed available stock.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Inventory staff; order workflow. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given one available unit, when two eligible buyers confirm concurrently, then only one active reservation succeeds.
- Acceptance: Given an already released reservation, when expiry or cancellation is replayed, then stock is not increased twice.

**FR-AGRI-8816 — Delivery address minimization.** The system must collect delivery contact and address only when needed and share the minimum fulfillment information with an assigned carrier or pickup operator.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Buyer owns address; assigned fulfillment staff. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given an order assigned to a carrier, when the carrier opens its delivery task, then only required delivery contact and address are visible.
- Acceptance: Given an unassigned carrier, when the order address is requested, then the private address is denied.

**FR-AGRI-8817 — Order lifecycle.** The system must maintain separate payment (awaiting, review, confirmed, rejected, refund pending, refunded), fulfillment (unallocated, reserved, preparing, dispatched, delivered, completed, cancelled), and support/dispute states. Labels shown to buyers must describe the current combined state without equating paid, dispatched, or delivered with acceptance. Transitions must record actor, UTC time, reason, and required evidence.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Buyer reads own order; scoped payment and fulfillment actors. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given a verified goods payment and reserved stock, when fulfillment starts, then the order advances to preparing with actor/time evidence while payment remains separately recorded.
- Acceptance: Given an unpaid order or unauthorized actor, when a paid/preparing transition is attempted, then the transition fails and an actionable reason is shown.

**FR-AGRI-8818 — Late payments and unavailable stock.** The system must place verified payments received after reservation expiry into an exception workflow that offers authorized fulfillment or a refund resolution without silently substituting goods.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Payment and fulfillment staff; buyer owns decision. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given a confirmed payment after stock reservation expiry, when reconciliation runs, then the buyer sees a resolution-required state and an authorized fulfill/refund route.
- Acceptance: Given stock is unavailable, when the same event is replayed, then no oversale, unconsented substitution or duplicate refund is created.

**FR-AGRI-8819 — Dispatch and receipt.** The system must record pickup or dispatch evidence, shipment reference when available, delivery status, and receipt evidence. Carrier delivery status and buyer acceptance must remain distinguishable.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Assigned fulfillment staff; buyer confirms own receipt. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given a dispatched order with evidence, when the buyer opens My Orders, then shipment or pickup reference, latest status and problem-report action appear.
- Acceptance: Given carrier-delivered status without customer acceptance, when completion is evaluated, then the system does not falsely claim buyer acceptance or remove support rights.

**FR-AGRI-8820 — Cancellation and returns.** The system must show owner-approved category-specific cancellation, return, live-plant handling, refund, and warranty rules before purchase and apply the version accepted on the order.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Buyer owns request; authorized support and finance. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given an order and its accepted return policy, when the buyer requests a valid cancellation or return, then affected items, reason, policy, next step and case status are recorded.
- Acceptance: Given expired membership, when the buyer requests warranty or return support, then membership expiry does not hide the request route or change order terms.

### Payments and financial records

**FR-AGRI-8821 — Provider-verified payments.** Automatic payment integration must use the platform payment contract and verify payee, reference, amount, currency, and final provider state before updating an order or entitlement.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Platform integration; customer reads own status. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given a captured provider payment matching payee/amount/currency/reference, when its verified event is received again, then one financial transition applies to the linked purchase.
- Acceptance: Given a forged redirect or mismatched event, when confirmation is attempted, then the purchase remains unconfirmed and the exception is recorded safely.

**FR-AGRI-8822 — Manual bank payment review.** If enabled by the owner for Agri, checkout must show the configured company account, QR, exact total, reference, and review expectations. A customer submits transaction ID and safe evidence; an authorized reviewer matches the bank statement before approval or rejects with a reason.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* T1 access buyer or T2 goods buyer; payment reviewer. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given configured bank details and matching statement entry, when a reviewer approves submitted evidence, then approval records the reference, reviewer and one linked grant or paid order.
- Acceptance: Given a screenshot-only claim or reused transaction ID, when approval is attempted, then no financial approval or new grant occurs.

**FR-AGRI-8823 — Rejected payment recovery.** The system must preserve the purchase snapshot and review history while allowing correction and resubmission of rejected evidence on the same payment, subject to stock and quote revalidation for goods.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Payment owner; authorized reviewer. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given a rejected payment and correctable evidence, when its owner resubmits, then the same payment retains previous reviews and returns to review after goods prerequisites are revalidated.
- Acceptance: Given a succeeded payment or expired goods terms, when evidence or commercial fields are edited, then approved records remain unchanged and any new terms require consent.

**FR-AGRI-8824 — Receipts and refunds.** The system must issue accurate receipts for confirmed payments and record authorized refunds with amount, currency, reason, external confirmation, and linked purchase. Access revocation, stock, and fulfillment consequences must follow disclosed policy.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Customer own receipts; finance reviewer. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given a confirmed partial refund, when finance reconciles it, then one refund record and updated refundable amount appear with any access or goods consequence.
- Acceptance: Given a failed provider refund or excess refund amount, when finance attempts completion, then money is not marked returned and an excessive refund is refused.

**FR-AGRI-8825 — Commercial settings and audit.** Authorized staff must configure supported methods, bank details, prices, fees, policies, review expectations, and service availability with validation, versioning, and audit. Checkout must remain closed when required settings are absent.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Commercial administrator. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given complete owner-approved settings, when authorized staff enable a cleared purchase type, then validated settings and policy version become effective with an audit entry.
- Acceptance: Given missing mandatory commercial settings or unauthorized staff, when checkout is enabled, then sales remain disabled.

### Manufacturing and service offerings

**FR-AGRI-8826 — Manufacturing enquiry.** A signed-in customer must be able to request a private quote for a machine, component, fabrication, or installation with intended use, specifications, quantity, destination, desired date, and safe attachments.
*Priority:* Must. *Release:* R3. *Status:* Proposed. *Access:* T1 requester, own request; assigned technical staff. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given an authorized requester and safe fabrication specification, when the enquiry is submitted, then one private reference and review state are visible to the requester and assigned staff.
- Acceptance: Given unassigned staff or another customer, when the drawings are requested, then access is denied.

**FR-AGRI-8827 — Quotation and acceptance.** An authorized commercial role must issue a versioned quote specifying deliverables, exclusions, price and currency, milestones, delivery, installation, warranty, IP rights, expiry, and acceptance criteria. The customer must accept the exact current quote.
*Priority:* Must. *Release:* R3. *Status:* Proposed. *Access:* Quote owner and authorized commercial staff. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given a current approved quote and authorized customer, when the exact version is accepted, then one acceptance stores price, deliverables, license, milestones and UTC time.
- Acceptance: Given expired quote or unauthorized organizational signer, when acceptance is attempted, then no project authorization occurs.

**FR-AGRI-8828 — Manufacturing progress and changes.** An accepted project must expose milestones, customer actions, approved changes, inspection or acceptance evidence, and next steps. Work must not start before contractual payment and safety prerequisites are met.
*Priority:* Must. *Release:* R3. *Status:* Proposed. *Access:* Project customer; assigned delivery staff. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given an accepted project and proposed change, when authorized parties approve it, then versioned schedule/cost changes and agreed acceptance evidence are preserved.
- Acceptance: Given unapproved change or unmet contractual prerequisite, when work start or delivery acceptance is attempted, then the transition is blocked.

### Administration, support, privacy, and reporting

**FR-AGRI-8829 — Publication and availability governance.** Offerings must follow draft, submitted, changes requested, approved, published, paused, archived, and rejected states with audit history. Publication requires mandatory disclosures, reviewed rights, and category and regional clearance.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Catalog editor drafts; authorized reviewer publishes. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given a complete cleared draft and authorized reviewer, when publication is approved, then only the approved version becomes public with its history preserved.
- Acceptance: Given an unapproved editor or restricted category, when publication is attempted, then the draft remains unavailable for sale.

**FR-AGRI-8830 — Support and notices.** The system must provide support for access, payment, delivery, warranty, and manufacturing requests and send accurate payment, access-expiry, and order notices through approved platform channels.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Customer owns case; assigned support. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given a confirmed purchase needing help, when its customer opens a support case, then an assigned case, expected next step and truthful status notices appear.
- Acceptance: Given an unrelated user or expired paid access, when the case is accessed, then unrelated access is denied and the rightful customer retains purchase support.

**FR-AGRI-8831 — Private files and input boundaries.** The system must validate input and allow-listed attachment type, size, and content; scan files before use; keep private evidence and technical uploads behind short-lived scoped access. User URLs must not trigger unrestricted server fetching.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Authorized uploader and scoped recipient. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given a supported scanned private attachment, when the authorized recipient requests it, then a time-limited scoped retrieval succeeds.
- Acceptance: Given unscanned/malicious file or arbitrary fetch URL, when upload/use is attempted, then the material is quarantined or rejected without unrestricted fetching.

**FR-AGRI-8832 — Tenant and owner isolation.** Every protected record must enforce tenant or owner scope on the server and applicable database policies. Staff must receive only their assigned permissions and private fields needed for the task.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Record owner; scoped active staff. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given assigned fulfillment permission, when staff update their order, then delivery changes succeed without exposing private drawings or bank evidence.
- Acceptance: Given another tenant's identifier or expired membership, when a protected request is made, then safe denial occurs and a schema-compliant event contains no private evidence.

**FR-AGRI-8833 — Privacy, export, and retention.** The system must use platform privacy workflows for verified export and deletion requests, minimizing delivery, payment, and support data. Launch requires approved retention periods, processor responsibilities, and legal-hold rules; receipts may remain when retention is required.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Verified data subject; authorized privacy operator. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given a verified privacy request and approved retention rules, when export/deletion is processed, then only permitted data is returned or removed and retained financial records are explained.
- Acceptance: Given an unverified requester or legal hold, when deletion is attempted, then no unauthorized disclosure or removal occurs.

**FR-AGRI-8834 — Operational reporting.** Authorized staff must see recorded access sales, goods revenue, manufacturing revenue, refunds, stock exceptions, payment review age, and fulfillment status separately, with defined periods and currencies. Revenue must not be labeled profit without cost data.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Scoped commercial or operations staff. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given confirmed payments, pending reviews and refunds in one currency, when staff select a time range, then reports separate goods/access/manufacturing, pending money, refunds and recognized revenue.
- Acceptance: Given mixed currencies or missing cost data, when a combined profit figure is requested, then no undisclosed conversion or unsupported profit is presented.

**FR-AGRI-8835 — Mobile usability and interruption recovery.** Core discovery, access purchase, goods checkout, quote request, and support must work at phone width, with keyboard and assistive technology, light and dark themes, clear English, and safe retry after interruption. Same-phone QR payment must offer saving the QR and copying payment fields.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Each workflow's authorized actor. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given a valid mobile checkout with saved inputs, when connection drops and the user retries, then safe inputs return and the same purchase reference is used.
- Acceptance: Given a payment timeout, when status is displayed, then it remains pending/unknown until verified rather than showing success.

**FR-AGRI-8836 — Launch controls and support ownership.** Operations must keep purchasing disabled for unsupported categories, regions, payment methods, or unmet release prerequisites. Opening sales requires named ownership, approved policies and costs, stock and delivery readiness, user evidence, and restore and rollback evidence.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Authorized operations; founder approves release. *Source:* [Owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), [platform dependencies](#platform-dependencies), and the acceptance baseline below.
- Acceptance: Given completed recorded category and release prerequisites, when authorized operations open sales, then only approved categories/regions/methods become purchasable.
- Acceptance: Given missing approval or failed readiness evidence, when sales activation is attempted, then sales remain closed even if CI passes.

### Customer value and operational completeness

**FR-AGRI-8837 — Search, comparison and purchase suitability.** The system must let customers search by product name and applicable specification, filter by offering type, price basis, delivery area and availability, and compare only compatible category fields. It must distinguish stock-backed goods from quote-only or coming-soon items.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* T0 published catalog. *Source:* [Product-manager review](#product-manager-review-and-release-focus), [owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), and [platform dependencies](#platform-dependencies).
- Acceptance: Given two published pumps with disclosed specifications, when a buyer compares them, then units, included components, compatibility and total-price basis appear consistently.
- Acceptance: Given unavailable or incompatible products, when comparison or buying is attempted, then missing data is labeled and the system does not invent suitability or enable unavailable checkout.

**FR-AGRI-8838 — Paid-benefit disclosure and membership policy.** Every paid offering must state the exact benefit, access scope, period, fulfillment responsibility, exclusions and any further goods charges. Before enabling goods checkout, the owner must explicitly choose whether paid membership is required. Recommendations are not default business approvals; an undecided policy must keep purchasing disabled.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Commercial administrator; customers read. *Source:* [Product-manager review](#product-manager-review-and-release-focus), [owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), and [platform dependencies](#platform-dependencies).
- Acceptance: Given an approved membership policy and benefit scope, when an unpaid user views a locked paid action, then the required plan, benefit and separately priced goods are explained.
- Acceptance: Given missing policy, expired membership where required, or unspecified benefit, when checkout is attempted, then the protected action is denied without charging; existing orders and support remain visible.

**FR-AGRI-8839 — Entitlement fulfillment and payment reconciliation.** The system must reconcile confirmed payments against exactly one purchase and required grant/order update, recording unresolved and duplicate events. Paid-but-not-granted access must be retried safely and exposed to assigned operations; it must not be silently shown as fully delivered.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Authorized integration and operations; owner reads. *Source:* [Product-manager review](#product-manager-review-and-release-focus), [owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), and [platform dependencies](#platform-dependencies).
- Acceptance: Given a verified payment whose grant failed, when reconciliation retries fulfillment, then one grant is created or a visible resolution case remains.
- Acceptance: Given an unrelated payment or duplicate event, when reconciliation repeats, then no second grant/order/refund is created or linked to another customer.

**FR-AGRI-8840 — Damaged, wrong and missing goods claims.** Customers must be able to report damaged, incorrect, missing or undelivered purchased items under the disclosed policy with safe evidence. A case must preserve order/batch references, owner, decision reasons, next action and appeal route; reported carrier delivery must not close it automatically.
*Priority:* Must. *Release:* R1. *Status:* Proposed. *Access:* Buyer owns claim; assigned support/finance. *Source:* [Product-manager review](#product-manager-review-and-release-focus), [owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), and [platform dependencies](#platform-dependencies).
- Acceptance: Given a buyer receives a damaged seed pack, when a valid claim is submitted, then an assigned case and policy-based resolution are visible.
- Acceptance: Given an unrelated actor or duplicate claim, when the case is modified or replayed, then private evidence remains restricted and no duplicate compensation is approved.

**FR-AGRI-8841 — Batch traceability and recall handling.** When seeds, plants or batch-controlled goods are sold, staff must record the supplied lot on fulfilled order lines. A reviewed recall must block affected lots, identify affected orders within authorized scope, and issue necessary customer instructions without disclosing other buyers.
*Priority:* Must. *Release:* R1 when batch-controlled goods launch. *Status:* Proposed. *Access:* Inventory and authorized safety/support staff. *Source:* [Product-manager review](#product-manager-review-and-release-focus), [owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), and [platform dependencies](#platform-dependencies).
- Acceptance: Given a reviewed recall for a supplied lot, when operations activate it, then new sales stop and affected buyers receive the approved notice.
- Acceptance: Given an unrelated lot or unauthorized editor, when recall records are requested or changed, then unrelated sales/customer details are not exposed or modified.

**FR-AGRI-8842 — Commercial license and deliverable fulfillment.** Paid drawings or manufacturing designs must specify whether the customer receives viewer access, downloadable files, commercial manufacturing rights, or a selected combination. Purchased versions, formats, license scope and post-expiry rights must be disclosed and preserved; Edu's view-only rule must not be copied onto goods or licenses without suitability review.
*Priority:* Must. *Release:* Any release selling designs/licenses, including R1 if its paid pilot requires them. *Status:* Proposed. *Access:* Entitled licensee and authorized content/legal roles. *Source:* [Product-manager review](#product-manager-review-and-release-focus), [owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), and [platform dependencies](#platform-dependencies).
- Acceptance: Given a purchased download-enabled license, when the customer requests its purchased version, then the permitted deliverable and recorded rights are available under the accepted terms.
- Acceptance: Given viewer-only or expired rights that do not include ongoing retrieval, when a restricted download or commercial license is requested, then unsupported rights are not granted.

**FR-AGRI-8843 — Renewal cancellation and unavailable paid services.** Customers must be able to cancel future renewal according to disclosed platform terms while retaining paid-period access. If a promised paid resource/service becomes unavailable, operations must notify affected customers and provide an authorized restore, extension or refund resolution without silently substituting the offer.
*Priority:* Must. *Release:* R1 for renewable access. *Status:* Proposed. *Access:* Customer owns access; authorized operations/finance. *Source:* [Product-manager review](#product-manager-review-and-release-focus), [owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), and [platform dependencies](#platform-dependencies).
- Acceptance: Given an active paid period and cancellation, when the customer cancels future renewal, then the end date and remaining access are shown without a new charge.
- Acceptance: Given unavailable promised material or failed renewal payment, when access status is evaluated, then no false availability, automatic debt or unconsented extension charge appears.

**FR-AGRI-8844 — Consent-aware journey measurement.** The system must measure discovery-to-purchase and purchase-to-fulfillment stages separately for access, goods and quotes, using approved minimal telemetry. Reporting must distinguish failed payments, pending review, confirmed purchase, access delivery and physical fulfillment; numerical business targets require approved baselines.
*Priority:* Should. *Release:* R2. *Status:* Proposed. *Access:* Authorized product analyst, scoped aggregates. *Source:* [Product-manager review](#product-manager-review-and-release-focus), [owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), and [platform dependencies](#platform-dependencies).
- Acceptance: Given recorded events for a defined cohort and period, when an analyst opens a funnel, then stage definitions, cohort, currency and source are shown without private evidence.
- Acceptance: Given replayed events or private address/drawing data, when telemetry is ingested, then duplicates do not inflate purchase counts and private payloads are rejected.

### Inventory, delivery and operational readiness

**FR-AGRI-8845 — Stock receiving and provenance.** The system must record supplier receipts by item/variant, fulfillment location, quantity, unit, received date, supplier reference, ownership and applicable lot/serial, expiry and purchase cost with currency. Sellable, reserved, quarantined and damaged quantities must be distinct; only cleared sellable stock may be reserved.
*Priority:* Must. *Release:* R1 for the applicable purchase type. *Status:* Proposed. *Access:* Assigned inventory, fulfillment, support or finance staff; customers see their own status only. *Source:* [Product-manager review](#product-manager-review-and-release-focus), [owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), and [platform dependencies](#platform-dependencies).
- Acceptance: Given an inspected receipt, when authorized staff clear its accepted quantity, then only that quantity becomes sellable and its provenance remains linked to fulfillment.
- Acceptance: Given a duplicate receipt, rejected inspection or missing mandatory lot, when receiving is retried, then stock is not doubled and uncleared units cannot be sold.

**FR-AGRI-8846 — Stock adjustments and returned goods.** The system must maintain an auditable inventory movement history for receipts, reservations, dispatch, release, returns and adjustments. Corrections require a reason and configured authority; returned goods require inspection before restocking. Reconciliation must expose discrepancies without silently replacing recorded balances.
*Priority:* Must. *Release:* R1 for the applicable purchase type. *Status:* Proposed. *Access:* Assigned inventory, fulfillment, support or finance staff; customers see their own status only. *Source:* [Product-manager review](#product-manager-review-and-release-focus), [owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), and [platform dependencies](#platform-dependencies).
- Acceptance: Given a returned unit inspected as saleable, when authorized staff approve restocking, then one movement restores the accepted quantity with its lot and inspection reference.
- Acceptance: Given a refund alone, damaged return or repeated adjustment request, when inventory is updated, then no automatic or duplicate sellable stock is created.

**FR-AGRI-8847 — Delivery eligibility and commitment.** The system must validate item and destination eligibility before payment instructions and disclose delivery or pickup method, all charges, dispatch/delivery estimate basis and handling constraints in the accepted order snapshot. Address, quantity or method changes require revalidation and explicit acceptance of a changed total.
*Priority:* Must. *Release:* R1 for the applicable purchase type. *Status:* Proposed. *Access:* Assigned inventory, fulfillment, support or finance staff; customers see their own status only. *Source:* [Product-manager review](#product-manager-review-and-release-focus), [owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), and [platform dependencies](#platform-dependencies).
- Acceptance: Given eligible goods and a supported destination, when checkout is reviewed, then the full charge, method and estimate are visible before payment.
- Acceptance: Given an unsupported destination, restricted plant movement or stale delivery quote, when checkout proceeds, then payment instructions remain unavailable until eligibility and price are resolved.

**FR-AGRI-8848 — Failed delivery and pickup exceptions.** The system must record failed delivery, return-to-sender and uncollected pickup with reason, custody, assigned owner and customer next action. Redelivery, storage, cancellation and refund outcomes must follow the accepted policy; time-sensitive plants require disclosed handling and escalation. Extra charges and substitutions require customer agreement.
*Priority:* Must. *Release:* R1 for the applicable purchase type. *Status:* Proposed. *Access:* Assigned inventory, fulfillment, support or finance staff; customers see their own status only. *Source:* [Product-manager review](#product-manager-review-and-release-focus), [owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), and [platform dependencies](#platform-dependencies).
- Acceptance: Given a failed delivery, when fulfillment records it, then the buyer sees the reason and policy-based next action while the case remains open.
- Acceptance: Given an expired pickup window or proposed replacement, when staff resolve the exception, then no false completion, unconsented extra charge or automatic restock occurs.

**FR-AGRI-8849 — Review and refund service commitments.** The system must use approved response and resolution targets for payment review, access delivery, dispatch exceptions, claims and refunds, with an assigned responsible role, business-time basis and escalation route. Show the applicable expectation and next action to customers; distinguish refund approval from verified refund completion.
*Priority:* Must. *Release:* R1 for the applicable purchase type. *Status:* Proposed. *Access:* Assigned inventory, fulfillment, support or finance staff; customers see their own status only. *Source:* [Product-manager review](#product-manager-review-and-release-focus), [owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), and [platform dependencies](#platform-dependencies).
- Acceptance: Given a pending review or refund, when its approved deadline passes, then the assigned operations queue flags it overdue and escalates without falsely confirming completion.
- Acceptance: Given missing service targets or an unverified refund result, when the affected purchase is enabled or status updated, then the launch gate fails or the refund remains pending respectively.

**FR-AGRI-8850 — Scoped operations action queue.** The system must provide assigned staff a permission-scoped queue for payment review, paid-but-not-granted purchases, stock discrepancies, dispatch delays, claims, recalls and pending refunds. Each entry must show age, priority, responsible role, current state and permitted next action; completed work leaves the active queue only after its verified resolution.
*Priority:* Must. *Release:* R1 for the applicable purchase type. *Status:* Proposed. *Access:* Assigned inventory, fulfillment, support or finance staff; customers see their own status only. *Source:* [Product-manager review](#product-manager-review-and-release-focus), [owner brief](../../02-products/agri/README.md#owner-brief-and-evidence), and [platform dependencies](#platform-dependencies).
- Acceptance: Given authorized staff and outstanding cases, when the queue is filtered, then relevant assigned work and overdue items appear with links to their source records.
- Acceptance: Given an unrelated tenant, unauthorized role or stale action, when a queue item is opened or resolved, then access is denied or state revalidated without exposing private data or duplicating a financial action.

## Out of scope

Independent sellers and commissions, escrow, customer balances, auction trading, farm-management subscriptions, remote irrigation control, agronomic prescriptions, guaranteed yields, organic certification services, carbon credits, financing, insurance, native mobile apps, and unrestricted AI actions are excluded from the initial proposal. Unsupported regulated products, imports, live-plant movements, chemical categories, and manufacturing safety claims remain unavailable until qualified review. No compliance or certification is claimed merely by collecting a document.

## Proposed delivery slices and acceptance journeys

Priority uses the standard Must/Should/Could values. Release labels are proposals: R1 is the first paid pilot, R2 strengthens a proven offering, and R3 adds custom manufacturing. Conditional requirements become mandatory before their category or feature opens. A requirement outside the current slice does not block that slice when its dependent feature is disabled.

### R1 — A complete agricultural purchasing pilot

Select one customer segment and a small supplier-backed catalog in one supported delivery area. All owner-requested categories remain target scope; only cleared stock-backed categories launch. Prefer simple tools/equipment for initial fulfillment testing, with seeds/plants gated by batch, handling and regulatory readiness. This sequencing is a recommendation, not a restriction approved by the owner. Recommend one fulfillment location and complete-order shipments for the pilot. Partial shipment, substitution, backorder and cross-border delivery stay disabled until explicitly scoped and approved; stock failure requires a customer-visible resolution rather than an unapproved substitute.

Provide a free informative catalog, one clearly defined valuable paid-access offering if validated, separate goods checkout, verified payment, access delivery, fulfillment, customer account, support, cancellation/refund readiness, and required privacy/security controls. No general subscription is sold merely to reveal ordinary product specifications. Paid-only purchasing remains possible if the owner approves its value and membership terms.

- Access journey: free preview → clear included value/terms → plan selection → verified payment → access → expiry or renewal. Test pending review, rejection/resubmission, duplicate approval, paid-but-not-granted recovery and exact expiry.
- Goods journey: search/compare → select unit/variant → delivery validation → approved membership check → final total → reservation → payment → dispatch → receipt → support. Test price changes, last-unit races, late payment, damaged goods and refund confirmation.
- Seeds/plants journey, when launched: batch disclosure → cleared destination → lot-linked dispatch → handling information → claim or recall. Test expired/recalled stock and affected-buyer notification.
- Cross-scope journey: different customer, tenant, role, carrier and suspended membership attempt protected reads and writes; all denied paths must preserve privacy and financial state.

### R2 — Strengthen demonstrated demand

Consider complimentary grants (8812), richer journey analytics (8844), additional commercial-design offerings (8842, mandatory whenever sold), additional cleared categories, and relevant Edu links. Discounts, bundles, paid support, recurring subscriptions and marketing automation require separate scoped requirements before delivery; their names alone do not approve them.

### R3 — Custom manufacturing delivery

Enable 8826–8828 and applicable 8842 only after supplier/engineering ownership, safety review, quoting capacity and commercial/IP terms are approved. Test private enquiry → current quote → authorized acceptance → prerequisite payment → milestones and changes → agreed acceptance → warranty. Reject expired quotes, unapproved change orders and unrelated access to customer drawings.

## Open decisions and release gate

| Decision | Required evidence or approval | Decider |
| --- | --- | --- |
| Agri within Market or independent product | Boundary decision resolving ADR-013 and current Market scope; architecture ADR before implementation | Founder |
| Initial seller | Confirm Oxinov-only store or separately scope third-party marketplace | Founder |
| Meaning of paid access | Per offering, membership, or both; exact included value; approved purchase prerequisite policy (8838); checkout closed while undecided | Founder |
| Manufacturing scope | Finished products, fabrication, technical designs, licensing, or a selected subset | Founder |
| Commercial terms | Approved prices, access periods and renewal/cancellation, lifetime service obligations, digital license/download and expiry rights, payment methods, tax treatment, returns and warranties | Founder with billing and qualified legal review |
| Paid pilot value | One actual paid offer with named benefit owner, sample deliverable, rights, support obligation, direct cost and customer evidence; basic buying information stays free | Founder and product owner |
| Fulfillment and service policy | Stock ownership and receipt/inspection rules; delivery coverage and fees; partial-shipment policy; failed delivery/pickup rules; review, claims and refund targets with escalation (8845–8850) | Founder with operations and billing |
| Initial customers and supply | One pilot segment, observed demand, initial assortment, supplier/stock ownership, batch and recall handling, supported delivery area and readiness | Product owner, unassigned |
| Data, rights and regulatory review | Classification, lawful use and IP rights, retention, processor contracts, seed/plant and equipment restrictions, manufacturing safety | Qualified reviewers, unassigned |
| Product and operating owners | Named product, engineering, finance, fulfillment, support, privacy and incident responsibilities | Founder |
| Funding and capacity | Development/support funding, measured node headroom, recurring cost estimate against NFR-18, explicit spend approval | Founder |
| User acceptance | Prototype and end-to-end accessibility, devices, browser translation, low bandwidth, trust and recovery evidence | Product owner, unassigned |
| Release evidence | Required tests, threat review, backup/restore, operational monitoring, rehearsals when applicable, rollback and category disable route | Operations owner, unassigned |

Each gate needs a decision, accountable owner, dated approval and linked evidence recorded in the product record or appropriate ADR. Unresolved categories and purchase types remain disabled; enabling one requires its applicable gates, not just a general product approval.

A request to write this FRD authorizes discovery documentation. It does not close these gates, approve a deployment, change sign-in, set prices, or authorize spending. All requirements remain Proposed until individually reviewed. Documentation rollback is a revert of this change; no production or data rollback is needed.

## Related documents

- [Agri product record](../../02-products/agri/README.md)
- [Requirements standard](../README.md)
- [Platform blueprint](../../01-company/platform-blueprint.md)
- [Market FRD](market-frd.md)
- [Edu store decision](../../04-architecture/adr/adr-028-edu-knowledge-store.md)
- [Agri discovery reservation proposal](../../04-architecture/adr/adr-029-agri-requirements-discovery.md)

