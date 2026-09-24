variable "domain" {
  description = "Company domain; the website is served at the apex and www redirects to it."
  type        = string
  default     = "oxinov.com"
}

variable "github_subject_prefix" {
  description = <<-EOT
    OIDC subject prefix of the repository allowed to deploy the website. The repository uses GitHub's
    immutable subjects (owner and repository IDs), so a renamed or re-created repository cannot match.
    Check with: gh api repos/hxznx/oxinov/actions/oidc/customization/sub
  EOT
  type        = string
  default     = "repo:hxznx@181247152/oxinov@1381579182"
}

variable "github_environment" {
  description = "GitHub Actions environment whose jobs may assume the deploy role."
  type        = string
  default     = "production"
}
