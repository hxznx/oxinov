# Terraform

Terraform will manage the approved AWS platform defined in the [AWS cloud architecture](../../docs/architecture/AWS-CLOUD-ARCHITECTURE.md). The primary region is `ap-south-1` Mumbai; `ap-south-2` Hyderabad initially receives encrypted recovery copies.

## Planned layout

```text
bootstrap/             remote state, locking, KMS, and CI deployment roles
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

Do not apply sample resources to production. Bootstrap remote state before creating environment modules. Pin Terraform and provider versions, use separate state per environment, prohibit secrets in state inputs where possible, scan plans, require peer review, and preserve a saved plan for approved production changes.
