# System architecture

**Scope:** This document defines the Oxinov Edu product architecture. The shared company control plane and cross-product boundaries are defined in [Oxinov company platform architecture](COMPANY-PLATFORM-ARCHITECTURE.md).

One SaaS platform serves many tenant LMS workspaces. A user identity may hold memberships in several tenants; the active tenant is resolved from verified membership and workspace address, not email text. Tenant-owned data carries `tenant_id`.

```text
Browser -> Next.js frontend -> NestJS API -> PostgreSQL
Android/iOS Expo app ---------> NestJS API -> Redis / object storage
Chat clients -> WebSocket gateway -> PostgreSQL + Redis fanout
API -> worker -> email / Mux / payments / AI provider
Services/exporters -> Prometheus -> Alertmanager
Prometheus ----------> Grafana dashboards
Identity/apps/AWS/GuardDuty -> security-event collector -> SIEM
SIEM -> Sigma findings -> SOC alert -> runbook / incident record
```

The frontend, API, worker, and chat gateway are independently built Docker targets. PostgreSQL and Redis run in Docker locally; production uses RDS PostgreSQL and ElastiCache in AWS. Files use S3-compatible storage locally and private Amazon S3 in production. API modules own tenant checks and business rules. PostgreSQL row-level security adds a second tenant boundary. Prometheus scrapes private service and infrastructure metrics, Alertmanager routes operational alerts, and Grafana displays provisioned dashboards. A separate security pipeline validates normalized security events, sends them to an access-controlled SIEM, applies Sigma detections, and opens SOC runbooks. GuardDuty supplies initial ECS Fargate runtime findings. [Full technology choices](TECH-STACK.md), [AWS architecture](AWS-CLOUD-ARCHITECTURE.md), [data flow](DATA-FLOW.md), [database design](../data/DATABASE-DESIGN.md), [observability](../devops/OBSERVABILITY.md), and [SOC design](../security/SOC.md) define implementation detail.

Platform subscription billing and learner course purchases are separate flows. External webhooks are verified, recorded, and processed idempotently. AI can propose tenant-scoped drafts through authorized commands and cannot call the database or shell directly.
