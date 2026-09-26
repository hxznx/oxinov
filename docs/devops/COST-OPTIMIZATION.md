# Cost optimization

**Owner:** founder (budget and commitments), lead engineer (engineering). **Updated:** 2026-09-26. Related: [current state](../architecture/CURRENT-STATE.md), [DevOps roadmap](ROADMAP.md), ADR-017, ADR-018.

Cost is a requirement (AGENTS.md, ADR-018): total AWS spend stays within **US$50 a month** until revenue justifies more. Terraform (`devops/terraform/environments/production/starter/cost.tf`) owns the budget and emails the owner at 85% and 100% of actual spend and at 100% of forecast.

## Where the money goes (estimate)

List prices for Mumbai (ap-south-1) on 2026-09-26, not billed amounts. Replace this table with actual figures from Cost Explorer (**Billing → Cost Explorer → group by Service**) at each monthly review.

| Item | Size | Estimate per month |
| --- | --- | --- |
| EC2 `t3a.medium`, on demand, 730 hours | The whole application platform | about US$29–37 |
| Public IPv4 address (Elastic IP) | One | US$3.65 |
| EBS gp3 disk | 30 GB, encrypted | about US$2.75 |
| EBS snapshots | 7 daily, incremental | about US$1–2 |
| KMS customer-managed key | Email events | US$1 |
| Route 53 hosted zone and queries | `oxinov.com` | about US$0.60 |
| S3 (website, media, backups), CloudFront, ECR, SES, SNS, CloudWatch alarms, Parameter Store | Low traffic | about US$1–3 |
| **Total** | | **about US$40–48** |

## Already optimized

| Measure | Saves |
| --- | --- |
| One k3s node instead of EKS, RDS, NAT gateway, and a load balancer (ADR-017, ADR-018) | about US$150–250 a month |
| Traefik with Let's Encrypt on the node: no load balancer or paid certificates | about US$18 a month |
| No NAT gateway: the public subnet and IPv4 address serve both directions | about US$35 a month |
| Standard CPU credits (no surplus charges from unlimited mode) | Unplanned spikes |
| Only changed images are rebuilt and deployed (`release-plan.sh`); documentation-only pushes deploy nothing | CI minutes and ECR storage |
| Docker layer cache in GitHub Actions (`type=gha`) and the pnpm store cache | CI minutes |
| ECR lifecycle: last 10 images (30 charts) kept; S3 lifecycle: media versions 30 days, backups 30 days, failed uploads 1 day; snapshots 7 days | Storage growth |
| Static company website on S3 + CloudFront (PriceClass_200) | Near zero for the website |
| Parameter Store standard tier instead of Secrets Manager | about US$0.40 per secret a month |
| Email over SES through the instance role | No email-provider subscription |

## Next savings, in order

| # | Action | Saving | Trade-off | Needs |
| --- | --- | --- | --- | --- |
| 1 | **Compute Savings Plan**, 1 year, no upfront, for the server's hourly spend | about 25–30% of compute (US$8–10 a month) | A 12-month commitment of about US$20–25 a month, even if plans change | Owner approval (a financial commitment); bought in the console, since Terraform cannot manage Savings Plans |
| 2 | **Graviton (`t4g.medium`, arm64)** at the next server rebuild | about 10–20% of compute | Multi-architecture image builds (arm64 runners or QEMU) and a rehearsed migration of the node and database | ADR update, rehearsal, owner approval of the plan |
| 3 | **CI minutes:** skip API, image, and database jobs when only docs change; `timeout-minutes` on every job; Turborepo `--affected` runs | Stays inside GitHub's free minutes as the team grows | Path rules must never skip a check that a change needs | Delivery script change and rehearsal |
| 4 | **Cost-allocation tags** per product (`product=edu`, `product=platform`) on every resource and namespace (ADR-019 step 7) | Visibility, not a saving | None | Terraform `default_tags` change and activating the tags in Billing |
| 5 | **Idle checks** each month: unattached volumes, old snapshots, unused Elastic IPs, stale ECR repositories | Avoids silent leaks | None | Monthly review |

## Rules for new spend

- No always-on service without a roadmap trigger and the owner's approval; state its monthly cost in the plan shown before "yes apply".
- Prefer serverless and pay-per-use (SNS, SQS, Lambda, S3) over always-on managed services at this scale.
- Prefer a bundled component on the node (Traefik, the in-cluster PostgreSQL) until the roadmap moves it to a managed service.
- Set log retention on every CloudWatch log group, and lifecycle rules on every bucket and repository, in the same change that creates it.
- Any change expected to add more than US$5 a month includes a cost line in its pull request and in this document.

## Scale-out cost (for planning)

The EKS layout (two nodes across two Availability Zones, RDS, a load balancer, a NAT gateway or VPC endpoints) costs about US$180–300 a month. Move only when a trigger in the [DevOps roadmap](ROADMAP.md) is met and revenue covers it.

## Monthly review (15 minutes)

1. Cost Explorer: this month by service compared with last month; replace the estimate table above with actual figures.
2. Budget: forecast below US$50? If not, find the service that grew.
3. Idle resources (next savings #5).
4. Record the total and any action in the [changelog](../planning/CHANGELOG.md).
