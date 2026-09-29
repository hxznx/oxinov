---
name: oxinov-platform-integration
description: Connect an Oxinov product to the shared platform - one Oxinov account through Keycloak, a web client and API token audience per product, the platform product catalogue and app launcher, entitlements, policy acceptance, trust levels, and the product accent token. Use when a product needs sign-in, access rules, launcher entries, or cross-product identity.
---

# Connecting a product to the Oxinov platform

Sources: [identity and access](../../../docs/04-architecture/identity-and-access.md), [Platform FRD](../../../docs/03-requirements/frd/platform-frd.md), [API authentication](../../../docs/06-api/api-auth.md), [platform policies](../../../docs/01-company/platform-policies.md). Decisions: ADR-008, ADR-011, ADR-016, ADR-019.

## What the platform gives every product

| Capability | Where it lives | What the product does |
| --- | --- | --- |
| One Oxinov account and sign-in (`id.oxinov.com`) | Keycloak realm `oxinov`, `devops/keycloak/configure-realm.sh` | Uses its own web client; never stores login data |
| Access tokens per product | One audience per product API (`web_client <clientId> <url> <audience>`) | Its API accepts only its own audience (`AUTH_AUDIENCE`) |
| Product catalogue and app launcher (`app.oxinov.com`) | `products` table in `database/platform`, `GET /v1/products` (launched only) | Gets a row with `launched = false` until release |
| Entitlements | `entitlements` table: `product_key`, `entitlement_key` (for example `edu.member`), source `MEMBER`, `PLAN`, or `GRANT` | Checks entitlements on its own server |
| Policy acceptance and trust levels (T0-T4) | Platform API | Requires the level and policy each action needs |
| Brand accent | `ProductKey` and `--ox-color-product-<slug>` in `packages/design-system` | Uses its accent token |

## Steps for a new product

1. **Sign-in client.** Add `web_client oxinov-<slug>-web "$<SLUG>_URL" oxinov-<slug>-api` to `configure-realm.sh`. This changes the production realm on push: rehearse with `bash devops/kubernetes/scripts/rehearse-local.sh`, state the effect, and push only when asked (oxinov-security).
2. **API audience.** Set the product API's `AUTH_ISSUER`, `AUTH_JWKS_URL`, and `AUTH_AUDIENCE=oxinov-<slug>-api` in the chart and `.env.example`. `@oxinov/server-kit` verifies issuer, audience, and signature.
3. **Web sessions.** Use `@oxinov/web-auth` in the web app; tokens stay in sealed server cookies.
4. **Catalogue row.** A new forward-only platform migration inserts the product (`key`, `name`, `address`, `launched = false`). Flip `launched` in a later migration at release. Never edit the old catalogue migration.
5. **Entitlement keys.** Name them `<slug>.<entitlement>`; grant membership entitlements through the platform, never by writing another product's tables.
6. **Accent.** Add the slug to `ProductKey` and its colors in `packages/design-system/src/tokens.ts`, then build and test the design system.
7. **Tests.** A token for another product's audience is refused; a user without the entitlement is denied; unlaunched products do not appear in `/v1/products`.

## Never

- Share a token audience between products, or accept another product's tokens.
- Read platform tables from a product database, or product tables from the platform.
- Put product business rules in `platform-api` or `platform-web`.
- Ask customers for a password; sign-in is Google, Apple (iOS), or an email one-time code.

Edu still uses the audience `oxinov-lms-api` until the [ADR-027 cutover](../../../docs/10-devops/runbooks/edu-rename-cutover.md), part B. New products start with `oxinov-<slug>-api`.
