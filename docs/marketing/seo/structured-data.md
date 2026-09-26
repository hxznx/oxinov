# Structured data (schema.org JSON-LD)

[SEO index](README.md) · Code: `frontend/company-web/src/seo/schema/` · Rendered by `src/seo/JsonLd.tsx`

Structured data tells search engines facts about Oxinov in a machine-readable form. It can earn rich results (logo, breadcrumbs, FAQs) and connects the company, its office, its products, and its profiles.

## Live

| Schema | Pages | File | Source of facts |
| --- | --- | --- | --- |
| `Organization` (name, legal name, logo, address, contact point: English, worldwide) | Every page | `schema/organization.ts` | `company` in `src/content/site.ts` |
| `WebSite` (English, published by the organization) | Every page | `schema/organization.ts` | `src/seo/config.ts` |
| `LocalBusiness` (Lalitpur headquarters, hours) | `/contact/` | `schema/office.ts` | `company` in `src/content/site.ts` |
| `ItemList` of `SoftwareApplication` (each product, web, publisher) | `/products/` | `schema/products.ts` | `products` in `src/content/site.ts` |
| `BreadcrumbList` | Division and policy pages | `schema/breadcrumbs.ts` | Page data |

## Planned

| Schema | When | Notes |
| --- | --- | --- |
| `sameAs` on `Organization` | Each official profile goes live | Add the URL to `socialProfiles` in `src/seo/config.ts` |
| `SoftwareApplication` with `offers` | Prices are approved | USD plus local currencies; never placeholder prices |
| `FAQPage` | Pricing or the Edu page has real FAQs | Questions must be visible on the page |
| `Article` | First articles publish | Author, dates, image |
| `Course` | Opt-in public course pages on Edu | Only for organizations that choose it |

## Rules

- Facts come only from our own content files; no value is typed into a schema by hand.
- **Never invent** prices, ratings, reviews, or awards. Search engines penalize markup that the page does not show.
- Every item has `"@context": "https://schema.org"` and valid JSON (tested).
- After a change, check a page with Google's [Rich Results Test](https://search.google.com/test/rich-results) and the [Schema Markup Validator](https://validator.schema.org/).
