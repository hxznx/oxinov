output "server_instance_id" {
  description = "Starter server; connect with: aws ssm start-session --target <id>"
  value       = aws_instance.server.id
}

output "server_public_ip" {
  description = "Elastic IP behind edu, app, and id"
  value       = aws_eip.server.public_ip
}

output "urls" {
  description = "Public addresses served by the starter server"
  value       = { for key, host in var.hosts : key => "https://${host}.${var.domain}" }
}

output "ecr_registry" {
  description = "Registry the deploy workflow pushes to"
  value       = split("/", aws_ecr_repository.app["lms-api"].repository_url)[0]
}

output "media_bucket" {
  description = "MEDIA_BUCKET for the Edu API"
  value       = aws_s3_bucket.media.bucket
}

output "backup_bucket" {
  description = "Nightly database dumps"
  value       = aws_s3_bucket.backups.bucket
}

output "deploy_role_arn" {
  description = "Role assumed by .github/workflows/deploy-starter.yml"
  value       = aws_iam_role.deploy.arn
}

output "parameter_prefix" {
  description = "Parameter Store path of the generated application secrets"
  value       = local.parameter_prefix
}
