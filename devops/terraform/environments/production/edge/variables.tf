variable "domain" {
  description = "Company domain; the website is served at the apex and www redirects to it."
  type        = string
  default     = "oxinov.com"
}

variable "github_repository" {
  description = "owner/name of the repository allowed to deploy the website."
  type        = string
  default     = "hxznx/oxinov"
}

variable "github_environment" {
  description = "GitHub Actions environment whose jobs may assume the deploy role."
  type        = string
  default     = "production"
}
