# Terraform

Terraform manages the approved AWS platform defined in the [AWS cloud architecture](../../docs/04-architecture/cloud-architecture.md). The account is `614130400110`, the primary region is `ap-south-1` Mumbai, and `ap-south-2` Hyderabad later receives encrypted recovery copies.

## Stacks in use

| Stack | State key | Manages |
|---|---|---|
| [`bootstrap/`](bootstrap/main.tf) | `bootstrap/terraform.tfstate` | The remote state bucket `oxinov-terraform-state-614130400110`: private, encrypted, versioned, TLS only, with S3 native locking |
| [`environments/production/edge/`](environments/production/edge/) | `production/edge/terraform.tfstate` | The `oxinov.com` Route 53 zone, the company website (private S3 bucket, CloudFront with origin access control, ACM certificate, security headers, router function, DNS records) and the keyless GitHub deploy role |

Terraform 1.16 and the AWS provider 6.x are pinned; commit `.terraform.lock.hcl` with provider hashes for Linux, Windows and macOS (`terraform providers lock -platform=linux_amd64 -platform=windows_amd64 -platform=darwin_arm64`). CI checks formatting, validates every stack without cloud access, and tests the router.

## Running a change

1. Sign in with a short-lived session (`aws login` or `aws sso login`); never create long-lived access keys.
2. `terraform -chdir=<stack> init`, then `terraform -chdir=<stack> plan -out=change.tfplan`.
3. Review the plan with the owner. Nothing is applied to production without an approved saved plan.
4. `terraform -chdir=<stack> apply change.tfplan`.

## Company website deploys

Every push to `main` that touches the site runs [`deploy-company-web.yml`](../../.github/workflows/deploy-company-web.yml). The GitHub `production` environment holds three non-secret variables taken from the edge stack outputs: `AWS_DEPLOY_ROLE_ARN`, `SITE_BUCKET` and `SITE_DISTRIBUTION_ID`. The role trusts only GitHub's immutable subject `repo:hxznx@181247152/oxinov@1381579182:environment:production` and can only write the site bucket and invalidate its distribution. Old file versions are kept for 30 days for rollback.

## Rebuilding the state bucket

The bootstrap stack stores its own state in the bucket it creates. To create it from nothing, add a git-ignored `backend_override.tf` containing `terraform { backend "local" {} }`, apply, delete the override, and run `terraform init -migrate-state`.

## Planned layout

```text
organizations/         accounts, organizational units, policies, and security delegation
modules/
  network/             VPC, subnets, routing, endpoints, flow logs, and security groups
  edge/                Route 53, certificates, CloudFront, WAF, and load balancing
  compute/             ECR, ECS clusters, services, task roles, and autoscaling
  data/                RDS PostgreSQL, ElastiCache, S3, backups, and secrets
  observability/       metrics, logs, alarms, dashboards, and notification integration
environments/
  development/
  staging/
  production/
  recovery/
```

Use separate state per environment, keep secrets out of state inputs where possible, scan plans, and require peer review.
