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

variable "brevo_verification_txt" {
  description = <<-EOT
    Brevo domain-ownership value for oxinov.com (Brevo: Senders, Domains, Authenticate), e.g. "brevo-code:...".
    Brevo sends sign-in email while Amazon SES has no production access (backend/workers/mail-relay).
    Empty: no record. The value is public in DNS.
  EOT
  type        = string
  default     = "brevo-code:e11cdb6cc1fcc5d4cdbbe8781dc01cde"
  validation {
    condition     = var.brevo_verification_txt == "" || can(regex("^brevo-code:[A-Za-z0-9]{16,64}$", var.brevo_verification_txt))
    error_message = "Use the exact \"brevo-code:...\" value Brevo shows."
  }
}

variable "brevo_dkim_cnames" {
  description = <<-EOT
    Brevo's DKIM records for oxinov.com as record name => target, exactly as Brevo shows them, e.g.
    { "brevo1._domainkey" = "b1.oxinov-com.dkim.brevo.com", "brevo2._domainkey" = "b2.oxinov-com.dkim.brevo.com" }.
    DKIM lets Gmail accept mail Brevo sends as no-reply@oxinov.com under the DMARC policy. Empty: no records.
  EOT
  type        = map(string)
  default = {
    "brevo1._domainkey" = "b1.oxinov-com.dkim.brevo.com"
    "brevo2._domainkey" = "b2.oxinov-com.dkim.brevo.com"
  }
  validation {
    condition     = alltrue([for name, target in var.brevo_dkim_cnames : can(regex("^[a-z0-9-]+[.]_domainkey$", name)) && can(regex("brevo[.]com[.]?$", target))])
    error_message = "Each entry must be <selector>._domainkey => a target under brevo.com."
  }
}

variable "brevo_branding_cnames" {
  description = <<-EOT
    Brevo's branding records for oxinov.com as record name => target, exactly as Brevo shows them. Brevo
    completes domain authentication only with them; they serve its link-tracking and image subdomains.
    Empty: no records.
  EOT
  type        = map(string)
  default = {
    "no-reply"     = "no-reply-oxinov-com.brand.brevosend.com"
    "r.no-reply"   = "no-reply-oxinov-com.r.brand.brevosend.com"
    "img.no-reply" = "no-reply-oxinov-com.img.brand.brevosend.com"
  }
  validation {
    condition     = alltrue([for name, target in var.brevo_branding_cnames : can(regex("^[a-z0-9-]+([.][a-z0-9-]+)*$", name)) && can(regex("brevosend[.]com[.]?$", target))])
    error_message = "Each entry must be a subdomain name => a target under brevosend.com."
  }
}
