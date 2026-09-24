# Technology stack

**Scope:** Oxinov Edu product stack. Cross-product choices are defined in the [company platform stack](COMPANY-TECH-STACK.md). **Status:** Proposed baseline; record changes in [ADR.md](ADR.md).

## Recommended implementation stack

Use this concrete starting architecture. PostgreSQL is the mandatory transactional system of record for the LMS. Choose any additional data technology only for a documented need, with a clear owner, backup policy, and tenant-isolation design. Pin exact package and container image versions when implementation begins.

| Layer | Choice | Responsibility |
| --- | --- | --- |
| Frontend container | Next.js App Router, React, TypeScript in its own Docker image | Tenant-aware catalog, authoring, player, dashboards, and server-rendered pages. It calls the backend API and does not connect directly to PostgreSQL. |
| Backend container | NestJS and TypeScript in a separate Docker image | Versioned REST/OpenAPI endpoints, tenant resolution, validation, authorization, business rules, billing webhooks, and mobile APIs. |
| Worker container | TypeScript worker in a separate Docker image | Retryable email, AI generation, media metadata, result, and certificate jobs; idempotent handlers and tenant context. |
| Mobile build | React Native with Expo and TypeScript | Android and iOS apps call the same backend API and follow the same tenant and domain rules. Mobile binaries are built and signed in a mobile build pipeline; they run on devices, not in Docker. |
| Web UI | Tailwind CSS and shadcn/ui | Responsive web layout and accessible controls; mobile uses native React Native components. |
| Chat container | Dedicated Node.js WebSocket gateway | Cross-device conversations and unread state; persist messages in PostgreSQL and use Redis only for delivery fanout. |
| PostgreSQL | PostgreSQL with Prisma migrations; Docker with a persistent volume locally and Amazon RDS for PostgreSQL in AWS | Canonical records, tenant-scoped full-text search, transactions, and audit history. Production uses Multi-AZ where required, encrypted backups, isolated data subnets, and tested restore procedures. |
| Redis container | Redis with no authoritative business records | Queue coordination, cache, rate limits, and chat fanout. Loss of Redis must not erase course, payment, or result records. |
| Identity | Provider-neutral OpenID Connect; Keycloak is the company-platform default | Oxinov single sign-on with Google, Apple, or email one-time codes and no customer passwords (ADR-011), MFA for staff and administrators, and sessions. Keep tenant memberships, roles, and ownership in PostgreSQL. The existing generic JWKS verifier remains compatible with another approved OIDC provider. |
| Payments | Provider adapter and internal ledger; evaluate Khalti and eSewa first for the Nepal entity, and Stripe only for an eligible entity/market; store billing where required for mobile | Keep tenant SaaS subscriptions distinct from learner course purchases and instructor payouts. Verify provider status server-side and normalize purchases into one entitlement ledger. |
| Video | Mux Video | Direct upload, adaptive HLS, and signed playback for paid lessons. |
| Files | Private S3-compatible object storage; MinIO container for local development | Attachments, submissions, and certificates; issue time-limited download URLs after tenant and role checks. Do not store video binaries or user uploads in PostgreSQL. |
| Notifications | Transactional email provider, Web Push API, and native push integration | Account email, course announcements, chat and result alerts, and opted-in browser or mobile push. Select the email and native push providers before implementation. |
| AI integration | Provider adapter behind backend-authorized commands | Generate tenant-scoped drafts and proposed actions without giving the model direct database, shell, payment, or publishing privileges. |
| Metrics and dashboards | Prometheus, PostgreSQL/Redis exporters, Alertmanager, and Grafana | Scrape bounded-cardinality operational metrics, evaluate alert rules, route notifications, and display version-controlled dashboards. Keep monitoring endpoints on private networks. |
| Security engineering and SOC | GitHub CodeQL/dependency review, Trivy, GuardDuty Runtime Monitoring for ECS Fargate, OpenSearch Security Analytics with Sigma, and optional Falco for later EKS/EC2; Wazuh optional for managed endpoints/hosts | Scan code, dependencies, secrets, images, and IaC; collect normalized security events; detect and investigate threats; run incident procedures. Keep security storage and access separate from product analytics and operational metrics. |

External embeds cannot provide the same access and progress guarantees as hosted video. Hosted Mux video is the default for paid lessons. If embeds are approved, show their limits in the authoring UI and do not promise protected playback or exact watch-percentage tracking.

Core records include `Tenant`, `TenantConfigVersion`, `TenantDomain`, `TenantMembership`, `TenantPlan`, `UserProfile`, `InstructorApproval`, `Program`, `SkillField`, `Course`, `CourseVersion`, `Section`, `Lesson`, `Recording`, `Enrollment`, `Entitlement`, `Payment`, `Subscription`, `LessonProgress`, `Question`, `ExamBlueprint`, `ExamAttempt`, `ExamResult`, `AssignmentSubmission`, `Certificate`, `DiscussionPost`, `ChatConversation`, `ChatMessage`, `Announcement`, `AIJob`, and `AuditEvent`. All tenant-owned records carry `tenant_id`. Tenant-scoped unique constraints enforce one active enrollment per learner/course, one certificate per learner/course, and one processed purchase event per provider event ID.

Use one shared PostgreSQL instance and tenant-scoped tables with PostgreSQL row-level security as the default. Application code must also check tenant membership before opening a tenant data operation. Set database tenant context for each transaction and verify it cannot leak across pooled connections. Request paths must not use a database role that bypasses row-level security. A dedicated PostgreSQL database for a customer is an optional deployment tier if isolation, residency, or scale requires it; the application API and tenant rules remain the same.

## Implementation references

- [Next.js App Router](https://nextjs.org/docs/app)
- [NestJS modules](https://docs.nestjs.com/modules)
- [Docker Compose startup health checks](https://docs.docker.com/compose/how-tos/startup-order/)
- [Docker Compose production configuration](https://docs.docker.com/compose/how-tos/production/)
- [Expo Android App Bundle submission](https://docs.expo.dev/submit/android/)
- [Khalti payment gateway](https://docs.khalti.com/)
- [eSewa payment API](https://developer.esewa.com.np/)
- [Stripe global availability](https://stripe.com/global)
- [Mux secure video playback](https://www.mux.com/docs/guides/secure-video-playback)
- [Prometheus metric naming](https://prometheus.io/docs/practices/naming/)
- [Grafana provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/)
- [OpenSearch Security Analytics](https://docs.opensearch.org/latest/security-analytics/)
- [Falco runtime security](https://falco.org/docs/)
- [GuardDuty Runtime Monitoring](https://docs.aws.amazon.com/guardduty/latest/ug/runtime-monitoring.html)
- [Wazuh components](https://documentation.wazuh.com/current/getting-started/components/index.html)
- [GitHub CodeQL](https://docs.github.com/en/code-security/concepts/code-scanning/codeql/codeql-code-scanning)
