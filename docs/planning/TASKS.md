# Implementation backlog

| Priority | Task | Acceptance evidence |
| --- | --- | --- |
| 0 | Approve the company platform blueprint, domain ownership, product owners, cloud/identity operations, and initial payment providers | Signed decision record, accountable owners, launch market, cost ceiling, DNS inventory, and external-account checklist |
| 0 | Bootstrap AWS Organizations, security/log archive, non-production and production accounts, budgets, GitHub Actions OIDC, Terraform state, and Mumbai environment networks | Reviewed Terraform plans, non-overlapping VPCs, two-AZ staging/production topology, protected state, no long-lived CI keys, budget alerts, CloudTrail, Config, GuardDuty/Security Hub, and recovery-copy evidence |
| 0 | Build the public company website and shared design-token foundation without moving LMS code | Accessible production build, approved content, legal routes, health checks, Docker target, CI, and deployment preview |
| 0 | Build the platform identity/organization/entitlement vertical slice | OIDC sign-in, organization isolation tests, product launcher, OpenAPI contracts, migrations, audit/security events, backups, metrics, traces, and rollback evidence |
| 0 | Scaffold frontend/web, frontend/mobile, backend/api, backend/worker, and backend/chat | Local builds and health endpoints. **backend/api done** (health, readiness, metrics); others open |
| 0 | Start PostgreSQL/Redis/MinIO via Compose and create migrations | Reproducible setup; data persists restart. **Migrations and seed done** |
| 0 | Implement tenant creation, membership, RLS, and domain routing | Two-tenant positive and negative tests. **Done except subdomain/custom-domain routing and invitations** |
| 0 | Instrument services and provision Prometheus, Alertmanager, exporters, and Grafana | Healthy scrape targets, dashboard loads, rules validate, and a synthetic alert reaches its staging receiver |
| 0 | Enforce CI security scanning and implement the normalized security-event contract | High/critical gate, schema tests, sensitive-field tests, and sample events |
| 1 | Implement catalog, courses, recorded media, enrollment, and payment | End-to-end paid learner journey. **Catalog read, draft course creation, and free enrollment done**; review/publish workflow, Mux media, provider-neutral checkout and verified payment processing open |
| 1 | Implement question bank, mock exams, results, assignments | Timed attempt and grading tests. **Attempts, autosave, expiry, grading, and results done**; question authoring API, result revisions, worker auto-submit, and assignments open |
| 1 | Build Android/iOS parity per module | Mobile flow tests and signed internal `.aab` |
| 2 | Add chat, notifications, AI drafts, analytics, and admin tools | Role and approval tests |
| 2 | Integrate SIEM detections, incident routing, and GuardDuty Runtime Monitoring for ECS Fargate; evaluate Falco for later EKS/EC2 | Healthy runtime coverage, synthetic findings, alert routing, and three completed runbook exercises |
| 2 | Production deployment and launch content | Security, load, restore, store, and content review |

Split these into small issues with FR IDs before coding. Product decisions in [RISKS.md](RISKS.md) may change ordering.
