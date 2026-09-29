---
name: oxinov-mobile
description: Plan or build Oxinov mobile apps (Android and iOS) - the planned Expo React Native clients under frontend/mobile/<slug>, the shared API contract, secure device sessions, offline and retry rules, store purchases, and Google Play and App Store readiness. Use for any mobile app question or task.
---

# Oxinov mobile apps

Sources: [frontend/mobile](../../../frontend/mobile/README.md), [Edu FRD](../../../docs/03-requirements/frd/edu-frd.md) (FR-MOBILE-1501 to 1503), [NFR](../../../docs/03-requirements/nfr.md) (NFR-14), [testing strategy](../../../docs/08-engineering/testing-strategy.md). Decisions: ADR-003 (one shared mobile app, proposed), ADR-024 (Expo in trial for the Edu learner app).

## Today

**No mobile app exists.** `frontend/mobile/` holds only a README. The Edu mobile app is open work in the [task list](../../../docs/11-planning/tasks.md); do not claim mobile support anywhere.

## The planned shape

| Decision | Plan |
| --- | --- |
| Framework | Expo (React Native), TypeScript, one codebase for Android and iOS |
| Location | `frontend/mobile/<slug>/` (the company library standard) |
| Data | The same versioned product API as the web app; never a database, never a separate mobile backend |
| Sign-in | The Oxinov account through the system browser (OIDC with PKCE); tokens only in secure device storage (Keychain, Keystore) |
| Rules | Server-side authorization exactly as for the web app; the app never decides access |
| Brand | Design-system tokens and logo files; plain English (ADR-020) |

## Steps to start the first app (after the owner approves the milestone)

1. Confirm the open decisions with the owner: ADR-003 (one shared app or one per product) and the mobile purchase approach by market (pending in the ADR index). Record them in an ADR.
2. Create the app in `frontend/mobile/<slug>` with a README, add it to the pnpm workspace, and pin versions through the catalog.
3. Add a sign-in client for the app in Keycloak (a production realm change; oxinov-platform-integration, oxinov-security).
4. Build against the OpenAPI contract; share types through `packages/contracts/<slug>` when that package is created.
5. Meet FR-MOBILE-1502: permissions only when needed, upload and recording retry, and no duplicate assignment, exam attempt, message, or purchase after a lost connection (use idempotency keys).
6. Meet FR-MOBILE-1503: verify store receipts or provider events on the server before granting the same entitlement the web app uses.
7. Meet NFR-14 for Google Play: stable package ID, signing, version codes, Data safety form, privacy policy, target API level 36 or higher.
8. Test: unit tests, device flow tests on low-end Android and slow networks, and accessibility (screen readers, font scaling).
9. CI: add a mobile job; store signing keys only in a secret store, never in Git.

## Never

- Put secrets, API keys with write power, or business rules in the app bundle.
- Store tokens in plain storage or logs.
- Ship store purchases without server-side receipt verification.
