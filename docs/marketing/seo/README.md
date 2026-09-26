# Search engine optimization (SEO)

**Owner:** founder (content, profiles, approvals); engineering (website code, DNS). **Updated:** 2026-09-26. Related: [marketing plan](../MARKETING.md), [brand](../../design/BRAND.md), [ADR-020 English only](../../architecture/ADR.md).

Oxinov's audience is **global** and its only language is **English** (ADR-020). Search is planned as **one English site ranked worldwide**: people search in English from every country, and people who prefer another language read our pages through browser translation. No language subfolders, no `hreflang`, and no redirects by country.

## Where everything lives

| Topic | Document | Code or config |
| --- | --- | --- |
| Technical SEO: audit, what is live, rules | [technical.md](technical.md) | `frontend/company-web/src/seo/` |
| Structured data (schema.org JSON-LD) | [structured-data.md](structured-data.md) | `frontend/company-web/src/seo/schema/` |
| Search Console and Bing: verification, sitemap, monitoring | [search-console.md](search-console.md) | `devops/terraform/environments/production/edge` (`search_verification_txt`) |
| Keywords | [keywords.md](keywords.md) | — |
| Content plan and page briefs | [content-plan.md](content-plan.md) | `frontend/company-web/src/content/site.ts` |
| Local SEO, profiles, and links | [off-site.md](off-site.md) | — |
| Targets and the monthly review | [measurement.md](measurement.md) | — |
| Checklists: new page, release, monthly | [checklist.md](checklist.md) | `frontend/company-web/tests/site.test.mjs` |

## Status (2026-09-26)

| Area | Status |
| --- | --- |
| Sitemap, robots.txt, canonical URLs, unique descriptions, share image, manifest and icons | Live, tested in CI |
| Structured data: Organization, WebSite, LocalBusiness, products, breadcrumbs | Live, tested in CI |
| 404 page kept out of search (`noindex`) | Live, tested in CI |
| Product pages `/products/<slug>/` for Oxinov Edu, Commodity Market, Jobs, and Services Market, with features, audience, FAQs, and application data | Live, tested in CI |
| Division (department) pages described as departments of Oxinov, linked to their products and to each other | Live, tested in CI |
| Pricing FAQ with FAQPage data | Live, tested in CI |
| Preloaded fonts cut from 372 KB to 59 KB; English-only, translation-friendly markup | Live |
| Google Search Console and Bing verification | Google TXT record published through Terraform (2026-09-26); owner clicks **Verify**, submits the sitemap, then imports into Bing |
| Google Business Profile for the Lalitpur office | **Owner** to claim |
| Approved tagline for the home page title | **Owner** to choose ([brand](../../design/BRAND.md#brand-strategy)) |
| First articles and comparison pages | Planned ([content plan](content-plan.md)) |
| Social profiles in `sameAs` | Add each profile after it exists (`src/seo/config.ts`) |
| Analytics | Not used; the site promises no tracking. Search Console gives search data without cookies |

## Order of work

1. **Now:** verify Search Console and Bing, submit the sitemap ([search-console.md](search-console.md)); claim Google Business Profile.
2. **Weeks 1–4:** approved tagline as the home title; real screenshots on the Edu product page; first comparison page.
3. **Month 2 onward:** two English articles a month and tutorial videos with captions.
4. **Monthly:** the review in [measurement.md](measurement.md). **Quarterly:** read key pages through browser translation in three languages and fix wording that translates badly.
