# `src/seo`: search and sharing for oxinov.com

Everything search engines and link previews read lives here. Pages import from `@/seo` only. The plan and the reasoning behind it are in [docs/marketing/seo](../../../../docs/marketing/seo/README.md).

| File | What it owns | Change it when |
| --- | --- | --- |
| `config.ts` | Site URL, name, default title and description, share image, social profiles | The tagline is approved, a social profile goes live, or the share image changes |
| `routes.ts` | Every public page with its sitemap priority and revisit frequency | You add, remove, or rename a public page |
| `metadata.ts` | Root defaults (`siteMetadata`), `pageMetadata()` for each page, `noIndex` | A page needs a title, description, or canonical URL |
| `JsonLd.tsx` | Renders structured data safely into a page | Rarely |
| `schema/organization.ts` | `Organization` and `WebSite`, on every page | Company facts change (they come from `src/content/site.ts`) |
| `schema/office.ts` | `LocalBusiness` headquarters, on Contact | Office address, phone, or hours change |
| `schema/products.ts` | Product `ItemList`, on Products | A product is added; prices or reviews become real |
| `schema/breadcrumbs.ts` | `BreadcrumbList`, on nested pages | Rarely |
| `schema/address.ts` | Headquarters postal address | Rarely |

Generated at build time from these files: `robots.txt` (`src/app/robots.ts`), `sitemap.xml` (`src/app/sitemap.ts`), and `manifest.webmanifest` (`src/app/manifest.ts`). The share image and icons come from `scripts/generate-images.sh`.

## Adding a public page

1. Add it to `sitemapEntries` in `routes.ts`.
2. Export `metadata = pageMetadata({ path, title, description })` from the page, with a unique 50–160 character description in plain English.
3. Add structured data with `<JsonLd data={…} />` if a schema fits (breadcrumbs for nested pages).
4. Run `pnpm --filter @oxinov/company-web build` and `test`; the "search and sharing" tests fail on a missing canonical URL, a duplicate or bad-length description, invalid JSON-LD, or a page missing from the sitemap.

Rules: English only (ADR-020); never invent prices, ratings, or reviews in structured data; `translate="no"` only on the brand name.
