---
name: oxinov-payments
description: Build or change Oxinov payments and billing - the Khalti and eSewa provider adapters, server-side verification, amounts in minor units, idempotent fulfilment, entitlements after payment, the production payments switch, and the planned subscriptions and ledger. Use for any change involving money, checkout, prices, refunds, or plans.
---

# Oxinov payments

Sources: [Platform FRD](../../../docs/03-requirements/frd/platform-frd.md) (PLAN 2601-2699, PAY 2701-2799), [subscription model](../../../docs/01-company/subscription-model.md), [current state](../../../docs/04-architecture/current-state.md). Decisions: ADR-012 (subscriptions, proposed), ADR-013 (no customer balance), ADR-023 (Khalti and eSewa).

## Today

- Edu sells one-time paid courses through **Khalti and eSewa** (`backend/products/edu-api/src/payments/`).
- The checkout is **built but off in production**: `payments.mode: sandbox` in the chart and no merchant keys. `payments.sellerTenantIds` in `values-production.yaml` names Oxinov's own workspace ("OxinovJP", `/w/nepal`), the only one that sells; bank QR plans (ADR-028) work there now. Turning card/wallet checkout on needs the owner's merchant keys in Parameter Store and the owner's decision.
- Subscriptions, coupons, refunds, and a platform billing service are not built. Plan prices in the subscription model are proposals.

## Edu access plans and bank QR (ADR-028, being built)

- Every Edu offering sells **access plans**: 1 month, 6 months, 1 year, lifetime (owner defaults NPR 5,000 / 10,000 / 15,000 / 20,000, editable per offering) (FR-CATALOG-305). Copy plan, duration, price, and currency onto the payment at checkout; a renewal extends from the current end, never from today; lifetime has no `endsAt`.
- **Bank QR is a manual provider** (FR-CATALOG-307, FR-MGMT-1403): the learner pays the company QR, then submits the bank transaction ID and a screenshot. The payment is `PENDING_REVIEW` and grants nothing. Only a seller-workspace administrator's approval grants the entitlement, in the same transaction, once. A transaction ID belongs to one payment per seller; rejection needs a reason; every decision is audited.
- Screenshots are private uploads (type and size checked, scanned, served inline only to reviewers).
- Approval sends the thank-you notice, rejection sends the reason (FR-COMM-703); free access from an admin is an `ADMIN_GRANT` with a reason, never a fake payment (FR-MGMT-1404).
- **Card payments** for learners abroad wait for a gateway account (FR-CATALOG-308): hosted page only, never touch card numbers.

## How a payment works

1. The API creates a payment record and asks the provider to start checkout (`PaymentProvider.start`).
2. The browser goes to the provider and comes back.
3. **The browser's return proves nothing.** The server asks the provider (`PaymentProvider.verify`). Only `COMPLETED` with the expected amount grants access (FR-PAY-2701); `PENDING` is checked again later; `FAILED` ends it.
4. Fulfilment grants the entitlement once, even if verification runs twice (unique constraints and idempotent updates).

## Rules

- Money is an integer in minor units with an explicit currency code. Never floats.
- Verify every provider result on the server, with signature or HMAC checks and constant-time comparison where the provider signs data.
- Process each provider event once; design for retries and replays.
- Oxinov never holds a customer balance; escrow is a ledger state and funds stay with licensed providers (ADR-013).
- Provider keys live in Parameter Store; tests use fakes injected through `PAYMENT_PROVIDERS`.
- Never log card data, provider secrets, or full provider responses with personal data.
- Structured data and pages never show invented prices.

## Steps for a change

1. Cite the FR ID (PAY, PLAN, or the product's own).
2. Put provider-specific code behind the `PaymentProvider` interface; add a provider only with an ADR (the provider choice is a recorded decision).
3. Test success, pending, failed, wrong amount, replayed verification, and a user trying to pay for another tenant's course.
4. Emit `oxinov_payment_fulfillment_failures_total{provider,reason_code}` and security events for suspicious results.
5. Mobile store purchases follow FR-MOBILE-1503 (oxinov-mobile).
6. Anything that changes prices, providers, or turns payments on in production needs the owner's approval.
