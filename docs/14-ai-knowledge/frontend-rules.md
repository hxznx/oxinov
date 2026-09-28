# Frontend rules

The rules for the web apps (Next.js App Router), in short form. Read them before you add or change a page, a component, or a server action.

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

Source: [AGENTS.md](../../AGENTS.md) sections 6.2 and 6.3, [brand](../07-design/brand.md), [design system](../07-design/design-system.md), [accessibility](../07-design/accessibility.md), [SEO](../13-marketing/seo/README.md), and [NFR](../03-requirements/nfr.md).

## Apps

| App | Folder | Address |
| --- | --- | --- |
| Company website (static export) | `frontend/company-web` | `oxinov.com` |
| Account portal | `frontend/platform-web` | `app.oxinov.com` |
| Oxinov Edu | `frontend/products/edu-web` | `edu.oxinov.com` |

## Must

- Call APIs from server components and server actions, so tokens never reach the browser. `@oxinov/web-auth` keeps sessions in sealed server cookies.
- Use design tokens from `@oxinov/design-system` (`var(--ox-color-...)`), and the logo files from its brand assets.
- Meet WCAG 2.2 AA: keyboard access, visible focus, labels, contrast, captions, and accessible timers.
- Work at phone width and meet NFR-01: LCP ≤ 2.5 s at p75 on a mid-range phone over throttled 4G.
- Write every interface in plain English that translates well (ADR-020). Use `translate="no"` only on brand names and code. Keep full Unicode and right-to-left support for user content.
- Give every public website page its title, description, canonical URL, and structured data through `frontend/company-web/src/seo`, and add it to `routes.ts` (NFR-19).
- Show honest product status: never present a planned product as available.

## Never

- Hard-code colors, redraw or recolor the logo, or add a font the tokens do not name.
- Ask a customer to set a password; sign-in is Google, Apple (iOS), or an email one-time code.
- Invent prices, ratings, or reviews in page copy or structured data.
- Add analytics or trackers without the owner's approval and a consent design.

## Checks

`pnpm --filter <package> typecheck`, `lint`, `test`, and `build`; for the website, `pnpm --filter @oxinov/company-web build` then `test`.

Skills: [oxinov-frontend](../../.claude/skills/oxinov-frontend/SKILL.md), [oxinov-branding](../../.claude/skills/oxinov-branding/SKILL.md), [oxinov-seo](../../.claude/skills/oxinov-seo/SKILL.md).
