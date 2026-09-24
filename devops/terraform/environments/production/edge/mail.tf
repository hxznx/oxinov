# Staff email for oxinov.com on Zoho Mail (zoho.com data centre). Automatic product email (sign-in codes,
# receipts) will use Amazon SES from no-reply@oxinov.com and is added with the platform launch.

# Apex TXT values: Zoho domain ownership proof and SPF (only Zoho may send as @oxinov.com; soft-fail others).
resource "aws_route53_record" "apex_txt" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain
  type    = "TXT"
  ttl     = 300
  records = [
    "zoho-verification=zb30003091.zmverify.zoho.com",
    "v=spf1 include:zoho.com ~all",
  ]
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
resource "aws_route53_record" "dmarc" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "_dmarc.${var.domain}"
  type    = "TXT"
  ttl     = 300
  records = ["v=DMARC1; p=none; fo=1"]
}
