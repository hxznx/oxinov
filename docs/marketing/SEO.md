# Search engine optimisation (SEO)

**Status:** Audit and plan, 2026-09-26. **Owner:** founder (content), engineering (technical items). Related: [marketing plan](MARKETING.md), [brand](../design/BRAND.md), website code `frontend/company-web`.

Oxinov's audience is **global** and its only language is **English** (ADR-020). Search is planned as **one English site ranked worldwide**: people search in English from every country, and people who prefer another language read our pages through browser translation.

## Audit of oxinov.com (2026-09-26)

| Area | Today | Impact |
| --- | --- | --- |
| Page titles and descriptions | Site-wide default and template in `layout.tsx`; pages use `metadata` | Good start; each page needs its own description. The default title "Technology built in Nepal" describes origin, not audience (see [brand](../design/BRAND.md#brand-strategy)) |
| `sitemap.xml` | **Missing** | Search engines find pages slower |
| `robots.txt` | **Missing** | No sitemap pointer |
| Social share images (Open Graph, 1200 × 630) | **Missing** | Plain, image-less link previews everywhere |
| Structured data (JSON-LD) | **Missing** | No rich results; no Organization facts for search engines |
| Language markup | English only (correct under ADR-020) | Add `translate="no"` on brand names so translators keep them intact |
| Web app manifest and icons | **Missing** | No home-screen icon on Android |
| Canonical URLs | Not set | Risk of duplicate URLs |
| HTTPS, HSTS, global CDN | Done (CloudFront, worldwide edge locations) | Good |
| Fonts | 10 font files (about 372 KB) preloaded | Slower first view on phones and slow networks; see [brand typography T1–T3](../design/BRAND.md#typography-1) |
| Search Console, Bing Webmaster Tools, business profiles | Not set up | No search data |

## Technical fixes (engineering, in `frontend/company-web`)

1. **`app/sitemap.ts`** listing every public page with `lastModified`.
2. **`app/robots.ts`** allowing everything and pointing to `https://oxinov.com/sitemap.xml`.
3. **Per-page metadata:** a unique title (≤ 60 characters), description (≤ 155 characters), and `alternates.canonical`.
4. **Open Graph images** per page type (`opengraph-image.tsx`), plus `twitter-image`, with short English text.
5. **JSON-LD structured data:**
   - `Organization` (name, logo, URL, `sameAs` social profiles, contact points with languages served) on every page;
   - `LocalBusiness` for the headquarters office (Lalitpur) on the contact page, alongside global contact options;
   - `SoftwareApplication` for Oxinov Edu (EducationalApplication, `offers` in USD and local currencies once prices are set);
   - `FAQPage` on pricing and product pages; `BreadcrumbList` on nested pages.
6. **One English site, translation-friendly:** `lang="en"` on every page; no language subfolders and no `hreflang`; never block translation (no `translate="no"` except on "Oxinov", product names, and code); keep text as real text, not inside images; let layouts stretch when a translator lengthens words; never redirect by the visitor's country.
7. **Worldwide signals without translated pages:** local currency on pricing pages, contact options across time zones, and customer stories from many countries (in English).
8. **Manifest and icons:** `app/manifest.ts` with 192, 512, and maskable icons from the approved app icon.
9. **Performance everywhere:** Core Web Vitals "good" on a low-cost Android phone on a slow 4G connection (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1; NFR-01); Latin fonts only on the website (brand T3).
10. **CI check:** every page has `lang="en"`, a unique title, description, canonical URL, and valid JSON-LD; `sitemap.xml` lists every route.

**Product apps:** pages behind sign-in on `edu.oxinov.com` and `app.oxinov.com` are `noindex`. Later, public course pages of organisations that opt in can be indexable with `Course` structured data, which can bring organic traffic from every country.

## Keywords and content

Target clusters, all in English (validate worldwide volumes in Search Console and keyword tools before writing):

| Cluster | Example English searches | Page or article |
| --- | --- | --- |
| Online classroom software | "online classroom software", "LMS for small schools", "Google Classroom alternative", "Moodle alternative" | Edu product page and comparison pages |
| Exams and practice | "online mock exam maker", "create online quiz with timer", "practice test platform" | Product sections; how-to articles |
| Teaching how-to | "how to teach online", "how to run an online exam", "how to sell online courses" | Articles with embedded YouTube tutorials |
| Language and skill schools | "software for language schools", "coding bootcamp LMS", "training institute management software" | Industry pages |
| Company | "Oxinov", "Oxinov Edu" | Home, About, profiles |

**Content rules:** one clear topic per page; the answer in the first paragraph; plain global English that translates well; original screenshots and videos with English captions; examples from many countries; link articles to the product page; update yearly. Comparison pages stay factual and dated.

## Off-site

- **Search engines:** Google Search Console and Bing Webmaster Tools, verified through Route 53 DNS records (managed in Terraform, `edge` stack), sitemap submitted. In markets where other engines matter, add them when the market launches (for example Naver in Korea, Yandex, or Baidu).
- **Business profiles:** Google Business Profile for the headquarters office; software directories and review sites used worldwide (for example G2, Capterra, Product Hunt at launch), with only genuine reviews.
- **Links:** education and technology publications in each market, partner and customer websites, conference and webinar pages. No paid link schemes.
- **Social profiles** listed in the `Organization` `sameAs` field so search engines connect them to Oxinov.

## Measuring

| Metric | Target by month 6 | Tool |
| --- | --- | --- |
| Pages indexed | All public pages | Search Console, Bing |
| Clicks from search | 3,000 per month, from 10 or more countries | Search Console |
| Branded search position ("Oxinov") | 1 worldwide | Search Console |
| Core Web Vitals | All "good" | Search Console, PageSpeed Insights |
| Rich results | Organization and FAQ valid | Rich Results Test |

## Order of work

1. Week 1: sitemap, robots, canonical URLs, per-page descriptions, share images, `Organization` JSON-LD, manifest, new global site title (engineering, about 1 day).
2. Week 1: verify Search Console and Bing through Terraform DNS records; claim business profiles (owner).
3. Weeks 2–4: font budget (brand T1–T3), `SoftwareApplication` and FAQ data; the English Edu product page and first comparison page.
4. Month 2 onward: two English articles a month, tutorial videos with captions, and a quarterly check that key pages read well through browser translation.
5. Monthly: review Search Console by country, fix errors, and update keywords.
