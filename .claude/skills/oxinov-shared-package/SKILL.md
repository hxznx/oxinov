---
name: oxinov-shared-package
description: Create or change an Oxinov shared library in packages/ - deciding whether code is truly cross-product, the implemented packages (server-kit, web-auth, design-system) versus placeholders, pnpm catalog and workspace rules, build output, and testing every consumer. Use before extracting code into packages/ or changing a shared package.
---

# Oxinov shared packages

Rules: [architecture rules](../../../docs/14-ai-knowledge/architecture-rules.md), [coding rules](../../../docs/14-ai-knowledge/coding-rules.md). Sources: [company library standard](../../../docs/08-engineering/company-library-standard.md), [dependency policy](../../../docs/08-engineering/dependency-policy.md).

## The packages

| Package | State | Used by |
| --- | --- | --- |
| `@oxinov/server-kit` | Implemented: config, auth, errors, HTTP hardening, logger, metrics, request context, security events | Every API |
| `@oxinov/web-auth` | Implemented: OIDC with PKCE, sealed sessions, return-to checks | Every web app with sign-in |
| `@oxinov/design-system` | Implemented: tokens, themes, contrast checks, brand assets | Every web app |
| `auth`, `config`, `contracts`, `domain`, `observability`, `security-events`, `testing` | Placeholders (README only) | - |

## Decide first: does it belong in `packages/`?

Yes only when all are true:

- Two or more applications need it now, not "one day".
- Its responsibility is stable and cross-product (identity, HTTP safety, tokens, contracts).
- It holds no one product's business rules. Product rules stay in that product, even if two products look similar.

Otherwise keep it in the application. Prefer extending an implemented package over filling a placeholder.

## Steps for a change

1. Change the package; keep its public API small and exported from `src/index.ts`.
2. Never import an application from a package.
3. Add dependencies through the pnpm catalog (`pnpm-workspace.yaml`, `catalogMode: strict`) with exact versions; run `pnpm install` and `node scripts/validate-workspace.mjs`.
4. Build and test the package: `pnpm --filter @oxinov/<name> build` and `test`. APIs import `server-kit` from its compiled output.
5. Run the checks of **every consumer** (typecheck, lint, test, and build for web apps).
6. A breaking change updates all consumers in the same change.
7. A change to a package listed in a service's `inputs` in `services.yaml` rebuilds that image on push.

## Filling a placeholder

Treat it like a new component: a real second consumer, a README with purpose and commands, tests, and the package's build wired into the consumers. `packages/contracts/<slug>` is where API and event contracts go when a product needs shared types (oxinov-api-design, oxinov-events-and-jobs).
