# Oxinov company platform technology stack

## Selected baseline

**Updated:** 2026-09-28. "Today" is verified in production or CI ([CURRENT-STATE.md](current-state.md)); "Target" is where each area goes when its trigger in the [DevOps roadmap](../10-devops/devops-roadmap.md), ADR-021, or the [technology radar](tech-radar.md) (ADR-024) is met. New services follow the radar's [golden path](tech-radar.md#golden-path-for-a-new-service).

| Area | Today | Target |
| --- | --- | --- |
| Monorepo | pnpm 12.6 workspaces (strict catalog, one lockfile) and Turborepo; Node.js 22; TypeScript 5.9 | Node.js 24 LTS (radar A8); Turborepo `--affected` runs in CI; assess the TypeScript 7 native compiler |
| Websites and portals | Next.js 16 App Router, React 19, Tailwind CSS 4, shared `@oxinov/design-system`; `oxinov.com` is a static export on S3 and CloudFront | React Compiler (A7); Playwright and axe end-to-end tests (A3) |
| Mobile apps | None yet | Expo with Expo Router and the generated API client (trial T6) |
| Backend | NestJS 11 with strict TypeScript, class-validator, `@oxinov/server-kit` (custom JSON logger), Jest | OpenTelemetry (A1) and pino (A6) in `server-kit`; Vitest (trial T1) |
| API style | REST with generated OpenAPI; APIs reachable only from the web apps' servers; web clients hand-written | Generated clients (`openapi-typescript`, `openapi-fetch`) and an `oasdiff` breaking-change check (A2) |
| Identity | Keycloak 26 (OIDC) at `id.oxinov.com`, email one-time code, one account for every product (ADR-011, ADR-016) | Google and Apple sign-in, staff MFA, organizations |
| Transaction data | PostgreSQL 18 in the cluster with Prisma 7 migrations and row-level security; one database and role pair per plane | Amazon RDS for PostgreSQL |
| Cache, queues, realtime | None (ADR-021) | SQS workers first; Redis-compatible cache only for measured hot reads; WebSocket gateway for chat |
| Events between products | None yet | Transactional outbox to SNS with an SQS queue per consumer, first for Edu certificates to Oxinov HR candidate profiles (trial T3) |
| Files and media | Private S3 with presigned URLs; SeaweedFS locally | HLS delivery through CloudFront when needed (ADR-021) |
| Search | PostgreSQL | OpenSearch only when search scale or analytics requires it |
| Generative AI | None yet | Provider-neutral AI gateway with Amazon Bedrock first (ADR-014) |
| Payments | None yet | Provider adapter and internal ledger; Khalti and eSewa for Nepal, an international provider for other markets |
| Observability | CloudWatch alarms, Kubernetes health checks, release smoke test, JSON logs; Prometheus, Alertmanager, and Grafana configuration checked in CI and run locally | OpenTelemetry to the Grafana Cloud free tier (A1); `pg_stat_statements` (A9) |
| Security operations | Trivy (images, repository, secrets, IaC), Dependabot, pinned digests, security-event schema, CloudTrail, GuardDuty with email alerts, staff MFA in Keycloak | Semgrep SAST (A4), SBOMs and cosign-signed images (A5), WAF, SIEM ([security roadmap](../09-security/security-baseline.md#roadmap)) |
| Local delivery | Docker Compose (PostgreSQL, SeaweedFS object storage, Keycloak, Mailpit, and a monitoring profile; its Redis service is not used by any app yet) and a throwaway local k3s for delivery rehearsal | Same |
| Production delivery | AWS Mumbai; one k3s node on EC2 with Helm 4; GitHub Actions with OIDC; ECR with immutable tags; automatic deploy of every green `main` (ADR-018, NFR-17) | Amazon EKS with the same chart, a staging namespace, and GitOps (Argo CD) |
| Infrastructure as code | Terraform 1.16 for every AWS resource, S3 state with lockfile | Same, with per-product accounts for regulated products |
| Edge and networking | Route 53, CloudFront for the website, Traefik with Let's Encrypt on the node, security group open on 80/443 only, no NAT gateway | CloudFront and AWS WAF in front of every app, load balancer, private subnets |
| Secrets | SSM Parameter Store SecureStrings, encrypted Kubernetes Secrets, instance and OIDC roles (no long-lived keys) | Secrets Manager where rotation is required |

## Version policy

Use the current supported stable release when a component is first implemented, then pin the exact package version in the lockfile and pin production images by digest. Renovation changes arrive as reviewed pull requests with release-note and migration checks. Do not write unpinned `latest` tags in production definitions.

## Architecture policy

- Begin with a modular control-plane backend and the existing modular LMS backend. Do not create one microservice per table or feature.
- Extract a module when it needs independent scaling, deployment cadence, security boundary, availability target, data ownership, or a dedicated team.
- Keep domain code independent of NestJS, Prisma, payment SDKs, and AI SDKs where practical. Provider code implements application ports.
- Require type checking, linting, unit tests for domain rules, integration tests for database and provider boundaries, contract tests, and end-to-end tests for critical journeys.
- Generate OpenAPI clients for web and mobile; do not duplicate handwritten request types.

## References

- [Next.js App Router](https://nextjs.org/docs/app)
- [NestJS modules](https://docs.nestjs.com/modules)
- [Keycloak administration and organizations](https://www.keycloak.org/docs/latest/server_admin/)
- [PostgreSQL row-level security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OpenTelemetry documentation](https://opentelemetry.io/docs/)
- [Kubernetes production considerations](https://kubernetes.io/docs/setup/production-environment/)
- [Oxinov AWS cloud architecture](cloud-architecture.md)
- [Oxinov AI platform architecture](ai-architecture.md)
- [AWS Bedrock or SageMaker decision guide](https://docs.aws.amazon.com/decision-guides/latest/decision-guides/bedrock-or-sagemaker.html)
- [AWS VPC planning](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-getting-started.html)
- [Amazon RDS for PostgreSQL](https://aws.amazon.com/rds/postgresql/)
- [k3s documentation](https://docs.k3s.io/)
- [Helm 4](https://helm.sh/docs/)
- [Khalti payment gateway](https://docs.khalti.com/)
- [eSewa payment API](https://developer.esewa.com.np/)
- [Stripe global availability](https://stripe.com/global)
