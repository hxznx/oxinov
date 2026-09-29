---
name: oxinov-aws
description: Use and reason about the AWS services Oxinov runs on - EC2 with k3s, S3 and presigned URLs, CloudFront, SES email, ECR, Systems Manager and Parameter Store, IAM roles with OIDC, CloudWatch alarms, and the monthly budget. Use when a task involves any AWS service, cost, or access question.
---

# Oxinov on AWS

Plan larger or cross-cutting infrastructure changes first with the oxinov-devops-architecture skill (tool ownership, today's production against the reference architecture, and the production safety rules).

Rules: [DevOps rules](../../../docs/14-ai-knowledge/devops-rules.md), [security rules](../../../docs/14-ai-knowledge/security-rules.md). Sources: [cloud architecture](../../../docs/04-architecture/cloud-architecture.md), [current state](../../../docs/04-architecture/current-state.md), [cost optimization](../../../docs/10-devops/cost-optimization.md).

## What Oxinov uses today (region `ap-south-1`, Mumbai)

| Service | Used for |
| --- | --- |
| EC2 | One `t3a.medium` node running k3s; IMDSv2 (hop limit 2), encrypted disk, daily snapshots, automatic recovery |
| S3 | Private media bucket (presigned URLs), nightly database dumps (30 days), the static website, Terraform state |
| CloudFront | `oxinov.com` in front of the private website bucket |
| Route 53 and ACM | The `oxinov.com` zone, mail records, and the website certificate |
| SES | Sign-in emails through `mail-relay`, using the instance role; production access requested 2026-09-28, pending |
| ECR | One repository per service in `services.yaml`, immutable tags |
| Systems Manager | Shell access (`oxctl shell`), deploy commands, Parameter Store (SecureString) for secrets |
| IAM | GitHub OIDC roles for CI and deploy; the instance role for the node; no long-lived keys |
| CloudWatch | Instance and system status alarms, SES bounce and complaint alarms |
| Budgets | Alerts at 85%, 100%, and forecast 100% of US$50 a month (`cost.tf`) |
| GuardDuty, EventBridge, SNS | Threat detection; findings and CloudTrail-tampering events routed to the `security_alerts` topic (`security.tf`) |
| KMS | Customer-managed keys for the security alert topic and related encryption (`security.tf`) |

Not used today: EKS, RDS, SQS, ElastiCache, Bedrock, SageMaker. They arrive only with a roadmap trigger and the owner's approval.

## Rules of engagement

1. **Read freely.** Read-only queries (`aws ... describe`, `get`, `list`) are allowed once the owner has signed in with `aws sso login`.
2. **Change only through Terraform** (oxinov-terraform skill). No console or CLI writes.
3. **Never handle credentials.** Do not ask for, accept, or print keys, passwords, or tokens.
4. **Requests to AWS** (quota increases, SES production access, support cases) are made by the owner; prepare the text for them.
5. **State the cost** of anything new per month, against the US$50 budget. `oxctl cost` shows current spend.

## Common tasks

| Need | How |
| --- | --- |
| A new file store for a feature | A prefix in the existing media bucket with presigned URLs, not a new bucket |
| A new secret | Owner adds it to Parameter Store; `bootstrap-node.sh` renders it into the `oxinov-app` Secret; the chart references it |
| Send a new kind of email | Through the existing SES setup and `mail-relay`; check bounce handling (`email-events.tf`) |
| Something AWS-side is wrong | `oxctl status`, CloudWatch alarms, then the oxinov-server skill |
