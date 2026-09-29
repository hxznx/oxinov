# Oxinov company website (`frontend/company-web`)

Public website of **Ox Inov Pvt. Ltd.** at `oxinov.com`. It is a Next.js App Router site exported as static files (`output: 'export'`) for Amazon S3 behind CloudFront. There is no Node server in production.

## What it contains

| Route | Content |
| --- | --- |
| `/` | Home: headline, values, product status cards |
| `/about/` | Company story, mission, vision |
| `/products/` and `/products/<slug>/` | Oxinov Edu (in development) and the three coming-soon products, each with its own page (features, audience, FAQ) |
| `/divisions/` and `/<slug>/` | The ten divisions, each at `oxinov.com/<slug>` (education, ai, engineering, services, robotics, studio, agritech, space, research, production) |
| `/pricing/` | The plan ladder; prices are published at launch |
| `/careers/`, `/contact/`, `/security/` | Company contact routes |
| `/legal/` and `/legal/<doc>/` | Policy pages (text pending legal review) |

All copy lives in `src/content/site.ts`. Search and sharing settings (titles, descriptions, canonical URLs, sitemap, structured data) live in `src/seo/`, one file per job; see [its README](src/seo/README.md) and the [SEO plan](../../docs/13-marketing/seo/README.md). Styling uses Tailwind CSS mapped to `@oxinov/design-system` tokens; components never hard-code colors. Dark is the default theme, the Daylight theme follows the device until the visitor chooses, and reduced motion turns animation off.

## Commands (from the repository root)

```bash
pnpm --filter @oxinov/design-system build
pnpm --filter @oxinov/company-web dev
pnpm --filter @oxinov/company-web build
pnpm --filter @oxinov/company-web test
```

`build` copies the approved logo files from the design system into `public/brand/` and writes the static site to `out/`. `test` checks the exported pages: every route exists, one `h1`, unique titles and descriptions, `lang`, skip link, image alt text, no broken internal links, honest product status, regulated-division labels, no placeholders or retired names, no analytics or third-party scripts, and search and sharing (canonical URLs, descriptions, structured data, sitemap, `noindex` 404 page, font budget).

## Owner inputs still needed before launch

| Item | Where it goes |
| --- | --- |
| Contact email, careers email, phone, street address, office hours, company registration number | `company` in `src/content/site.ts` (shown as "To be announced" until set) |
| Reviewed policy text | `/legal/*` pages (FR-POLICY-2401) |
| Contact form backend with rate limiting | Arrives with `api.oxinov.com` (FR-SITE-2104); until then contact details only |
| Prices | `/pricing/` after the plan catalogue is approved (FR-SITE-2103) |

## Assistant skills

Coding assistants working here follow [oxinov-frontend-architecture](../../.claude/skills/oxinov-frontend-architecture/SKILL.md), [oxinov-seo](../../.claude/skills/oxinov-seo/SKILL.md), [oxinov-frontend](../../.claude/skills/oxinov-frontend/SKILL.md), [oxinov-branding](../../.claude/skills/oxinov-branding/SKILL.md), [oxinov-accessibility](../../.claude/skills/oxinov-accessibility/SKILL.md), [oxinov-testing](../../.claude/skills/oxinov-testing/SKILL.md). All rules and skills: [AI knowledge](../../docs/14-ai-knowledge/README.md).
