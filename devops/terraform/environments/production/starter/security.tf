# AWS account security monitoring (docs/09-security/security-baseline.md roadmap items 1 and 2; owner approval
# 2026-09-26: "yes add cloudtrail and guardduty").
#   - CloudTrail: one multi-region trail of management events (every AWS API call), with log-file
#     validation, encrypted with a customer-managed key, kept 365 days in a private bucket. The first
#     management-event trail is free; only S3 storage and KMS requests are billed (cents).
#   - GuardDuty in Mumbai: foundational threat detection (CloudTrail, VPC flow logs, DNS) plus S3 data
#     events and on-demand EBS malware scans. Plans that do not apply here (RDS, Lambda, EKS) and the
#     per-vCPU Runtime Monitoring agent stay off to keep the cost at a few dollars a month.
#   - Findings of medium severity or higher, and CloudTrail being stopped or changed, are emailed to the
#     operations mailbox through an encrypted SNS topic.

# --- Key for security logs and alerts ------------------------------------------------------------------
resource "aws_kms_key" "security" {
  description             = "Encrypts Oxinov CloudTrail logs and security alerts"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  policy                  = data.aws_iam_policy_document.security_key.json
}

resource "aws_kms_alias" "security" {
  name          = "alias/${local.name}-security"
  target_key_id = aws_kms_key.security.key_id
}

data "aws_iam_policy_document" "security_key" {
  statement {
    sid       = "AccountAdministration"
    actions   = ["kms:*"]
    resources = ["*"]
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${local.account_id}:root"]
    }
  }

  statement {
    sid       = "CloudTrailEncryptsLogs"
    actions   = ["kms:GenerateDataKey*"]
    resources = ["*"]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "kms:EncryptionContext:aws:cloudtrail:arn"
      values   = ["arn:aws:cloudtrail:*:${local.account_id}:trail/*"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      values   = [local.trail_arn]
    }
  }

  statement {
    sid       = "CloudTrailDescribesKey"
    actions   = ["kms:DescribeKey"]
    resources = ["*"]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
  }

  statement {
    sid       = "EventBridgePublishesAlerts"
    actions   = ["kms:GenerateDataKey*", "kms:Decrypt"]
    resources = ["*"]
    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [local.account_id]
    }
  }
}

# --- CloudTrail -----------------------------------------------------------------------------------------
locals {
  trail_name = "${local.name}-account"
  trail_arn  = "arn:aws:cloudtrail:${local.region}:${local.account_id}:trail/${local.trail_name}"
}

resource "aws_s3_bucket" "cloudtrail" {
  bucket = "oxinov-cloudtrail-${local.account_id}"
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket                  = aws_s3_bucket.cloudtrail.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.security.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    id     = "retain-one-year"
    status = "Enabled"
    filter {}
    expiration {
      days = 365
    }
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

data "aws_iam_policy_document" "cloudtrail_bucket" {
  statement {
    sid       = "CloudTrailChecksAcl"
    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.cloudtrail.arn]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      values   = [local.trail_arn]
    }
  }

  statement {
    sid       = "CloudTrailWritesLogs"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.cloudtrail.arn}/AWSLogs/${local.account_id}/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      values   = [local.trail_arn]
    }
  }

  statement {
    sid       = "DenyInsecureTransport"
    effect    = "Deny"
    actions   = ["s3:*"]
    resources = [aws_s3_bucket.cloudtrail.arn, "${aws_s3_bucket.cloudtrail.arn}/*"]
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

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  policy = data.aws_iam_policy_document.cloudtrail_bucket.json

  depends_on = [aws_s3_bucket_public_access_block.cloudtrail]
}

# Accepted: CloudWatch Logs delivery (AWS-0162) adds ingestion cost; GuardDuty reads the same events and
# alerts on threats, and the S3 copy is the record. Revisit with the SIEM (SOC design).
#trivy:ignore:AWS-0162
resource "aws_cloudtrail" "account" {
  name                          = local.trail_name
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  kms_key_id                    = aws_kms_key.security.arn
  is_multi_region_trail         = true
  include_global_service_events = true
  enable_log_file_validation    = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# --- GuardDuty ------------------------------------------------------------------------------------------
resource "aws_guardduty_detector" "main" {
  enable                       = true
  finding_publishing_frequency = "FIFTEEN_MINUTES"
}

locals {
  guardduty_features = {
    S3_DATA_EVENTS         = "ENABLED"
    EBS_MALWARE_PROTECTION = "ENABLED"
    RDS_LOGIN_EVENTS       = "DISABLED"
    LAMBDA_NETWORK_LOGS    = "DISABLED"
    EKS_AUDIT_LOGS         = "DISABLED"
    RUNTIME_MONITORING     = "DISABLED"
  }
}

resource "aws_guardduty_detector_feature" "main" {
  for_each    = local.guardduty_features
  detector_id = aws_guardduty_detector.main.id
  name        = each.key
  status      = each.value

  # AWS records these agent settings under Runtime Monitoring; declaring them keeps plans clean.
  dynamic "additional_configuration" {
    for_each = each.key == "RUNTIME_MONITORING" ? ["EKS_ADDON_MANAGEMENT", "ECS_FARGATE_AGENT_MANAGEMENT", "EC2_AGENT_MANAGEMENT"] : []
    content {
      name   = additional_configuration.value
      status = "DISABLED"
    }
  }
}

# --- Alerts ---------------------------------------------------------------------------------------------
resource "aws_sns_topic" "security_alerts" {
  name              = "${local.name}-security-alerts"
  display_name      = "Oxinov security alerts"
  kms_master_key_id = aws_kms_key.security.arn
}

data "aws_iam_policy_document" "security_alerts_topic" {
  statement {
    sid       = "EventBridgePublishes"
    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.security_alerts.arn]
    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [local.account_id]
    }
  }
}

resource "aws_sns_topic_policy" "security_alerts" {
  arn    = aws_sns_topic.security_alerts.arn
  policy = data.aws_iam_policy_document.security_alerts_topic.json
}

# AWS sends a confirmation email; alerts start after someone clicks it.
resource "aws_sns_topic_subscription" "security_alerts" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.email_alert_address
}

# GuardDuty severities: 4.0-6.9 medium, 7.0-8.9 high, 9.0+ critical.
resource "aws_cloudwatch_event_rule" "guardduty_findings" {
  name        = "${local.name}-guardduty-findings"
  description = "GuardDuty findings of medium severity or higher"
  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail      = { severity = [{ numeric = [">=", 4] }] }
  })
}

resource "aws_cloudwatch_event_target" "guardduty_findings" {
  rule      = aws_cloudwatch_event_rule.guardduty_findings.name
  target_id = "security-alerts"
  arn       = aws_sns_topic.security_alerts.arn
}

# Someone stopping, deleting, or reconfiguring the trail is a classic first step of an attack.
resource "aws_cloudwatch_event_rule" "cloudtrail_tampering" {
  name        = "${local.name}-cloudtrail-tampering"
  description = "CloudTrail stopped, deleted, or reconfigured"
  event_pattern = jsonencode({
    source      = ["aws.cloudtrail"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["cloudtrail.amazonaws.com"]
      eventName   = ["StopLogging", "DeleteTrail", "UpdateTrail", "PutEventSelectors"]
    }
  })
}

resource "aws_cloudwatch_event_target" "cloudtrail_tampering" {
  rule      = aws_cloudwatch_event_rule.cloudtrail_tampering.name
  target_id = "security-alerts"
  arn       = aws_sns_topic.security_alerts.arn
}
