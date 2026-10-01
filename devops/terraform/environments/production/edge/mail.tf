# Staff email for oxinov.com on Zoho Mail (zoho.com data centre). Automatic product email (sign-in codes) goes
# from no-reply@oxinov.com through Brevo while Amazon SES has no production access, otherwise through SES.

# Apex TXT values: Zoho domain ownership proof, SPF (only Zoho may send as @oxinov.com; soft-fail others),
# and search engine ownership proofs. Route 53 holds one TXT record set per name, so every apex TXT value
# lives here.
resource "aws_route53_record" "apex_txt" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain
  type    = "TXT"
  ttl     = 300
  records = concat(
    [
      "zoho-verification=zb30003091.zmverify.zoho.com",
      "v=spf1 include:zoho.com ~all",
    ],
    var.search_verification_txt,
    var.brevo_verification_txt == "" ? [] : [var.brevo_verification_txt],
  )
}

# Brevo DKIM (sign-in email while SES is in the sandbox): CNAMEs to Brevo's keys, so Brevo signs as oxinov.com
# and DMARC passes by DKIM alignment. The apex SPF stays Zoho-only; Brevo uses its own bounce domain.
resource "aws_route53_record" "brevo_dkim" {
  for_each = var.brevo_dkim_cnames
  zone_id  = aws_route53_zone.main.zone_id
  name     = "${each.key}.${var.domain}"
  type     = "CNAME"
  ttl      = 300
  records  = [each.value]
}

resource "aws_route53_record" "mx" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain
  type    = "MX"
  ttl     = 300
  records = [
    "10 mx.zoho.com",
    "20 mx2.zoho.com",
    "50 mx3.zoho.com",
  ]
}

# DKIM public key for Zoho's "zmail" selector (2048-bit RSA). A DNS text string holds at most 255
# characters, so the value is split into two strings that resolvers join back together.
locals {
  zoho_dkim = "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1/QfWUH0SxdMDUGktkNLRITfmcusTaz+GGhj+Yf92B/+htwXTmsh/kmQZveRO8cNUCW0opmo36zsoIqfL+PHB9dStkjRGLjIMMZK76UyiIa7KpDuW5WHh04gqZMJMA03QzmGRK6xB9ZnARrtvVy1oI8JhzttpCs0XNMsWV291TUl1SdowoMF1JU4zNbnRk2cRBdaKWn2de6M3ZYvs9LxHtimZCIjRzUIcFUPph2usVJ8RCSHegv1KCc7qzUeYehfMf303Y169eFNB7n+1OhO310xKgeJZaSPQZadfuI+vGb03gqE2yB1lBOmxKkk0ep30PUeQlw+eAyYq+fmid3kzwIDAQAB"
}

resource "aws_route53_record" "zoho_dkim" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "zmail._domainkey.${var.domain}"
  type    = "TXT"
  ttl     = 300
  records = ["${substr(local.zoho_dkim, 0, 255)}\"\"${substr(local.zoho_dkim, 255, -1)}"]
}

# DMARC starts in monitoring mode; move to p=quarantine once DKIM is verified and reports look clean.
# Aggregate reports go to Brevo, which shows them in its dashboard and requires the rua tag to authenticate.
resource "aws_route53_record" "dmarc" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "_dmarc.${var.domain}"
  type    = "TXT"
  ttl     = 300
  records = ["v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com; fo=1"]
}
