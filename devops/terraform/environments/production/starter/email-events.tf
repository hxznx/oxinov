# Bounce and complaint handling for sign-in email (Amazon SES best practice; docs/marketing/SEO.md is
# unrelated). Every message from oxinov.com goes through one configuration set that:
#   - suppresses addresses that hard-bounce or complain, so we never send to them again;
#   - publishes bounce, complaint, reject, and rendering-failure events to an encrypted SNS topic that
#     emails the operations mailbox; and
#   - feeds reputation metrics to CloudWatch alarms that warn well before AWS's review thresholds
#     (AWS reviews accounts at a 10% bounce rate or a 0.5% complaint rate).

variable "email_alert_address" {
  description = "Company mailbox that receives SES bounce and complaint events and reputation alarms."
  type        = string
  default     = "admin@oxinov.com"
}

resource "aws_sesv2_configuration_set" "transactional" {
  configuration_set_name = "oxinov-transactional"

  delivery_options {
    tls_policy = "REQUIRE"
  }

  reputation_options {
    reputation_metrics_enabled = true
  }

  sending_options {
    sending_enabled = true
  }

  suppression_options {
    suppressed_reasons = ["BOUNCE", "COMPLAINT"]
  }
}

# Encrypts event messages at rest (they contain recipient addresses). SES and CloudWatch publish with it.
resource "aws_kms_key" "email_events" {
  description             = "Encrypts Oxinov SES bounce and complaint notifications"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  policy                  = data.aws_iam_policy_document.email_events_key.json
}

resource "aws_kms_alias" "email_events" {
  name          = "alias/${local.name}-email-events"
  target_key_id = aws_kms_key.email_events.key_id
}

data "aws_iam_policy_document" "email_events_key" {
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
    sid       = "PublishEncryptedEvents"
    actions   = ["kms:GenerateDataKey*", "kms:Decrypt"]
    resources = ["*"]
    principals {
      type        = "Service"
      identifiers = ["ses.amazonaws.com", "cloudwatch.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [local.account_id]
    }
  }
}

resource "aws_sns_topic" "email_events" {
  name              = "${local.name}-email-events"
  display_name      = "Oxinov email events"
  kms_master_key_id = aws_kms_key.email_events.arn
}

data "aws_iam_policy_document" "email_events_topic" {
  statement {
    sid       = "SesPublishesEvents"
    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.email_events.arn]
    principals {
      type        = "Service"
      identifiers = ["ses.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [local.account_id]
    }
    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values   = ["arn:aws:ses:${local.region}:${local.account_id}:configuration-set/${aws_sesv2_configuration_set.transactional.configuration_set_name}"]
    }
  }

  statement {
    sid       = "CloudWatchPublishesAlarms"
    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.email_events.arn]
    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [local.account_id]
    }
  }
}

resource "aws_sns_topic_policy" "email_events" {
  arn    = aws_sns_topic.email_events.arn
  policy = data.aws_iam_policy_document.email_events_topic.json
}

# AWS sends a confirmation email to this address; the subscription starts after someone clicks it.
resource "aws_sns_topic_subscription" "email_events" {
  topic_arn = aws_sns_topic.email_events.arn
  protocol  = "email"
  endpoint  = var.email_alert_address
}

resource "aws_sesv2_configuration_set_event_destination" "email_events" {
  configuration_set_name = aws_sesv2_configuration_set.transactional.configuration_set_name
  event_destination_name = "bounces-and-complaints"

  event_destination {
    enabled              = true
    matching_event_types = ["BOUNCE", "COMPLAINT", "REJECT", "RENDERING_FAILURE"]

    sns_destination {
      topic_arn = aws_sns_topic.email_events.arn
    }
  }

  depends_on = [aws_sns_topic_policy.email_events]
}

# Early warnings: half of AWS's review thresholds for bounces, a fifth for complaints.
resource "aws_cloudwatch_metric_alarm" "email_bounce_rate" {
  alarm_name          = "${local.name}-email-bounce-rate"
  alarm_description   = "SES bounce rate above 5% (AWS reviews at 10%): check who is signing up and the suppression list"
  namespace           = "AWS/SES"
  metric_name         = "Reputation.BounceRate"
  statistic           = "Maximum"
  period              = 3600
  evaluation_periods  = 1
  threshold           = 0.05
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.email_events.arn]
  ok_actions          = [aws_sns_topic.email_events.arn]
}

resource "aws_cloudwatch_metric_alarm" "email_complaint_rate" {
  alarm_name          = "${local.name}-email-complaint-rate"
  alarm_description   = "SES complaint rate above 0.1% (AWS reviews at 0.5%): check for abuse of the sign-in form"
  namespace           = "AWS/SES"
  metric_name         = "Reputation.ComplaintRate"
  statistic           = "Maximum"
  period              = 3600
  evaluation_periods  = 1
  threshold           = 0.001
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.email_events.arn]
  ok_actions          = [aws_sns_topic.email_events.arn]
}
