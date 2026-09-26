# Search Console and Bing Webmaster Tools

[SEO index](README.md) · Terraform: `devops/terraform/environments/production/edge` (`search_verification_txt` in `variables.tf`, used in `mail.tf`)

Search engines show search data (queries, clicks, countries, indexing errors) only to verified owners. Verification is a DNS TXT record, managed in Terraform like every other AWS resource.

## Verify Google (one time)

1. **Owner:** in [Google Search Console](https://search.google.com/search-console), add a **Domain** property for `oxinov.com` and copy the TXT value `google-site-verification=…`. The value is public, so it can be committed.
2. **Engineering:** add it to `search_verification_txt` in `edge/variables.tf` (validated by pattern), run `terraform plan`, and apply only after the owner's "yes apply". The plan must show **one added TXT value** on the apex record and nothing else; the Zoho verification and SPF values stay unchanged.
3. **Owner:** click **Verify** (DNS can take a few minutes).
4. **Owner:** in **Sitemaps**, submit `https://oxinov.com/sitemap.xml`.
5. **Owner:** in **Settings → Users and permissions**, add a second owner so access is not tied to one person.

## Verify Bing (one time)

In [Bing Webmaster Tools](https://www.bing.com/webmasters), choose **Import from Google Search Console**. No DNS record is needed. The sitemap is imported too.

## Other search engines

Add them only when a market launches where they matter (for example Naver in Korea, Yandex, Baidu). Each uses the same pattern: a TXT value in Terraform or an import.

## After verification

- **Indexing:** Pages → check that all public pages are indexed within about two weeks. Use **URL inspection → Request indexing** for new important pages.
- **Errors:** fix anything under Pages "Not indexed" that is a public page, and every Core Web Vitals or HTTPS issue.
- **Monthly:** the review in [measurement.md](measurement.md).
