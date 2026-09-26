# Oxinov company platform technology stack

## Selected baseline

**Updated:** 2026-09-26. "Today" is verified in production or CI ([CURRENT-STATE.md](CURRENT-STATE.md)); "Target" is where each area goes when its trigger in the [DevOps roadmap](../devops/ROADMAP.md) or ADR-021 is met.

| Area | Today | Target |
| --- | --- | --- |
| Monorepo | pnpm 12.6 workspaces (strict catalog, one lockfile) and Turborepo; Node.js 22; TypeScript 5.9 | Same; Turborepo `--affected` runs in CI |
| Websites and portals | Next.js 16 App Router, React 19, Tailwind CSS 4, shared `@oxinov/design-system`; `oxinov.com` is a static export on S3 and CloudFront | Same; Playwright end-to-end tests |
| Mobile apps | None yet | React Native with Expo per product when the product needs one |
| Backend | NestJS 11 with strict TypeScript, class-validator, `@oxinov/server-kit` | Same; OpenTelemetry in `server-kit` (ADR-019) |
| API style | REST with generated OpenAPI; APIs reachable only from the web apps' servers | Versioned public APIs with generated clients and a compatibility check in CI |
| Identity | Keycloak 26 (OIDC) at `id.oxinov.com`, email one-time code, one account for every product (ADR-011, ADR-016) | Google and Apple sign-in, staff MFA, organizations |
| Transaction data | PostgreSQL 18 in the cluster with Prisma 7 migrations and row-level security; one database and role pair per plane | Amazon RDS for PostgreSQL |
| Cache, queues, realtime | None (ADR-021) | SQS workers first; Redis-compatible cache only for measured hot reads; WebSocket gateway for chat |
| Events between products | None yet (one product) | Transactional outbox to SNS with an SQS queue per consumer (ADR-019) |
| Files and media | Private S3 with presigned URLs; SeaweedFS locally | HLS delivery through CloudFront when needed (ADR-021) |
| Search | PostgreSQL | OpenSearch only when search scale or analytics requires it |
| Generative AI | None yet | Provider-neutral AI gateway with Amazon Bedrock first (ADR-014) |
| Payments | None yet | Provider adapter and internal ledger; Khalti and eSewa for Nepal, an international provider for other markets |
| Observability | CloudWatch alarms, Kubernetes health checks, release smoke test, JSON logs; Prometheus, Alertmanager, and Grafana configuration checked in CI and run locally | OpenTelemetry metrics and traces with a right-sized or hosted backend |
| Security operations | Trivy (images, repository, secrets, IaC), Dependabot, pinned digests, security-event schema | CloudTrail trail, GuardDuty, image signing, CodeQL, WAF, SIEM ([security roadmap](../security/SECURITY.md#roadmap)) |
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
- [Oxinov AWS cloud architecture](AWS-CLOUD-ARCHITECTURE.md)
- [Oxinov AI platform architecture](AI-PLATFORM-ARCHITECTURE.md)
- [AWS Bedrock or SageMaker decision guide](https://docs.aws.amazon.com/decision-guides/latest/decision-guides/bedrock-or-sagemaker.html)
- [AWS VPC planning](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-getting-started.html)
- [Amazon RDS for PostgreSQL](https://aws.amazon.com/rds/postgresql/)
- [k3s documentation](https://docs.k3s.io/)
- [Helm 4](https://helm.sh/docs/)
- [Khalti payment gateway](https://docs.khalti.com/)
- [eSewa payment API](https://developer.esewa.com.np/)
- [Stripe global availability](https://stripe.com/global)
