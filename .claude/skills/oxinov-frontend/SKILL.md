---
name: oxinov-frontend
description: Build or change an Oxinov Next.js web app (edu-web, platform-web, company-web) - pages, components, server actions, sign-in sessions, design tokens, accessibility, and performance. Use for any change under frontend/ or packages/web-auth and packages/design-system.
---

# Oxinov frontend (Next.js App Router)

Rules: [frontend rules](../../../docs/14-ai-knowledge/frontend-rules.md). Sources: [design system](../../../docs/07-design/design-system.md), [accessibility](../../../docs/07-design/accessibility.md), [Edu UI and UX](../../../docs/02-products/edu/edu-ui-ux.md).

## Where things are

| App | Folder | Package | Local port | Notes |
| --- | --- | --- | --- | --- |
| Oxinov Edu | `frontend/products/edu-web` | `@oxinov/edu-web` | 3002 | Signs in through Keycloak; calls the Edu API |
| Account portal | `frontend/platform-web` | `@oxinov/platform-web` | 3001 | Calls the platform API |
| Company website | `frontend/company-web` | `@oxinov/company-web` | - | Static export; use the oxinov-seo skill |

In `edu-web`: pages under `src/app/` (workspace pages under `src/app/w/`), server actions in `src/app/*-actions.ts`, shared components in `src/components/`, helpers and their tests in `src/lib/`. Sessions and API calls go through `@oxinov/web-auth` (`packages/web-auth`).

## Steps

1. Find the requirement ID and the journey in [Edu user flows](../../../docs/02-products/edu/edu-user-flows.md) or the FRD.
2. Make the page a **server component** that loads data through the API on the server. Use a client component only for interaction that needs the browser.
3. Handle forms with a **server action**: read the form, call the API with the session's token on the server, then `redirect` or `revalidatePath`. Show the API's error message for `VALIDATION_FAILED`; never trust the form alone.
4. Style with tokens only: `var(--ox-color-...)`, `var(--ox-cut-md)`, `var(--ox-focus-ring)`. Import `@oxinov/design-system/tokens.css`. Logo files come from the design-system brand assets.
5. Check accessibility: one `h1`, labelled inputs, keyboard access, visible focus, contrast, captions for media, and accessible timers for exams.
6. Check phone width (375 px) and the dark and light themes.
7. Keep the page fast: no heavy client libraries, images sized, fonts self-hosted.
8. Write plain English that translates well; use `translate="no"` only on brand names and code.

## Check

```bash
pnpm --filter @oxinov/design-system build
pnpm --filter @oxinov/edu-web typecheck
pnpm --filter @oxinov/edu-web lint
pnpm --filter @oxinov/edu-web test
pnpm --filter @oxinov/edu-web build
```

To see it running, follow the web app part of the [quickstart](../../../docs/00-onboarding/quickstart.md) (Keycloak, Mailpit, and the Edu API are needed for sign-in).

## Never

- Put an access token, API secret, or session data in client components, `localStorage`, or URLs.
- Hard-code colors or redraw the logo.
- Show a planned feature or product as available.
