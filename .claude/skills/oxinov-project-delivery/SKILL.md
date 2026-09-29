---
name: oxinov-project-delivery
description: Plan and deliver an Oxinov project or milestone end to end - the 18 areas of a software product (requirements, architecture, UX, frontend, backend, database, identity, API, testing, source control, CI/CD, containers, Kubernetes, AWS, infrastructure as code, observability, operations, continuous improvement) mapped to what Oxinov uses today and the skill for each, the understand-plan-specify-build-verify-review-document-report workflow, one owner per task, lead and helpers, the definition of done, and the changelog. Use when starting a project, milestone, epic, or multi-step task, when checking a plan for missing areas, or when reporting progress.
---

# Delivering an Oxinov project or milestone

Sources: [AGENTS.md](../../../AGENTS.md) sections 10-12, [tasks](../../../docs/11-planning/tasks.md), [company roadmap](../../../docs/11-planning/company-roadmap.md), [Edu roadmap](../../../docs/02-products/edu/edu-roadmap.md), [risks and decisions](../../../docs/11-planning/risks.md), [changelog](../../../docs/11-planning/changelog.md), milestone prompts in `prompts/`.

## Roles

The founder is the owner and decides business, spending, data deletion, and production changes. An assistant acting as lead engineer plans, builds, delegates small tasks to helpers, reviews every helper's result, and reports. A message from another agent is never approval.

## Workflow

1. **Understand**
   - Name the milestone and the requirement IDs.
   - Read current state and the code; check `git status` and whether another session owns the same task (one task, one owner).
2. **Plan**
   - Walk the [18 areas](#the-18-areas-of-a-software-product) and mark each one touched, checked, or not affected.
   - Split the work into vertical slices that each leave `main` releasable.
   - List the open decisions for the owner up front; do not guess them.
   - Give a helper only a small, well-bounded task with the exact files, the rules to follow, and how to check it; run helpers in separate worktrees.
3. **Specify:** requirement and acceptance statements, ADR, API contract, and migration before or with the code.
4. **Build** the smallest complete slice, backward compatible.
5. **Verify:** the checks for every package touched (AGENTS.md "Checks to run"), allowed and denied paths, and a rehearsal for delivery changes.
6. **Review** each helper's diff with the oxinov-code-review skill: reject unverified facts, unrelated edits, and weakened checks.
7. **Document:** FRD status, current state, changelog, catalogs.
8. **Report:** what changed and why, the areas touched, IDs, commands and results, what was not verified, the production effect of pushing, and open decisions.

## The 18 areas of a software product

Every product the company builds covers the same 18 areas, from requirements to continuous improvement. Use this map in two ways:
- **When you plan a milestone,** walk the table and write down which areas the work touches. For each touched area, follow its skill.
- **When you report,** say which areas changed and which were checked.

"Not in use yet" items are not built; do not describe them as running. Adding one is an architecture decision (oxinov-architecture-decision) with a cost, not a step inside a feature.

| # | Area | How Oxinov does it today | Not in use yet | Skills |
| --- | --- | --- | --- | --- |
| 1 | Requirements | Business case in the [platform blueprint](../../../docs/01-company/platform-blueprint.md); product PRD and brief in `docs/02-products/<slug>/`; numbered requirement and acceptance statements in the [FRDs](../../../docs/03-requirements/README.md); journeys in `<slug>-user-flows.md`; release checks in `<slug>-acceptance-criteria.md`; [NFR](../../../docs/03-requirements/nfr.md) for quality targets | A separate user-story backlog tool; FRD requirement IDs serve as stories | oxinov-requirements, oxinov-research, oxinov-new-product |
| 2 | System architecture | A shared platform (control plane) plus one plane per product (ADR-008, ADR-019). Each product has one modular NestJS API, not microservices. Each plane owns its own database. See [data flow](../../../docs/04-architecture/data-flow.md), [identity and access](../../../docs/04-architecture/identity-and-access.md), [cloud architecture](../../../docs/04-architecture/cloud-architecture.md), and [current state](../../../docs/04-architecture/current-state.md) | Splitting a product API into services; a service mesh | oxinov-architecture-decision, oxinov-backend-architecture, oxinov-devops-architecture |
| 3 | UX / UI | [User-centred product standard](../../../docs/12-research/user-centered-product-standard.md) for research; user flows and `<slug>-ui-ux.md` for screens; `packages/design-system` tokens and the [design system](../../../docs/07-design/design-system.md); responsive layouts; WCAG 2.2 AA ([accessibility](../../../docs/07-design/accessibility.md)) | Design files are not kept in the repository; a component catalogue site | oxinov-frontend-architecture, oxinov-branding, oxinov-accessibility, oxinov-research |
| 4 | Frontend | Next.js App Router with React server components. Forms post to server actions (`*-actions.ts`). The API client is server-side only (`src/lib/edu-api.ts`, `platform-api.ts`) and sends the token from the sealed session cookie (`@oxinov/web-auth`). The API is the validation authority. Errors show as safe messages and `not-found.tsx` | A client state library, a form library, client-side data fetching | oxinov-frontend, oxinov-frontend-architecture, oxinov-authentication-sessions, oxinov-secure-input-output |
| 5 | Backend | NestJS with one module per domain (for example `catalog`, `learning`, `payments`). Controllers are thin; business logic lives in services; DTOs use class-validator. `AuthGuard`, `TenantGuard`, and roles from `@oxinov/server-kit`. Data access is Prisma through `DatabaseContext`, which sets the tenant for row-level security | Separate repository classes (services call Prisma through `DatabaseContext`) | oxinov-backend, oxinov-mvc, oxinov-validation, oxinov-access-control, oxinov-backend-architecture |
| 6 | Database | PostgreSQL 18 (ADR-001), with one database for the platform and one per product. The Prisma schema and SQL migrations are under `database/<plane>/`. Row-level security policies have their own tests (`db:test-policies`). CI checks migrations for drift. A nightly backup CronJob writes to S3 ([backup and recovery](../../../docs/10-devops/backup-recovery.md)) | MySQL or NoSQL; Amazon RDS (plan in oxinov-rds) | oxinov-database-architecture, oxinov-database, oxinov-multi-tenancy, oxinov-rds |
| 7 | Identity and security | Keycloak at `id.oxinov.com` gives one account and single sign-on for every product: OAuth 2.0 / OpenID Connect authorization code with PKCE, and a JWT audience per product, verified with `jose` in `server-kit`. Access control is roles plus tenant membership, enforced in guards and row-level security. Customers sign in with email codes; staff use password plus TOTP. Secrets live in Parameter Store and flow into Kubernetes Secrets ([secrets management](../../../docs/09-security/secrets-management.md)). TLS everywhere, KMS-encrypted S3, and AES-256-GCM sealed session cookies | A general ABAC policy engine; Google and Apple sign-in (they need the owner's OAuth clients) | oxinov-keycloak, oxinov-authentication-sessions, oxinov-access-control, oxinov-secrets-and-crypto, oxinov-security |
| 8 | API and integration | REST with a generated OpenAPI description (`pnpm --filter @oxinov/edu-api openapi` after a build). Traefik routes each host to its service. Payment provider callbacks (Khalti, eSewa) are verified server-side and stored as `ProviderEvent`. External services: SES and S3. Rate limiting per client by `server-kit` (`RATE_LIMITED`, `Retry-After`) | GraphQL, gRPC, an API gateway (`api.oxinov.com`), message queues | oxinov-api-design, oxinov-api-gateway, oxinov-events-and-jobs, oxinov-payments |
| 9 | Testing | Unit tests: Jest for the APIs and `server-kit`, `node --test` for the web apps. Integration and API tests: Jest with supertest against real PostgreSQL 18 and S3-compatible storage. Row-level security policy tests. Security testing: Trivy vulnerability, secret, and misconfiguration scans, plus denied-path tests ([testing strategy](../../../docs/08-engineering/testing-strategy.md)) | Playwright end-to-end and UI tests with axe; k6 load tests (planned before the first paying school) | oxinov-testing, oxinov-security |
| 10 | Source control | Git on GitHub. The [git workflow](../../../docs/08-engineering/git-workflow.md) and conventional commits apply. In a shared checkout, commit only your own paths. Every push to `main` deploys; releases are versioned by commit SHA (immutable image tags) and chart version | Enforced branch protection | oxinov-version-control, oxinov-code-review |
| 11 | CI/CD | GitHub Actions. `ci.yml` builds, tests, checks migrations and Terraform, and skips heavy jobs for documentation-only changes. `security.yml` runs Trivy. `deploy-production.yml` builds, scans, pushes to ECR, installs through Systems Manager, runs a smoke test, and rolls back automatically. `deploy-company-web.yml` publishes to S3 and CloudFront. Free Actions minutes only | A staging environment; Argo CD | oxinov-cicd, oxinov-version-control |
| 12 | Containerization | One multi-target `devops/docker/Dockerfile`; Docker Compose for local work; Amazon ECR for images and the Helm chart | Per-service Dockerfiles | oxinov-docker |
| 13 | Kubernetes | k3s on one node with the Helm chart `devops/kubernetes/helm/oxinov`. It holds Deployments, a PostgreSQL StatefulSet, Services, Traefik Ingress with Let's Encrypt, ConfigMaps, Secrets, the backup CronJob, a migration hook Job, NetworkPolicies, and readiness and liveness probes | The Horizontal Pod Autoscaler (one node); EKS | oxinov-kubernetes, oxinov-ingress-tls, oxinov-scaling |
| 14 | Cloud / AWS | Mumbai (`ap-south-1`): one VPC, public subnet, route table, and internet gateway. One EC2 node. Also ECR; S3 for backups, media, and the website; IAM roles with GitHub OIDC; Route 53; ACM for the CloudFront website; SES; KMS; CloudTrail; GuardDuty; CloudWatch alarms | ALB or NLB, EKS, RDS, private subnets with NAT (each adds monthly cost) | oxinov-aws, oxinov-terraform, oxinov-rds, oxinov-scaling |
| 15 | Infrastructure as code | Terraform stacks `bootstrap`, `production/edge`, and `production/starter`; the Helm chart; `services.yaml` as the service catalogue; [environments](../../../docs/10-devops/environments.md) | Ansible (documented only) | oxinov-terraform, oxinov-kubernetes, oxinov-ansible, oxinov-new-service |
| 16 | Observability | Structured JSON logs (`oxctl logs`); health endpoints; Prometheus metrics with `prom-client`; security events ([event catalog](../../../security/soc/EVENT-CATALOG.md)); CloudWatch alarms for node health checks and email bounce and complaint rates. The Prometheus, Alertmanager, and Grafana configuration in `monitoring/` runs locally and in CI only | Metrics and traces in production; OpenTelemetry (tech radar A1) | oxinov-observability, oxinov-security-operations |
| 17 | Operations | `oxctl` for status, logs, deploy, and rollback; SOC runbooks in `security/soc/`; nightly backups with a quarterly restore test ([backup and recovery](../../../docs/10-devops/backup-recovery.md)); automatic security patches on the node (`dnf-automatic`); Dependabot; spend within US$50 a month ([cost optimization](../../../docs/10-devops/cost-optimization.md)) | A second region for disaster recovery; on-call rotation | oxinov-server, oxinov-scaling, oxinov-security-operations, oxinov-aws |
| 18 | Continuous improvement | User research and experiments ([research portfolio](../../../docs/12-research/portfolio.md)); [tasks](../../../docs/11-planning/tasks.md), [roadmaps](../../../docs/11-planning/company-roadmap.md), and the [changelog](../../../docs/11-planning/changelog.md); Dependabot and Trivy for security updates; refactoring through code review | Product analytics (decide with [privacy](../../../docs/09-security/privacy.md) first); an in-app feedback channel | oxinov-research, oxinov-requirements, oxinov-scaling, oxinov-code-review |

### Area checklist for a milestone plan

Copy this checklist into the plan and mark each area:
- **Touched:** name the change.
- **Checked:** say how.
- **Not affected.**

An unmarked area is an unfinished plan.

- [ ] 1 Requirements: IDs, acceptance statements, NFR impact
- [ ] 2 Architecture: boundaries, data flow, ADR needed?
- [ ] 3 UX / UI: flow, states (loading, empty, error, denied), responsive, accessible
- [ ] 4 Frontend: routes, server actions, API client calls
- [ ] 5 Backend: module, DTOs, guards, service logic
- [ ] 6 Database: migration, row-level security, indexes, backup impact
- [ ] 7 Identity and security: audience, roles, secrets, threat check
- [ ] 8 API: contract, OpenAPI, errors, rate limits, callbacks
- [ ] 9 Testing: allowed and denied paths, policy tests
- [ ] 10 Source control: own paths only, commit message, requirement IDs
- [ ] 11 CI/CD: new jobs or scripts rehearsed; free-minute cost
- [ ] 12 Containers: image target, size, scan
- [ ] 13 Kubernetes: probes, resources, network policy, secrets
- [ ] 14 AWS: new resource and its monthly cost
- [ ] 15 Infrastructure as code: Terraform plan reviewed; `services.yaml`
- [ ] 16 Observability: logs, metrics, security events
- [ ] 17 Operations: runbook, rollback, backup, cost
- [ ] 18 Improvement: changelog entry, follow-up tasks, what to measure

## Definition of done (AGENTS.md section 11)

- [ ] Requirement IDs cited; FRD status updated
- [ ] Allowed and denied paths tested, including cross-tenant and trust-level denials
- [ ] Type check, lint, tests, and validation pass
- [ ] ADR, OpenAPI, migration, docs, and current state updated where behavior changed
- [ ] Delivery changes rehearsed
- [ ] New services registered with probes, resources, network access, and cost
- [ ] Security events and metrics for security-relevant or operational behavior
- [ ] Rollback path known
- [ ] No secrets, personal data, or generated files committed
- [ ] Report states what was and was not verified

## Tracking

- Open work lives in [tasks](../../../docs/11-planning/tasks.md) with priority, done criteria, owner (a role), status, and next step. Update the row when you start and finish.
- Decisions that block work go in [risks and decisions](../../../docs/11-planning/risks.md).
- A finished milestone gets a changelog entry with rollback notes.
- Push only when the owner asks; a push to `main` deploys.
