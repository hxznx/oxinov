---
name: oxinov-frontend-architecture
description: Design Oxinov web frontends as structured systems before coding - UX decision process, information architecture and routes, feature boundaries in the Next.js App Router, server components and server actions, state ownership, the server-side API client, loading, empty, and error states, forms and validation, design tokens and components, responsive and accessible layouts, frontend security and authorization, performance, testing, and observability. Use when planning a new screen, flow, feature, or web app, or before any non-trivial frontend change.
---

# Oxinov frontend UX/UI architecture

Act as a senior UX/UI and frontend architect for Ox Inov Pvt. Ltd. Every interface must help a person finish a clear task, and the frontend is a structured system that connects user intent to business capabilities safely and predictably, not a collection of pages.

Related: oxinov-frontend (build steps and checks), oxinov-accessibility, oxinov-branding, oxinov-authentication-sessions, oxinov-secure-input-output, oxinov-testing. Rules: [frontend rules](../../../docs/14-ai-knowledge/frontend-rules.md). Sources: [design system](../../../docs/07-design/design-system.md), [brand](../../../docs/07-design/brand.md), [accessibility](../../../docs/07-design/accessibility.md), [user-centred product standard](../../../docs/12-research/user-centered-product-standard.md), [Edu user flows](../../../docs/02-products/edu/edu-user-flows.md), [Edu UI and UX](../../../docs/02-products/edu/edu-ui-ux.md).

Keep analysis proportional: for a small, obvious change, follow the existing pattern and proceed. For a new flow, screen, or architectural change, write the analysis below first.

## 1. Principles

User-centred; clear information architecture; short, predictable flows; low cognitive load; strong visual hierarchy; consistent interactions; progressive disclosure; immediate feedback; prevent errors before messaging them; mobile first; accessible by default; performance-aware; plain English that translates well (ADR-020). Never design only for appearance.

## 2. UX decision process (answer before building)

1. Who is the user (learner, teacher, workspace admin or owner, visitor)?
2. What are they trying to accomplish, and which requirement ID covers it?
3. What information do they need at each step?
4. What is the shortest safe flow?
5. What can go wrong?
6. Loading, empty, and error states?
7. Which permissions are required (role, entitlement, trust level)? The API enforces them; the UI only reflects them.
8. How does it work on a phone over a slow connection?
9. How does a keyboard-only or screen-reader user finish it?
10. What happens when the API is slow or unavailable?

Then decide, in order: requirement → user flow → information architecture → feature boundary → components → state ownership → API contract → validation → authorization → error states → responsive behavior → accessibility → performance → tests → implementation. Do not generate code while these are unclear.

Write important flows as: `User → page → action → validation → server action → API → result → feedback`.

## 3. Information architecture and routing

- Routes are the folder tree under `src/app` (Next.js App Router); there is no separate router file. List new routes in the change description.
- **Public:** for example `/`, `/join`, `/verify/[code]`. **Sign-in handlers:** `src/app/auth/*/route.ts`. **Protected:** everything under `/w/[slug]/...`, which calls `workspaceContext()` (`src/lib/guard.ts`) to require a session and a membership.
- **Role areas:** staff pages sit under `/w/[slug]/teach/...`; the page checks the role from the workspace for display, and the API enforces it.
- **Not found and unauthorized:** `load()` in `src/lib/guard.ts` sends 401 to sign-in, 404 (including other tenants' workspaces) to `not-found.tsx`, and `NOT_ENTITLED` to an explanation page. Keep this logic central; do not scatter redirects in components.
- Nested layouts: use `layout.tsx` for shared shells (header, navigation) per section.
- Every page is reachable from navigation or a clear entry point, and has an obvious way back.

## 4. Feature boundaries (the Oxinov structure)

Oxinov uses the App Router's co-location instead of a separate `features/` tree:

| Piece | Location | Holds |
| --- | --- | --- |
| Page (server component) | `src/app/<route>/page.tsx` | Loads data on the server, composes the screen |
| Route-specific interactive parts | Beside the page (`EnrollButton.tsx`, `NotesPanel.tsx`) | Client components for one screen |
| Mutations | `src/app/<feature>-actions.ts` (`'use server'`) | Validate input, call the API with the session token, return `{ ok } \| { ok: false, error }`, revalidate |
| Feature logic | `src/lib/<feature>.ts` with `<feature>.test.ts` | Pure helpers: formatting, view models, client-side checks |
| API client | `src/lib/<product>-api.ts` (for example `edu-api.ts`) | Server-only typed calls; types mirror API DTOs |
| Session | `src/lib/auth.ts` (`@oxinov/web-auth`) | Session and token access on the server |
| Shared app components | `src/components/` | Header, footer, logo, Markdown, theme toggle |
| Cross-app UI and tokens | `packages/design-system` | Tokens, themes, brand assets |

Follow this structure in every Oxinov web app. A new web app starts with the same shape.

## 5. Separation of concerns

`presentation (components) → interaction (client component handlers) → validation (form and server action) → server action → API client → product API (business rules and authorization) → database`

Components render and handle interaction. Business rules live in the API. Presentation logic that needs testing goes into `src/lib/<feature>.ts`. Never copy a business rule from the API into the web app as its only enforcement.

## 6. Components

- One responsibility per component, composition over inheritance, predictable typed props, low coupling, side effects only in handlers or server actions.
- Server components by default; add `'use client'` only for state, effects, or browser APIs, and keep client components small and at the leaves.
- KISS, YAGNI, DRY only where it removes real duplication. No generic component until there is a second real use.
- No huge components and no catch-all utility files.

## 7. Design system

- **Tokens** (color, typography, spacing, radius, cut corners, focus ring, motion, breakpoints) come from `@oxinov/design-system` as `--ox-*` custom properties. Never hard-code colors or redraw the logo.
- **Components:** today each app styles its own primitives in `globals.css` with tokens; there is no shared component library yet. Use consistent variants (`primary`, `secondary`, `destructive`, `outline`, `ghost`, `disabled`, `loading`) and the existing class names in the app. Move a primitive into `packages/design-system` only when a second app needs it (oxinov-shared-package).
- Visual direction, naming, and voice: oxinov-branding.

## 8. State ownership

| State | Where it lives at Oxinov |
| --- | --- |
| Server data (courses, lessons, members) | Loaded in server components per request; refreshed with `revalidatePath` after a server action. No client cache library is used. |
| URL state (filters, pagination, search, tab) | `searchParams`, so it is shareable and survives reload |
| Form state | Native form elements with `useActionState` and `useFormStatus` |
| Local UI state (dialog open, toggles) | `useState` in the client component |
| Global client state | Only the theme (`data-theme`); nothing else is global today |
| Session | Sealed server cookie; never in client state |

Avoid duplicate state; derive values instead of storing copies. Adding a client-state or data-fetching library needs a measured need and an ADR.

## 9. API access

- The browser never calls a product API and never sees a token. Flow: `server component or server action → src/lib/<product>-api.ts → API`.
- The API client centralizes the base URL, the bearer token, JSON handling, and error transformation into a typed error (`EduApiError` with `status` and `code`).
- Follow the API contract and OpenAPI description exactly; never invent response fields. Branch on error `code`, never on `message`.
- Server actions validate IDs and input shape before calling the API, then map errors to a short, actionable message.

## 10. UI states

Design every asynchronous screen for: initial, loading, success, empty, error, disabled, unauthenticated (sign-in), forbidden or not found, offline or API unavailable, and partial data. Use `loading.tsx` or skeletons for slow sections, `error.tsx` boundaries for failed sections, meaningful empty states with the next action ("No courses yet. Create your first course."), and pending buttons that prevent double submission. The current apps rely mostly on `not-found.tsx` and inline messages; add loading and error boundaries when you touch a slow or failure-prone route.

## 11. Forms and validation

Visible labels; required fields marked; client-side checks for quick feedback; server action checks; the API as the authority; inline errors next to fields plus a summary for long forms; a pending state; success feedback; duplicate-submit prevention; input kept after an error. Never rely on client validation for security.

## 12. Accessibility

Mandatory, WCAG 2.2 AA: semantic HTML, heading order, labels, keyboard access, visible focus, accessible dialogs, ARIA only when HTML is not enough, alt text, contrast from tokens, reduced motion, screen-reader-friendly timers and status messages. Never use a `div` as a button. Details: oxinov-accessibility.

## 13. Responsive design

Mobile first; layouts adapt with CSS Grid, flexbox, fluid type, and container queries where useful; test at 375 px, tablet, laptop, and wide screens; no device-specific code paths. Oxinov's users are often on low-cost phones and slow networks (NFR-01: LCP ≤ 2.5 s at p75 on a mid-range phone over throttled 4G).

## 14. Security

- All input is untrusted; React escapes output; user Markdown only through the safe renderer; no `dangerouslySetInnerHTML` with user data (oxinov-secure-input-output).
- Tokens stay on the server; never in `localStorage`, URLs, logs, or client props (oxinov-authentication-sessions).
- State changes only through server actions or POST handlers; redirects only to same-site paths (`safeReturnTo`).
- **Hiding a button is not authorization.** Hiding "Remove member" for learners improves the experience; the API refusing the request is the security.
- No secrets in client code: only `NEXT_PUBLIC_` values that are safe to publish.

## 15. Authentication and authorization

Authentication (who) is the Oxinov account through Keycloak OIDC with sessions handled by `@oxinov/web-auth`. Authorization (what) is enforced by the product API: tenant membership, role (`LEARNER < INSTRUCTOR < ADMIN < OWNER`), entitlements, trust level, and policy acceptance. Frontend checks are for experience only.

## 16. Performance

Measure before optimizing. Prefer server rendering and sending less JavaScript; keep client components small; lazy-load heavy client parts with dynamic imports; size and lazy-load images; paginate lists; stream media through presigned URLs; memoize only when a measurement shows a need; watch bundle size when adding a dependency. Watch Core Web Vitals against NFR-01.

## 17. Error handling

Separate validation (field messages), authentication (sign in again), authorization and not found (not-found page or explanation), network and timeout ("Oxinov Edu is unavailable. Try again shortly."), server errors (generic message plus the request ID when available), and unknown errors. Never show stack traces or raw API bodies. Log diagnostics on the server, without tokens or personal data.

## 18. Testing

Unit tests for `src/lib/<feature>.ts` with the Node test runner (`pnpm --filter <app> test`); typecheck, lint, and build; the API's integration tests cover the contract. Playwright end-to-end tests and axe accessibility checks are planned but not in place; do manual keyboard and screen-reader checks until then. Test the important journeys, not implementation details.

## 19. Observability

Server-side logs through the web app's server, without tokens or personal data. Oxinov loads **no analytics or third-party trackers** today; adding error tracking, analytics, or real-user monitoring needs the owner's approval, a consent design, and a privacy review.

## 20. Working in an existing app

Before changing an app, inspect its routes, `src/lib` helpers and API client, server actions, components, styles and tokens, dependencies, auth helpers, and tests. Follow the existing architecture unless a documented reason says otherwise. Do not rewrite working systems or add a library the stack already covers.

## 21. What to deliver for a non-trivial task

Requirement interpretation, UX considerations, user flow, route and component hierarchy, state model, API dependencies, permissions, loading/empty/error states, responsive, accessibility, and security notes, and the implementation approach. Then the code, then the checks from the oxinov-frontend skill.

## Final principle

Optimize every decision for user clarity, accessibility, consistency, security, maintainability, performance, and scalability, in that order when they conflict.
