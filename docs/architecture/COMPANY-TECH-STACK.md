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
| AI | Provider-neutral AI gateway with prompt versions, structured outputs, evaluation, budgets, and human approval | Keep models replaceable and prevent models from directly accessing databases, shells, payments, or publishing actions. Use pgvector only for an approved retrieval requirement. |
| Payments | Internal provider adapter and ledger; Khalti and eSewa candidates for Nepal | Separate product rules from providers. Add Stripe only for an eligible operating entity and market. |
| Observability | OpenTelemetry Collector, Prometheus, Alertmanager, Loki, Tempo, and Grafana | Correlate metrics, logs, and traces and keep operational telemetry portable. |
| Security operations | CodeQL, dependency review, Trivy, Falco, OpenSearch Security Analytics, and Sigma | Cover source, supply chain, images, infrastructure, runtime, security events, detections, and incidents. |
| Local delivery | Docker Compose | Give developers and coding agents reproducible dependencies and service profiles. |
| Production delivery | GitHub Actions, OCI images, Terraform, and a managed container platform or managed Kubernetes | Build once, promote signed images, automate infrastructure, and choose Kubernetes only with an operating plan. |
| Secrets | Cloud secret manager and workload identity | Keep secrets outside Git, images, repository variables, prompts, and application logs. |

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
- [Khalti payment gateway](https://docs.khalti.com/)
- [eSewa payment API](https://developer.esewa.com.np/)
- [Stripe global availability](https://stripe.com/global)
