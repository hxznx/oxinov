---
name: oxinov-payments
description: Build or change Oxinov payments and billing - the Khalti and eSewa provider adapters, server-side verification, amounts in minor units, idempotent fulfilment, entitlements after payment, the production payments switch, and the planned subscriptions and ledger. Use for any change involving money, checkout, prices, refunds, or plans.
---

# Oxinov payments

Sources: [Platform FRD](../../../docs/03-requirements/frd/platform-frd.md) (PLAN 2601-2699, PAY 2701-2799), [subscription model](../../../docs/01-company/subscription-model.md), [current state](../../../docs/04-architecture/current-state.md). Decisions: ADR-012 (subscriptions, proposed), ADR-013 (no customer balance), ADR-023 (Khalti and eSewa).

## Today

- Edu sells one-time paid courses through **Khalti and eSewa** (`backend/products/edu-api/src/payments/`).
- The checkout is **built but off in production**: `payments.mode: sandbox` in the chart and no seller workspace in `payments.sellerTenantIds`. Turning it on needs the owner's merchant keys in Parameter Store and the owner's decision.
- Subscriptions, coupons, refunds, and a platform billing service are not built. Plan prices in the subscription model are proposals.

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
