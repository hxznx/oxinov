variable "domain" {
  description = "Company domain (Route 53 zone managed by the edge stack)."
  type        = string
  default     = "oxinov.com"
}

variable "hosts" {
  description = "Public names served by the starter server (ADR-017): Edu, the account portal, and sign-in."
  type        = map(string)
  default = {
    edu      = "edu"
    portal   = "app"
    identity = "id"
  }
}

variable "instance_type" {
  description = "One x86 server runs every service; 4 GiB fits Keycloak, PostgreSQL, two APIs, and two web apps."
  type        = string
  default     = "t3a.medium"
}

variable "root_volume_gb" {
  description = "Encrypted gp3 disk for the OS, images, and PostgreSQL data."
  type        = number
  default     = 30
}

variable "snapshot_retention_days" {
  description = "Daily disk snapshots kept (Data Lifecycle Manager)."
  type        = number
  default     = 7
}

variable "database_backup_retention_days" {
  description = "Nightly database dumps kept in S3."
  type        = number
  default     = 30
}

variable "mail_from" {
  description = "Envelope and header sender for sign-in codes (Amazon SES)."
  type        = string
  default     = "no-reply@oxinov.com"
}

variable "github_subject_prefix" {
  description = "Immutable OIDC subject prefix of the repository allowed to deploy (see the edge stack)."
  type        = string
  default     = "repo:hxznx@181247152/oxinov@1381579182"
}

variable "github_environment" {
  description = "GitHub Actions environment whose jobs may assume the deploy role."
  type        = string
  default     = "production"
}
