---
name: oxinov-devops-architecture
description: Design and change Oxinov delivery, cloud, and infrastructure as one system - the decision process, tool ownership (Git, GitHub Actions, Docker, ECR, Terraform, Helm, k3s, Ansible), environments, branching and reviews, CI and CD stages, build once, images and registries, Terraform state and plans, AWS account, IAM, network and security groups, S3, Kubernetes workloads, probes, rollouts and graceful shutdown, secrets, observability, SRE objectives, reliability, backup and disaster recovery, cost, tagging and naming, drift, patching, incidents and runbooks, production safety rules, and the scale-out path to ALB, EKS, and multiple Availability Zones. Use when planning or reviewing any infrastructure, pipeline, deployment, or operations change.
---

# Oxinov DevOps, cloud, and infrastructure architecture

Act as a senior DevOps, cloud, and site reliability engineer for Oxinov Pvt. Ltd. DevOps is not "write YAML and deploy": it connects developer, source control, build, test, security, infrastructure, deployment, operations, monitoring, and recovery into one reliable delivery system.

Related skills (the how-to for each tool): oxinov-cicd, oxinov-docker, oxinov-kubernetes, oxinov-terraform, oxinov-aws, oxinov-ansible, oxinov-server, oxinov-observability, oxinov-scaling, oxinov-security-operations, oxinov-secrets-and-crypto, oxinov-version-control. Rules: [DevOps rules](../../../docs/14-ai-knowledge/devops-rules.md), [AGENTS.md](../../../AGENTS.md) sections 3 and 7-9. Sources: [current state](../../../docs/04-architecture/current-state.md), [cloud architecture](../../../docs/04-architecture/cloud-architecture.md), [CI/CD](../../../docs/10-devops/ci-cd.md), [deployment](../../../docs/10-devops/deployment.md), [environments](../../../docs/10-devops/environments.md), [rollback](../../../docs/10-devops/rollback.md), [backup and recovery](../../../docs/10-devops/backup-recovery.md), [cost optimization](../../../docs/10-devops/cost-optimization.md), [DevOps roadmap](../../../docs/10-devops/devops-roadmap.md), [production runbook](../../../devops/kubernetes/README.md). Decisions: ADR-009, ADR-017, ADR-018, ADR-019, ADR-021, ADR-022.

Keep analysis proportional: a values change follows the existing pattern. A new AWS resource, a network, IAM, or secrets change, a pipeline change, or anything affecting availability, recovery, or cost gets the decision process first, and the output names the architecture, tool ownership, IAM, network flow, deployment and rollback, secrets, monitoring, security, and monthly cost before the code.

**When uncertain, prioritize:** security, correctness, reliability, recoverability, simplicity, automation, observability, maintainability, scalability, performance, cost. Cost is still a hard requirement: all of AWS stays within US$50 a month (NFR-18) unless the owner approves more.

## 1. Decision process

1. Which application or business requirement is served?
2. Which environment is affected (today: local, CI, production)?
3. What already exists (current state, Terraform, chart, scripts)?
4. Which tool owns the resource (section 3), and does another tool already touch it?
5. Which IAM permissions and network access are needed, and is it public or private?
6. Which secrets are involved and where do they live?
7. What happens if the deploy fails, and what is the rollback or forward fix?
8. What monitoring, backup, and recovery does it need?
9. What is the monthly cost and memory impact?
10. What are the security risks, which tests or rehearsals prove it, and can it be automated?
11. Does it need the owner's approval (AGENTS.md section 3)?

Delivery chain to reason about: developer → Git → review → CI (checks, tests, scans) → build → image → ECR → infrastructure (Terraform) → deployment (Helm over Systems Manager) → runtime (k3s) → monitoring → alerting → recovery.

## 2. The production system today

```text
GitHub (main) ─▶ CI (ci.yml) ─▶ deploy-production.yml ─▶ ECR (immutable SHA tags, scan on push, keep 30)
                                                   └─▶ SSM Run Command ─▶ deploy.sh ─▶ helm upgrade --rollback-on-failure --wait
Internet ─80/443─▶ one EC2 t3a.medium in one public subnet (ap-south-1, one AZ) ─▶ k3s ─▶ Traefik (TLS, HSTS)
                                                   ├─ edu-web, platform-web, keycloak (public hosts)
                                                   ├─ edu-api, platform-api, mail-relay (internal)
                                                   └─ PostgreSQL StatefulSet on the encrypted disk; backup CronJob ─▶ S3
oxinov.com ─▶ CloudFront ─▶ private S3          Route 53 · SES · Parameter Store · CloudWatch alarms · GuardDuty · KMS
```

| Reference pattern | Oxinov today | When it changes |
| --- | --- | --- |
| Dev, test, staging, production | Local, CI, production only; delivery rehearsed on a throwaway local k3s | Staging with DevOps roadmap Phase 4 (second developer or first paying school) |
| Separate AWS accounts per environment | One account | With staging or a compliance need |
| ALB or NLB | None; Traefik on the node terminates TLS (Let's Encrypt) | With EKS |
| Private subnets and NAT gateway | One public subnet, no NAT (a NAT gateway costs more than the budget allows); the security group allows only 80 and 443 inbound | With EKS or RDS |
| Multiple Availability Zones | One node in one AZ; host failure means minutes of downtime (ADR-017) | When an availability commitment exists |
| EKS, cluster autoscaler, HPA | k3s on one node, one replica per service | Two or more live products or availability needs (scalability step 4) |
| Managed database | PostgreSQL in the cluster with nightly dumps and snapshots | RDS at scalability step 3 |
| Secrets Manager | SSM Parameter Store (SecureString) rendered into the `oxinov-app` Secret | If rotation automation needs it |
| Ansible for configuration | Not used; `bootstrap-node.sh` and Terraform user data (oxinov-ansible) | Several hosts outside Kubernetes |
| GitOps controller | Push-based deploy from Actions over Systems Manager | With EKS and a team that can run it |
| CloudTrail trail and AWS Config | No trail resource in Terraform, although an EventBridge rule (`cloudtrail_tampering`) watches for logging being stopped; confirm with the read-only `aws cloudtrail describe-trails` before relying on audit history. AWS Config off | Security roadmap |

Use the reference architecture as a destination, never force it early: each step waits for its measured trigger in the [scalability strategy](../../../docs/04-architecture/scalability.md).

## 3. Tool ownership

| Resource | Owner | Never |
| --- | --- | --- |
| Source, history, reviews | Git and GitHub | Force-push `main` or rewrite history |
| Pipelines | `.github/workflows` calling bash scripts in `devops/scripts` and `devops/kubernetes/scripts` | Logic inside workflow YAML |
| Images | `devops/docker/Dockerfile` targets; registry entries from `services.yaml` | Build per environment, `latest` tags |
| Every AWS resource | Terraform stacks `bootstrap`, `production/edge`, `production/starter` | Console or CLI writes; untracked changes |
| Node setup | `bootstrap-node.sh` and `user-data.sh.tftpl` | Hand changes on the node |
| Workloads, ingress, policies, jobs | One Helm chart `devops/kubernetes/helm/oxinov` | One-off manifests, `kubectl apply` by hand |
| Service list | `services.yaml` (generated catalog, CODEOWNERS, ECR repos, chart checks) | Hard-coded service lists |
| Sign-in configuration | `devops/keycloak/configure-realm.sh` (re-applied on push) | Clicking changes in the admin console |

One owner per resource. Terraform creates infrastructure; Helm releases workloads; scripts glue them together.

## 4. Git, reviews, and CI/CD

- Small, reviewable commits with conventional messages; nothing secret committed (oxinov-version-control). Branch protection and required reviews are **not configured yet** ([Git workflow](../../../docs/08-engineering/git-workflow.md)); until they are, the rule is: push only when the owner asks, with `main` green and no deploy running.
- A change description states what and why, risk, tests run, deployment and migration impact, and rollback.
- CI order: cheap checks first (docs, catalogs, lint, types), then unit and integration tests, migration drift, builds, Terraform `fmt` and `validate`, delivery checks, image build and Trivy scan. Fail fast.
- CD: release plan (rebuild only changed images) → build once per commit SHA → Trivy gate → push to ECR → push the chart → `deploy.sh` over Systems Manager → `helm upgrade --rollback-on-failure --wait` → public host checks → smoke test → automatic rollback on failure. A green pipeline is not proof: check `oxctl status` and `oxctl smoke` after risky releases.
- Build once, promote the same image; pin base images, tools, actions, and charts by version and digest or SHA-256.
- CI uses GitHub OIDC roles (separate roles for the production deploy and the website deploy), never long-lived AWS keys. Untrusted pull requests must never reach production secrets or roles.
- Security in the pipeline: Trivy on the repository (secrets, vulnerabilities, misconfiguration) and on every image; Dependabot; CodeQL and dependency review wait for GitHub Advanced Security.

## 5. Containers and registry

Multi-stage builds, dependency layers before source, `.dockerignore`, minimal runtime images, numeric non-root user, no build tools or secrets in runtime layers, a `HEALTHCHECK`. ECR repositories are created by Terraform from `services.yaml`, with immutable tags, scan on push, encryption, and a lifecycle rule keeping the last 30 images. Deploy by commit SHA. (oxinov-docker)

## 6. Terraform

- Flow: `fmt` → `validate` → saved `plan` → review (creates, updates, **destroys and replacements**, IAM, network, security groups, data stores) with the monthly cost → the owner's "yes apply" for that plan → `apply`. CI never applies.
- State lives in the encrypted, versioned S3 bucket from the `bootstrap` stack with a lockfile; never delete, edit, or commit state, and never put secrets in variables or state.
- Every resource gets the provider's default tags (`Project`, `Environment`, `Stack`, `ManagedBy = terraform`); names are predictable (`oxinov-...`).
- Prefer references over `depends_on`; keep stacks small; extract a module only when a pattern repeats (there are no modules today).
- Renaming a key that drives `for_each` (such as a `services.yaml` entry) destroys and recreates the resource: plan a move or keep the old one (see the ADR-027 cutover runbook, part A). (oxinov-terraform)

## 7. AWS, IAM, and network

- IAM: roles and temporary credentials only; least privilege with narrow actions and resources; the instance role, the deploy roles, and the site deploy role each have only their job. Explicit deny beats allow beats default deny. The owner signs in with `aws sso login`; assistants never handle credentials. Root account use is for emergencies only.
- Network today: one VPC, one public subnet, an internet gateway, a security group with 80 and 443 in, IMDSv2 with hop limit 2, no SSH. At EKS, move workloads and data to private subnets across Availability Zones behind an ALB, use VPC endpoints before paying for NAT, and chain security groups (ALB → app → database); a database is never open to `0.0.0.0/0`.
- S3: private by default with Block Public Access, bucket policies, encryption, versioning where needed, and lifecycle rules (dumps kept 30 days). Media goes through short-lived presigned URLs; the website bucket is private behind CloudFront.
- DNS in Route 53 (alias records, sensible TTLs); TLS everywhere: Let's Encrypt at Traefik and ACM for CloudFront. (oxinov-aws)

## 8. Kubernetes and Helm

- Workload standard: numeric non-root user, read-only root filesystem, dropped capabilities, `RuntimeDefault` seccomp, measured requests and memory limits within `memoryBudgetMi` (3,300 MiB), priority classes, startup, liveness, and readiness probes with different jobs, deny-by-default network policies with explicit `allowFrom`, secrets from the `oxinov-app` Secret, ConfigMaps only for non-secret settings, labels `app.kubernetes.io/name`, `part-of`, and `managed-by`.
- Deployments use rolling updates with `maxUnavailable: 0` and `maxSurge: 1`; Keycloak uses `Recreate` because two JVMs do not fit the node. Zero downtime also needs readiness probes, graceful shutdown on SIGTERM (the APIs enable shutdown hooks), and backward-compatible APIs and migrations.
- PostgreSQL runs as a StatefulSet on the node's encrypted disk (ADR-017); moving to RDS is scalability step 3.
- Namespace `oxinov`, one release; one namespace and release per product plane comes with ADR-019's later steps.
- Before release: `helm lint`, rendered-manifest validation (`kubeconform`) through `check-delivery.sh`, and the local k3s rehearsal for chart, node-script, or realm changes. Helm rollback restores workloads, not data: migrations must be backward compatible. (oxinov-kubernetes)

## 9. Secrets

Lifecycle: create (by the owner) → store in Parameter Store → authorize (instance role reads only its paths) → render into the `oxinov-app` Secret → use as environment references → rotate → revoke. Never in Git, images, logs, build artifacts, Terraform state, or values files. (oxinov-secrets-and-crypto)

## 10. Observability, SRE, and alerting

- Logs: structured JSON with service, environment, version, and request ID, read with `oxctl logs`; no central log store yet.
- Metrics and traces: the APIs expose `oxinov_http_*` metrics privately, but production does not scrape them; Prometheus, Alertmanager, and Grafana run locally and in CI. OpenTelemetry and a hosted backend come with ADR-019 step 5.
- Alerts today: CloudWatch instance and system status (with automatic recovery), SES bounce and complaint rates, budget alerts at 85%, 100%, and forecast 100%, and GuardDuty findings and CloudTrail-tampering events routed through EventBridge to SNS (`security.tf`). Alert only on symptoms someone must act on.
- Objectives: availability 99.9% a month, RPO 24 hours, RTO 4 hours are **proposed** in NFR-05; do not promise an SLA to customers until the owner approves one. Track the error budget once metrics exist. (oxinov-observability)

## 11. Reliability, backup, and disaster recovery

- Timeouts on every network call, retries only for transient errors with backoff, jitter, and a limit, graceful shutdown, health checks, and automatic rollback.
- Backups: nightly `pg_dumpall` to S3 (30 days), daily encrypted EBS snapshots (7 days), versioned state and website buckets. No point-in-time recovery yet. A backup counts only after a restore test (quarterly under NFR-05; the first is still open).
- Disaster cases to plan for: host failure (CloudWatch recovery, then restore), failed deploy (automatic rollback, `oxctl rollback`), data corruption or deletion (restore with the owner's approval), credential compromise (the owner rotates; GuardDuty helps detect), region loss (not covered today; encrypted backup copies in Hyderabad are the documented next step in the cloud architecture).
- Detect → assess → stabilize → mitigate → recover → verify → review, with times in UTC and every production change tracked. (oxinov-server)

## 12. Cost

The whole platform runs within US$50 a month, most of it the node. State the monthly cost of every new resource in its plan and in cost optimization; avoid NAT gateways, load balancers, and always-on managed services until a roadmap trigger; use lifecycle rules; tag everything; no autoscaling without a maximum. `oxctl cost` shows spend.

## 13. Operations hygiene

- Drift: Terraform plan shows it; the node is rebuilt from scripts; the chart reconciles workloads. An emergency console change is imported into Terraform the same day.
- Patching: Amazon Linux automatic security updates, pinned k3s and Helm versions upgraded deliberately (application, add-on, and chart compatibility first; one minor version at a time), Dependabot for images and packages.
- Access: no SSH or bastion; `oxctl shell` over Systems Manager is audited; break-glass only for approved runbook steps.
- Runbooks: symptoms → checks → mitigation → escalation; production runbooks live in `devops/kubernetes/README.md` and `docs/10-devops/runbooks/`.
- Post-incident: what happened, impact, timeline, detection, contributing factors, what worked, what failed, actions; blameless; recorded in the changelog (and `security/soc/incidents/` for security events).

## 14. Production safety rules

Never, without explicit reasoning and the owner's approval: delete or edit Terraform state; destroy production resources; open a database or admin port to the internet; disable TLS, authentication, security groups, network policies, RBAC, backups, monitoring, or encryption; run privileged containers or mount the container runtime socket; commit secrets; expose the Kubernetes API publicly; skip a security gate to ship.

## 15. Before changing existing infrastructure

Inspect: repository layout, workflows and scripts, Terraform stacks and state backend, Dockerfile targets, ECR, the AWS account and IAM roles, the network, the chart and its values, `services.yaml`, secrets handling, alarms and logs, backups, security controls, the current deployment strategy, and the documented conventions. Do not redesign working infrastructure without understanding its dependencies.
