---
name: oxinov-seo
description: Add or change a public page on the oxinov.com company website - routes, page metadata, canonical URLs, structured data, sitemap, honest product status, and the site tests. Use for any change under frontend/company-web.
---

# Oxinov website pages and search

Rules: [frontend rules](../../../docs/14-ai-knowledge/frontend-rules.md). Sources: [SEO](../../../docs/13-marketing/seo/README.md), [`src/seo` README](../../../frontend/company-web/src/seo/README.md), NFR-19.

## The website

`frontend/company-web`: a Next.js static export served from private S3 behind CloudFront at `oxinov.com`. Content comes from `src/content/site.ts`; everything search engines read lives in `src/seo/`. It loads no analytics. It deploys through `.github/workflows/deploy-company-web.yml` on push to `main`.

## Adding a public page

1. Add it to `sitemapEntries` in `src/seo/routes.ts`.
2. Export `metadata = pageMetadata({ path, title, description })` from the page, with a unique description of 50-160 characters in plain English.
3. Add structured data with `<JsonLd data={...} />` when a schema fits (breadcrumbs for nested pages).
4. Give the page one `h1`, alt text on every image, and working links.
5. Describe products honestly: only Oxinov Edu is live; others are planned or proposed.
6. Check:

   ```bash
   pnpm --filter @oxinov/company-web build
   pnpm --filter @oxinov/company-web test
   ```

   The tests fail on a missing canonical URL, a duplicate or wrong-length description, invalid JSON-LD, a page missing from the sitemap, a missing `h1` or alt text, broken links, dishonest product status, or trackers.

## Never

- Invent prices, ratings, reviews, or awards in copy or structured data.
- Add analytics or third-party trackers without the owner's approval and a consent design.
- Write in another language or add translations; English only (ADR-020). `translate="no"` only on the brand name.

## Keyword and content work

Keyword research and the content plan live in [keywords](../../../docs/13-marketing/seo/keywords.md) and the [content plan](../../../docs/13-marketing/seo/content-plan.md). Anything published outside the site (profiles, posts, directories) needs the owner's approval.
