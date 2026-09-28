# Data flow

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

## Sign-in and single sign-on (platform)

Person chooses Continue with Google or email one-time code at `id.oxinov.com` -> identity provider verifies the account -> platform links or creates the Oxinov user by internal ID -> first sign-in shows the welcome screen and records Terms and Privacy acceptance -> platform grants member entitlements for launched products -> the requesting app receives tokens through its backend -> opening another Oxinov app reuses the `id.oxinov.com` session without another sign-in. See [identity and access](identity-and-access.md).

## Trust step-up (platform)

Product API rejects an action with `TRUST_LEVEL_REQUIRED` or `POLICY_ACCEPTANCE_REQUIRED` -> client shows the one required step -> platform verifies phone, KYC, or business documents, or records policy acceptance -> platform updates the trust level and emits an event -> the product retries the original action.

## Subscription and entitlements (platform)

Person picks a plan on `oxinov.com/pricing`, `app.oxinov.com/billing`, or in an app store -> payment provider or store confirms server-side -> platform records the subscription and grants entitlement keys and limits -> products check entitlements and report usage events -> platform enforces limits and shows usage. See the [subscription model](../01-company/subscription-model.md).

## LMS sign-in and tenant choice

Identity provider verifies the account -> API loads active tenant memberships from PostgreSQL -> user selects a workspace -> each request validates the membership, role, and tenant address -> PostgreSQL RLS and application rules scope reads/writes.

## Purchase

API creates a tenant-scoped checkout -> provider returns a signed event -> API stores the event ID and queues fulfillment -> worker updates payment and entitlement in one transaction -> learner receives access. A browser redirect never grants access.

## Commodity Market escrow order

Buyer at T2 places an order -> market API asks the platform ledger to open an escrow record -> buyer pays through a licensed provider or bank escrow account -> ledger confirms funds held -> seller dispatches -> inspection window starts, optionally with an inspection partner report -> buyer approves or raises a dispute -> ledger instructs settlement to the seller's verified account minus commission, or refund after arbitration. Oxinov never holds a stored-value balance. See the [Commodity Market charter](../02-products/market/market-charter.md).

## Learning and exams

Web/mobile requests short-lived media access -> player reports progress -> API stores tenant-scoped progress. Exam attempt freezes blueprint and questions, autosaves answers, then server grades and records a result version.

## AI draft

Authorized prompt -> tenant-scoped input retrieval -> structured proposal -> preview -> explicit approval -> draft creation -> human publication review. No direct SQL, shell, refund, or cross-tenant action.

## Security operations

Identity, application, cloud, database-audit, and runtime sources emit normalized security events -> collector validates and enriches the schema -> access-controlled SIEM stores events -> Sigma rules and correlation create findings -> severity routing opens a SOC runbook -> responders record actions and protected evidence outside Git.
