# Content plan

[SEO index](README.md) · Keywords: [keywords.md](keywords.md) · Copy source: `frontend/company-web/src/content/site.ts`

Content is what ranks. Technical SEO only makes sure search engines can read it.

## Page briefs (in order)

| # | Page | Main keyword | Must include | Status |
| --- | --- | --- | --- | --- |
| 1 | Oxinov Edu product page `/products/edu/` | online classroom software | What it does in one sentence; features; who it is for; honest status; link to `edu.oxinov.com`; FAQ | **Live 2026-09-26.** Next: real screenshots and a short video |
| 2 | Oxinov Edu vs Google Classroom | Google Classroom alternative | Factual, dated comparison table; when the other product is the better choice | Planned |
| 3 | How to create an online quiz with a timer | create online quiz with timer | Steps with screenshots; a short captioned video | Planned |
| 4 | Online classroom for small schools | LMS for small schools | Costs, setup time, what a school needs | Planned |
| 5 | Oxinov Edu vs Moodle | Moodle alternative | Same format as #2 | Planned |

The other products have pages too (`/products/commodity-market/`, `/products/jobs/`, `/products/services-market/`) that describe planned features and say clearly that they are not open yet. Product copy, features, and FAQs live in `products` in `src/content/site.ts`; list only features that work today for a product people can use.

Each new page follows the [new page checklist](checklist.md#new-public-page).

## Writing rules

- One clear topic per page; the answer in the first paragraph.
- Plain global English that translates well: short sentences, no idioms or slang, no culture-specific jokes (voice rules in [brand](../../design/BRAND.md)).
- Original screenshots and videos with English captions; examples from many countries.
- Every article links to the product page; the product page links to the best articles.
- Comparison pages stay factual, dated, and fair; update them when either product changes.
- Review every page once a year and update its date only when the content really changed.

## Cadence

Two English articles a month from month 2, each with a tutorial video on YouTube embedded in the article. Promote each through the channels in the [marketing plan](../MARKETING.md).
