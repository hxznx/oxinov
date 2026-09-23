# System architecture

One SaaS platform serves many tenant LMS workspaces. A user identity may hold memberships in several tenants; the active tenant is resolved from verified membership and workspace address, not email text. Tenant-owned data carries `tenant_id`.

```text
Browser -> Next.js frontend -> NestJS API -> PostgreSQL
Android/iOS Expo app ---------> NestJS API -> Redis / object storage
Chat clients -> WebSocket gateway -> PostgreSQL + Redis fanout
API -> worker -> email / Mux / payments / AI provider
Services/exporters -> Prometheus -> Alertmanager
Prometheus ----------> Grafana dashboards
```

The frontend, API, worker, and chat gateway are independently built Docker targets. PostgreSQL and Redis run in Docker; files use S3-compatible storage. API modules own tenant checks and business rules. PostgreSQL row-level security adds a second tenant boundary. Prometheus scrapes private service and infrastructure metrics, Alertmanager routes operational alerts, and Grafana displays provisioned dashboards. [Full technology choices](TECH-STACK.md), [data flow](DATA-FLOW.md), [database design](../data/DATABASE-DESIGN.md), and [observability](../devops/OBSERVABILITY.md) define implementation detail.

Platform subscription billing and learner course purchases are separate flows. External webhooks are verified, recorded, and processed idempotently. AI can propose tenant-scoped drafts through authorized commands and cannot call the database or shell directly.
