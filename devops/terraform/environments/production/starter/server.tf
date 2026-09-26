# The production node (ADR-017 server, ADR-018 k3s runtime): Amazon Linux 2023, managed only through
# Systems Manager. Application secrets are generated on the server into Parameter Store, never in Terraform.

data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

locals {
  parameter_prefix = "/oxinov/production/starter"
}

data "aws_iam_policy_document" "server_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "server" {
  name               = "${local.name}-server"
  description        = "Starter server: Session Manager, image pulls, media, backups, email, and its own parameters"
  assume_role_policy = data.aws_iam_policy_document.server_trust.json
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.server.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

data "aws_iam_policy_document" "server" {
  statement {
    sid       = "EcrLogin"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid       = "PullImages"
    actions   = ["ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer", "ecr:BatchCheckLayerAvailability"]
    resources = concat([for repository in aws_ecr_repository.app : repository.arn], [aws_ecr_repository.charts.arn])
  }

  statement {
    sid       = "MediaObjects"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.media.arn}/*"]
  }

  statement {
    sid       = "WriteBackups"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.backups.arn}/database/*"]
  }

  statement {
    sid       = "SendSignInEmail"
    actions   = ["ses:SendEmail", "ses:SendRawEmail"]
    resources = [aws_sesv2_email_identity.domain.arn]
    condition {
      test     = "StringEquals"
      variable = "ses:FromAddress"
      values   = [var.mail_from]
    }
  }

  # Parameters are SecureStrings under the AWS managed aws/ssm key, which the service uses on the
  # caller's behalf; no customer key permissions are needed.
  statement {
    sid       = "OwnParameters"
    actions   = ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath", "ssm:PutParameter"]
    resources = ["arn:aws:ssm:${local.region}:${local.account_id}:parameter${local.parameter_prefix}/*"]
  }
}

resource "aws_iam_role_policy" "server" {
  name   = "starter-server"
  role   = aws_iam_role.server.id
  policy = data.aws_iam_policy_document.server.json
}

resource "aws_iam_instance_profile" "server" {
  name = "${local.name}-server"
  role = aws_iam_role.server.name
}

resource "aws_instance" "server" {
  ami                    = data.aws_ssm_parameter.al2023.insecure_value
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.server.id]
  iam_instance_profile   = aws_iam_instance_profile.server.name
  # Standard CPU credits: no surplus charges from the default unlimited mode (nothing heavy builds here).
  credit_specification {
    cpu_credits = "standard"
  }

  metadata_options {
    http_tokens   = "required"
    http_endpoint = "enabled"
    # Containers on the Docker bridge are one extra hop away and use the instance role for S3 and SES.
    http_put_response_hop_limit = 2
  }

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_gb
    encrypted             = true
    delete_on_termination = false
    tags                  = { Name = local.name, Backup = "daily" }
  }

  user_data                   = file("${path.module}/user-data.sh.tftpl")
  user_data_replace_on_change = false

  lifecycle {
    # A newer Amazon Linux image must not replace the running server; update it in place instead.
    ignore_changes = [ami, user_data]
  }

  tags = { Name = local.name }
}

resource "aws_eip" "server" {
  domain   = "vpc"
  instance = aws_instance.server.id
  tags     = { Name = local.name }
}

# Recover onto new hardware when AWS reports a host problem; reboot when the operating system stops answering.
resource "aws_cloudwatch_metric_alarm" "system_recover" {
  alarm_name          = "${local.name}-system-check"
  alarm_description   = "Recover the starter server when the underlying host fails"
  namespace           = "AWS/EC2"
  metric_name         = "StatusCheckFailed_System"
  statistic           = "Maximum"
  period              = 60
  evaluation_periods  = 2
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  dimensions          = { InstanceId = aws_instance.server.id }
  alarm_actions       = ["arn:aws:automate:${local.region}:ec2:recover"]
}

resource "aws_cloudwatch_metric_alarm" "instance_reboot" {
  alarm_name          = "${local.name}-instance-check"
  alarm_description   = "Reboot the starter server when its operating system stops responding"
  namespace           = "AWS/EC2"
  metric_name         = "StatusCheckFailed_Instance"
  statistic           = "Maximum"
  period              = 60
  evaluation_periods  = 3
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  dimensions          = { InstanceId = aws_instance.server.id }
  alarm_actions       = ["arn:aws:automate:${local.region}:ec2:reboot"]
}

# Daily encrypted snapshots of the server disk, kept for a week.
data "aws_iam_policy_document" "dlm_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["dlm.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "dlm" {
  name               = "${local.name}-snapshots"
  assume_role_policy = data.aws_iam_policy_document.dlm_trust.json
}

resource "aws_iam_role_policy_attachment" "dlm" {
  role       = aws_iam_role.dlm.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSDataLifecycleManagerServiceRole"
}

resource "aws_dlm_lifecycle_policy" "daily" {
  description        = "Daily starter server disk snapshots"
  execution_role_arn = aws_iam_role.dlm.arn
  state              = "ENABLED"

  policy_details {
    resource_types = ["VOLUME"]
    target_tags    = { Backup = "daily" }

    schedule {
      name      = "daily"
      copy_tags = true

      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        # 20:30 UTC is 02:15 in Nepal, the quietest hour.
        times = ["20:30"]
      }

      retain_rule {
        count = var.snapshot_retention_days
      }
    }
  }
}
