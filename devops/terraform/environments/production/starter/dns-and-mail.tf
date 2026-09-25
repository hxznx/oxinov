# Public names for the starter server and Amazon SES for sign-in emails.

data "aws_route53_zone" "primary" {
  name         = var.domain
  private_zone = false
}

resource "aws_route53_record" "hosts" {
  for_each = var.hosts
  zone_id  = data.aws_route53_zone.primary.zone_id
  name     = "${each.value}.${var.domain}"
  type     = "A"
  ttl      = 300
  records  = [aws_eip.server.public_ip]
}

# Only Let's Encrypt may issue certificates for these names (Caddy obtains them).
resource "aws_route53_record" "caa" {
  for_each = var.hosts
  zone_id  = data.aws_route53_zone.primary.zone_id
  name     = "${each.value}.${var.domain}"
  type     = "CAA"
  ttl      = 3600
  records  = ["0 issue \"letsencrypt.org\"", "0 iodef \"mailto:security@${var.domain}\""]
}

# --- Amazon SES: the domain identity with Easy DKIM, and a custom MAIL FROM so SPF aligns too. -------
# Company mailboxes stay on Zoho (edge stack); SES only sends from no-reply@.
resource "aws_sesv2_email_identity" "domain" {
  email_identity = var.domain

  dkim_signing_attributes {
    next_signing_key_length = "RSA_2048_BIT"
  }
}

resource "aws_route53_record" "ses_dkim" {
  count   = 3
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = "${aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens[count.index]}._domainkey.${var.domain}"
  type    = "CNAME"
  ttl     = 1800
  records = ["${aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens[count.index]}.dkim.amazonses.com"]
}

locals {
  mail_from_domain = "bounce.${var.domain}"
}

resource "aws_sesv2_email_identity_mail_from_attributes" "domain" {
  email_identity         = aws_sesv2_email_identity.domain.email_identity
  mail_from_domain       = local.mail_from_domain
  behavior_on_mx_failure = "USE_DEFAULT_VALUE"
}

resource "aws_route53_record" "ses_mail_from_mx" {
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = local.mail_from_domain
  type    = "MX"
  ttl     = 1800
  records = ["10 feedback-smtp.${local.region}.amazonses.com"]
}

resource "aws_route53_record" "ses_mail_from_spf" {
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = local.mail_from_domain
  type    = "TXT"
  ttl     = 1800
  records = ["v=spf1 include:amazonses.com ~all"]
}
