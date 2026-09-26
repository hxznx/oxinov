# Container images, lesson media, and database dumps.

locals {
  repositories = ["lms-api", "platform-api", "edu-web", "platform-web", "migrate", "mail-relay", "keycloak", "backup"]
}

resource "aws_ecr_repository" "app" {
  for_each             = toset(local.repositories)
  name                 = "oxinov/${each.key}"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256" #trivy:ignore:AVD-AWS-0033 AWS-owned key is enough for public-source images; revisit with ADR-009
  }
}

# The shared Helm chart (ADR-018), published as an OCI artifact with every release.
resource "aws_ecr_repository" "charts" {
  name                 = "charts/oxinov"
  image_tag_mutability = "IMMUTABLE"

  encryption_configuration {
    encryption_type = "AES256" #trivy:ignore:AVD-AWS-0033 chart packages are not secret; revisit with ADR-009
  }
}

resource "aws_ecr_lifecycle_policy" "charts" {
  repository = aws_ecr_repository.charts.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep the thirty newest chart versions for rollbacks"
      selection    = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 30 }
      action       = { type = "expire" }
    }]
  })
}

resource "aws_ecr_lifecycle_policy" "app" {
  for_each   = aws_ecr_repository.app
  repository = each.value.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep the ten newest images for rollbacks"
      selection    = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 10 }
      action       = { type = "expire" }
    }]
  })
}

# --- Lesson media and documents (private; the Edu API hands out short-lived signed URLs) -------------
resource "aws_s3_bucket" "media" {
  bucket = "oxinov-edu-media-${local.account_id}"
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket                  = aws_s3_bucket.media.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "media" {
  bucket = aws_s3_bucket.media.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "media" {
  bucket = aws_s3_bucket.media.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256" #trivy:ignore:AVD-AWS-0132 SSE-S3 keeps signed browser uploads simple; KMS arrives with ADR-009
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "media" {
  bucket = aws_s3_bucket.media.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  rule {
    id     = "tidy"
    status = "Enabled"
    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# Browsers upload straight to S3 and stream from it (same rules as backend/api/scripts/media-bucket.mjs).
resource "aws_s3_bucket_cors_configuration" "media" {
  bucket = aws_s3_bucket.media.id
  cors_rule {
    allowed_origins = ["https://${var.hosts.edu}.${var.domain}"]
    allowed_methods = ["PUT", "GET", "HEAD"]
    allowed_headers = ["Content-Type", "Range"]
    expose_headers  = ["ETag", "Content-Length", "Content-Range", "Accept-Ranges"]
    max_age_seconds = 3600
  }
}

data "aws_iam_policy_document" "media_tls" {
  statement {
    sid       = "DenyInsecureTransport"
    effect    = "Deny"
    actions   = ["s3:*"]
    resources = [aws_s3_bucket.media.arn, "${aws_s3_bucket.media.arn}/*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "media" {
  bucket     = aws_s3_bucket.media.id
  policy     = data.aws_iam_policy_document.media_tls.json
  depends_on = [aws_s3_bucket_public_access_block.media]
}

# --- Nightly database dumps: write-only for the server, kept 30 days ---------------------------------
resource "aws_s3_bucket" "backups" {
  bucket = "oxinov-starter-backups-${local.account_id}"
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket                  = aws_s3_bucket.backups.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "backups" {
  bucket = aws_s3_bucket.backups.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256" #trivy:ignore:AVD-AWS-0132 SSE-S3 is sufficient for the starter; KMS arrives with ADR-009
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "expire-dumps"
    status = "Enabled"
    filter {
      prefix = "database/"
    }

    expiration {
      days = var.database_backup_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}

data "aws_iam_policy_document" "backups_tls" {
  statement {
    sid       = "DenyInsecureTransport"
    effect    = "Deny"
    actions   = ["s3:*"]
    resources = [aws_s3_bucket.backups.arn, "${aws_s3_bucket.backups.arn}/*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "backups" {
  bucket     = aws_s3_bucket.backups.id
  policy     = data.aws_iam_policy_document.backups_tls.json
  depends_on = [aws_s3_bucket_public_access_block.backups]
}
