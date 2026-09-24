# Oxinov company platform technology stack

## Selected baseline

| Area | Technology | Decision |
| --- | --- | --- |
| Monorepo | pnpm workspaces and Turborepo | Keep TypeScript applications and shared packages in one reviewable repository while preserving deployable boundaries. |
| Public website and portals | Next.js App Router, React, TypeScript, Tailwind CSS, and shared accessible components | Support search-friendly public content and authenticated product portals with one frontend skill set. |
| Product mobile apps | React Native with Expo and TypeScript | Build Android and iOS clients against the same versioned APIs. Create a mobile app per product only when the product needs one. |
| Backend | NestJS with strict TypeScript | Implement domain modules, REST/OpenAPI APIs, WebSockets, workers, validation, and provider adapters. |
| API style | REST and OpenAPI first | Keep public contracts explicit, generate clients, and avoid GraphQL until a measured client need exists. |
| Identity | OIDC contract with Keycloak as the default implementation | Provide company-wide SSO, MFA, organizations, identity brokering, and separate application clients. A managed OIDC provider is allowed through an ADR. |
| Transaction data | PostgreSQL and Prisma | Use transactional consistency, migrations, JSON where justified, full-text search initially, and row-level security for multi-tenant tables. |
| Cache queues and realtime fanout | Redis with BullMQ | Store only rebuildable or retryable state; never make Redis the source of truth. |
| Events | Transactional outbox first; NATS JetStream when justified | Avoid dual-write loss and premature event-platform operations. Consumers are idempotent and contracts are versioned. |
| Files | S3-compatible object storage; MinIO locally | Store uploads, documents, media derivatives, and exports outside PostgreSQL with private access. |
| Search | PostgreSQL search first; OpenSearch when search scale or analytics requires it | Avoid operating a second search store before product needs justify it. |
| Generative AI | Provider-neutral AI gateway with Amazon Bedrock first, model aliases, Guardrails, prompt versions, structured outputs, RAG, evaluation, budgets, and human approval | Centralize tenant authorization, data policy, safety, cost, audit, and shutdown. Keep model IDs out of domain code and prevent direct database, shell, secret, payment, publishing, or account access. |
| Predictive and edge ML | Amazon SageMaker AI when custom training is justified; AWS IoT Greengrass for approved edge inference | Use for vision, anomaly detection, forecasting, predictive maintenance, agriculture, and robotics pilots. Keep deterministic physical safety controls outside language models. |
| Payments | Internal provider adapter and ledger; Khalti and eSewa candidates for Nepal | Separate product rules from providers. Add Stripe only for an eligible operating entity and market. |
| Observability | OpenTelemetry Collector, Prometheus, Alertmanager, Loki, Tempo, and Grafana | Correlate metrics, logs, and traces and keep operational telemetry portable. |
| Security operations | CodeQL, dependency review, Trivy, GuardDuty Runtime Monitoring for ECS Fargate, OpenSearch Security Analytics, and Sigma; Falco optional for later EKS/EC2 | Cover source, supply chain, images, infrastructure, runtime, AWS activity, security events, detections, and incidents. |
| Local delivery | Docker Compose | Give developers and coding agents reproducible dependencies and service profiles. |
| Production delivery | AWS Mumbai, GitHub Actions OIDC, Amazon ECR, ECS Fargate, and Terraform | Build once, promote immutable images, use short-lived deployment credentials, and add EKS only through an approved scaling decision. |
| Production data | Amazon RDS for PostgreSQL, ElastiCache, and private S3 buckets | Use managed high availability, backups, encryption, lifecycle rules, and isolated data subnets. PostgreSQL, Redis, and MinIO remain containerized for local development. |
| Edge and networking | Route 53, CloudFront, AWS WAF, Application Load Balancer, and separate environment VPCs | Keep application and data tiers private and expose only the controlled edge and load-balancing path. |
| Secrets | AWS Secrets Manager, KMS, and workload IAM roles | Keep secrets and long-lived AWS keys outside Git, images, repository variables, prompts, and application logs. |

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
- [Khalti payment gateway](https://docs.khalti.com/)
- [eSewa payment API](https://developer.esewa.com.np/)
- [Stripe global availability](https://stripe.com/global)
