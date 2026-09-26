# System architecture: Oxinov Edu

**Scope:** the Oxinov Edu product. The shared company control plane and cross-product boundaries are in the [company platform architecture](COMPANY-PLATFORM-ARCHITECTURE.md); what runs today is in [CURRENT-STATE.md](CURRENT-STATE.md). **Updated:** 2026-09-26.

One SaaS platform serves many learning spaces (tenants). A person holds memberships in several spaces with a role in each; the active space is resolved from verified membership and the address, never from email text. Tenant-owned data carries `tenant_id`.

## Today

```text
Browser ─HTTPS─> Traefik (k3s ingress, Let's Encrypt)
                  ├─ edu.oxinov.com ─> edu-web (Next.js, server-side calls) ─> lms-api (NestJS) ─> PostgreSQL (lms)
                  ├─ app.oxinov.com ─> platform-web ─> platform-api ─> PostgreSQL (platform)
                  └─ id.oxinov.com  ─> Keycloak ─> mail-relay ─> Amazon SES
lms-api ─presigned URLs─> private S3 (media, resources)       Browser ─direct upload/playback─> S3
Helm hook: migrate job before each release     CronJob: nightly backup ─> S3
```

Everything runs on one k3s node (ADR-018). The APIs have no public host: browsers call the web apps, which call the APIs with the person's token from the server. Uploads and playback go directly between the browser and S3 with short-lived presigned URLs issued after tenant and role checks.

## At scale

The same images and chart move to Amazon EKS with RDS (ADR-018). Workers (`lms-worker`) and a chat gateway (`lms-chat`) are added when their features are approved; products exchange events through an outbox and SNS/SQS (ADR-019); OpenTelemetry traces connect portal, APIs, and sign-in.

## Rules

- API modules own tenant checks and business rules; PostgreSQL row-level security is a second boundary (ADR-006).
- Frontends never connect to a database.
- Platform subscription billing and learner course purchases are separate flows. Webhooks are verified, recorded, and processed once.
- AI proposes tenant-scoped drafts through authorized commands only; it never reaches the database or a shell (ADR-014).

Detail: [technology stack](TECH-STACK.md), [AWS architecture](AWS-CLOUD-ARCHITECTURE.md), [data flow](DATA-FLOW.md), [database design](../data/DATABASE-DESIGN.md), [observability](../devops/OBSERVABILITY.md), and [SOC design](../security/SOC.md).
