---
name: oxinov-terraform
description: Change Oxinov AWS infrastructure through Terraform - the bootstrap, production/edge, and production/starter stacks, fmt, validate, saved plans with monthly cost, and the owner's apply approval. Use for any change under devops/terraform or any request to create, change, or delete an AWS resource.
---

# Oxinov Terraform

Plan larger or cross-cutting infrastructure changes first with the oxinov-devops-architecture skill (tool ownership, today's production against the reference architecture, and the production safety rules).

Rules: [DevOps rules](../../../docs/14-ai-knowledge/devops-rules.md), [AGENTS.md](../../../AGENTS.md) sections 3 and 7.2. Source: [devops/terraform](../../../devops/terraform/README.md), [cloud architecture](../../../docs/04-architecture/cloud-architecture.md), [cost optimization](../../../docs/10-devops/cost-optimization.md).

## Stacks

| Stack | Folder | Holds |
| --- | --- | --- |
| Bootstrap | `devops/terraform/bootstrap` | The encrypted, versioned S3 bucket that holds Terraform state |
| Edge | `devops/terraform/environments/production/edge` | The Route 53 zone and certificate, company mail records, and the `oxinov.com` website (S3, CloudFront, the CloudFront Function router in `site-router.js`) |
| Starter | `devops/terraform/environments/production/starter` | The node (`server.tf`), network, security, storage and ECR (`storage.tf`, from `services.yaml`), DNS and SES (`dns-and-mail.tf`, `email-events.tf`), deploy roles (`deploy.tf`), budget alerts (`cost.tf`) |

Terraform 1.16 with S3 state and a lockfile. Region `ap-south-1` (Mumbai).

## Steps

1. Change the stack's `.tf` files. Never change AWS in the console or with CLI writes; an emergency console change is imported the same day.
2. Format and validate:

   ```bash
   terraform fmt -recursive devops/terraform
   terraform -chdir=devops/terraform/environments/production/starter validate
   ```

3. Make a saved plan (the owner must be signed in with `aws sso login`; never ask for keys):

   ```bash
   terraform -chdir=devops/terraform/environments/production/starter plan -out=tfplan
   ```

   `oxctl plan` does the same and never applies.
4. Show the owner every resource to add, change, or destroy, and the monthly cost of each new resource. Any destroy of a resource that holds data needs explicit confirmation.
5. Apply only after the owner answers "yes apply" for that exact plan: `terraform apply tfplan`. One approval never covers the next plan.
6. Update [current state](../../../docs/04-architecture/current-state.md), [cost optimization](../../../docs/10-devops/cost-optimization.md), and the changelog.

## Watch for

- Renaming a key in `services.yaml` renames an ECR repository, which Terraform would destroy with its images. Keep the old one (see the [ADR-027 cutover runbook](../../../docs/10-devops/runbooks/edu-rename-cutover.md), part A).
- Budget: all of AWS stays within US$50 a month (NFR-18). No always-on spend without a roadmap trigger.
- Secrets never go in `.tf` files, variables files, or state; they live in SSM Parameter Store.
- A push to `main` never applies Terraform; CI only runs `fmt` and `validate`.
