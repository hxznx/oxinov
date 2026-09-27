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

variable "search_verification_txt" {
  description = <<-EOT
    Search engine domain-ownership values published as apex TXT records (docs/13-marketing/seo/search-console.md).
    Google Search Console: add oxinov.com as a Domain property, copy its TXT value
    ("google-site-verification=..."), add it here, and apply. Bing Webmaster Tools then imports the
    verified site from Google Search Console, so it needs no record. These values are public in DNS.
  EOT
  type        = list(string)
  default     = ["google-site-verification=bXe176aapC8FXyHo1QZCvxJCzbNQkxbgnvbZzoF-cSw"]

  validation {
    condition = alltrue([
      for value in var.search_verification_txt :
      can(regex("^google-site-verification=[A-Za-z0-9_-]{20,100}$", value))
    ])
    error_message = "Each value must look like google-site-verification=<token> as shown by Google Search Console."
  }
}
