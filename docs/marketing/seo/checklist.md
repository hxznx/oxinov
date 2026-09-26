# SEO checklists

[SEO index](README.md)

## New public page

- [ ] Added to `sitemapEntries` in `frontend/company-web/src/seo/routes.ts`.
- [ ] `export const metadata = pageMetadata({ path, title, description })`: title of 60 characters or fewer; unique description of 50–160 characters.
- [ ] One `h1` with the main keyword ([keywords.md](keywords.md)); headings in order; alt text on images.
- [ ] Structured data where a schema fits ([structured-data.md](structured-data.md)); breadcrumbs on nested pages.
- [ ] Plain English that translates well; `translate="no"` only on the brand name.
- [ ] Linked from at least one existing page.
- [ ] `pnpm --filter @oxinov/company-web build` and `test` pass (the tests check canonical URLs, descriptions, structured data, sitemap, and fonts).
- [ ] After deploy: **URL inspection → Request indexing** in Search Console.

## Every release of the website (automatic in CI)

- Every page has a canonical URL, a unique description, link-preview data, and valid structured data.
- `sitemap.xml` lists exactly the public pages; `robots.txt` points to it; the 404 page is `noindex`.
- Preloaded fonts stay within 150 KB; no third-party scripts.

## Monthly

- [ ] The review in [measurement.md](measurement.md).
- [ ] New official profiles added to `socialProfiles` (`src/seo/config.ts`).

## Quarterly

- [ ] Read the home, products, and pricing pages through browser translation (for example Spanish, Arabic, Hindi) and fix sentences that translate badly.
- [ ] Rich Results Test on home, contact, and products.
- [ ] PageSpeed Insights on mobile for home and products.
