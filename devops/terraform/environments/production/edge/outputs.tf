output "name_servers" {
  description = "Registered at the domain registrar (Bisup Innovations) for oxinov.com."
  value       = aws_route53_zone.main.name_servers
}

output "site_bucket" {
  description = "GitHub environment variable SITE_BUCKET."
  value       = aws_s3_bucket.site.bucket
}

output "site_distribution_id" {
  description = "GitHub environment variable SITE_DISTRIBUTION_ID."
  value       = aws_cloudfront_distribution.site.id
}

output "site_deploy_role_arn" {
  description = "GitHub environment variable AWS_DEPLOY_ROLE_ARN."
  value       = aws_iam_role.site_deploy.arn
}

output "site_url" {
  value = "https://${var.domain}"
}
