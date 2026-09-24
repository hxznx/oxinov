# Public DNS for oxinov.com and every product subdomain. The zone was created with the AWS CLI while
# delegating the domain from the registrar, so it is adopted here instead of recreated (its name servers
# are registered at the registrar and must not change).
import {
  to = aws_route53_zone.main
  id = "Z08692791BXLUBZK4AWB4"
}

resource "aws_route53_zone" "main" {
  name    = var.domain
  comment = "Oxinov public DNS (company site and products)"

  lifecycle {
    prevent_destroy = true
  }
}

# HTTPS certificate for the company site, validated through DNS and renewed by AWS automatically.
resource "aws_acm_certificate" "site" {
  provider                  = aws.us_east_1
  domain_name               = var.domain
  subject_alternative_names = ["www.${var.domain}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "site_certificate_validation" {
  for_each = {
    for option in aws_acm_certificate.site.domain_validation_options : option.domain_name => option
  }

  zone_id         = aws_route53_zone.main.zone_id
  name            = each.value.resource_record_name
  type            = each.value.resource_record_type
  records         = [each.value.resource_record_value]
  ttl             = 300
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "site" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.site.arn
  validation_record_fqdns = [for record in aws_route53_record.site_certificate_validation : record.fqdn]
}

# oxinov.com and www.oxinov.com (IPv4 and IPv6) -> CloudFront. www redirects to the apex in the router.
resource "aws_route53_record" "site" {
  for_each = {
    for pair in setproduct([var.domain, "www.${var.domain}"], ["A", "AAAA"]) : "${pair[0]}-${pair[1]}" => pair
  }

  zone_id = aws_route53_zone.main.zone_id
  name    = each.value[0]
  type    = each.value[1]

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}
