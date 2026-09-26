# Monthly cost guard (ADR-018: cost is a requirement). Created by hand on 2026-09-26 and imported here so
# Terraform owns it. Recipients are personal data, so they come from a git-ignored owner.auto.tfvars
# (see owner.auto.tfvars.example).

variable "budget_alert_emails" {
  description = "Who receives budget alerts."
  type        = list(string)
}

variable "monthly_budget_usd" {
  description = "Monthly AWS spend that triggers the alerts."
  type        = number
  default     = 50
}

import {
  to = aws_budgets_budget.monthly
  id = "${local.account_id}:oxinov-monthly"
}

resource "aws_budgets_budget" "monthly" {
  name         = "oxinov-monthly"
  budget_type  = "COST"
  limit_amount = format("%.1f", var.monthly_budget_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  dynamic "notification" {
    for_each = [
      { type = "ACTUAL", threshold = 85 },
      { type = "ACTUAL", threshold = 100 },
      { type = "FORECASTED", threshold = 100 },
    ]
    content {
      notification_type          = notification.value.type
      comparison_operator        = "GREATER_THAN"
      threshold                  = notification.value.threshold
      threshold_type             = "PERCENTAGE"
      subscriber_email_addresses = var.budget_alert_emails
    }
  }
}
