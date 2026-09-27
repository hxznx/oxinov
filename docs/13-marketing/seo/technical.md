# Technical SEO

[SEO index](README.md) · Code: [`frontend/company-web/src/seo`](../../../frontend/company-web/src/seo/README.md) · Tests: `frontend/company-web/tests/site.test.mjs` ("search and sharing")

oxinov.com is a static Next.js export served from S3 through CloudFront (HTTPS, HSTS, worldwide edge locations). All search settings are in one folder, one file per job:

| File | Owns |
| --- | --- |
| `src/seo/config.ts` | Site URL, name, default title and description, share image, social profiles |
| `src/seo/routes.ts` | Every public page, with sitemap priority and revisit frequency |
| `src/seo/metadata.ts` | Root defaults, `pageMetadata()` per page, `noIndex` |
| `src/seo/JsonLd.tsx`, `src/seo/schema/*` | Structured data ([structured-data.md](structured-data.md)) |
| `src/app/robots.ts`, `sitemap.ts`, `manifest.ts` | Generated `robots.txt`, `sitemap.xml`, `manifest.webmanifest` |
| `scripts/generate-images.sh` | Share image (1200 × 630) and app icons, from the approved logo |

## Audit and fixes (2026-09-26)

| Area | Before | Now |
| --- | --- | --- |
| Sitemap and robots | Missing | `sitemap.xml` lists all 27 public pages with priorities; `robots.txt` allows all and points to it |
| Titles and descriptions | One default for every page; title described origin, not audience | Every page has a unique title and a unique 50–160 character description |
| Canonical URLs | Not set | Every page |
| Link previews (Open Graph, X) | Missing | Share image and titles on every page |
| Structured data | Missing | See [structured-data.md](structured-data.md) |
| Manifest and icons | Missing | 192, 512, maskable, and Apple touch icons |
| Error page | Indexable | `noindex, follow` |
| Products | One list page | A page per product with features, audience, FAQs, and structured data; linked from home, products, and its division |
| Divisions | Isolated pages | Each describes itself as a department of Oxinov, links its products and the other divisions |
| Fonts | 10 files, about 372 KB preloaded | 2 files, 59 KB preloaded; Latin only (brand T1–T3) |
| Language | English, with a Devanagari font | English only; only the wordmark is `translate="no"`; `security.txt` prefers English |

## Rules for every page

1. **One English site, translation-friendly:** `lang="en"`; never block translation except on "Oxinov", product names, and code; keep text as real text, not inside images; let layouts stretch when a translator lengthens words.
2. **Metadata:** a title of 60 characters or fewer, a unique description of 50–160 characters with the answer in the first sentence, and a canonical URL, all through `pageMetadata()`.
3. **Structure:** one `h1`, headings in order, descriptive link text, alt text on every image.
4. **Speed:** Core Web Vitals "good" on a low-cost Android phone on slow 4G: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 (NFR-01). Preloaded fonts stay within 150 KB (tested).
5. **Worldwide signals without translated pages:** prices in US dollars and local currencies, contact options across time zones, customer stories from many countries (in English).
6. **No third-party scripts or cookies** on the website (tested).

## Product apps

Pages behind sign-in on `edu.oxinov.com`, `app.oxinov.com`, and `id.oxinov.com` are `noindex`. Later, public course pages of organizations that opt in can be indexable with `Course` structured data.

## Known issues

- Next.js prefetch requests for `__next.*.txt` files return 404 on the static site (harmless for search; tracked as a separate fix).
