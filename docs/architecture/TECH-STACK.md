# Technology stack

**Status:** Proposed baseline; record changes in [ADR.md](ADR.md).

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
| PostgreSQL container | PostgreSQL with Prisma migrations and a persistent volume | Canonical records, tenant-scoped full-text search, transactions, and audit history. Production PostgreSQL also runs in Docker with encrypted backups and tested restore procedures. |
| Redis container | Redis with no authoritative business records | Queue coordination, cache, rate limits, and chat fanout. Loss of Redis must not erase course, payment, or result records. |
| Identity | Clerk | Email/password, social sign-in, MFA, and sessions. Keep tenant memberships, roles, and ownership in PostgreSQL. |
| Payments | Stripe Checkout, Billing, and Connect for web; store billing integration where required for mobile | Keep tenant SaaS subscriptions distinct from learner course purchases and instructor payouts. Normalize verified course purchases into one entitlement ledger. |
| Video | Mux Video | Direct upload, adaptive HLS, and signed playback for paid lessons. |
| Files | Private S3-compatible object storage; MinIO container for local development | Attachments, submissions, and certificates; issue time-limited download URLs after tenant and role checks. Do not store video binaries or user uploads in PostgreSQL. |
| Notifications | Transactional email provider, Web Push API, and native push integration | Account email, course announcements, chat and result alerts, and opted-in browser or mobile push. Select the email and native push providers before implementation. |
| AI integration | Provider adapter behind backend-authorized commands | Generate tenant-scoped drafts and proposed actions without giving the model direct database, shell, payment, or publishing privileges. |
| Metrics and dashboards | Prometheus, PostgreSQL/Redis exporters, Alertmanager, and Grafana | Scrape bounded-cardinality operational metrics, evaluate alert rules, route notifications, and display version-controlled dashboards. Keep monitoring endpoints on private networks. |

External embeds cannot provide the same access and progress guarantees as hosted video. Hosted Mux video is the default for paid lessons. If embeds are approved, show their limits in the authoring UI and do not promise protected playback or exact watch-percentage tracking.

Core records include `Tenant`, `TenantConfigVersion`, `TenantDomain`, `TenantMembership`, `TenantPlan`, `UserProfile`, `InstructorApproval`, `Program`, `SkillField`, `Course`, `CourseVersion`, `Section`, `Lesson`, `Recording`, `Enrollment`, `Entitlement`, `Payment`, `Subscription`, `LessonProgress`, `Question`, `ExamBlueprint`, `ExamAttempt`, `ExamResult`, `AssignmentSubmission`, `Certificate`, `DiscussionPost`, `ChatConversation`, `ChatMessage`, `Announcement`, `AIJob`, and `AuditEvent`. All tenant-owned records carry `tenant_id`. Tenant-scoped unique constraints enforce one active enrollment per learner/course, one certificate per learner/course, and one processed purchase event per provider event ID.

Use one shared PostgreSQL instance and tenant-scoped tables with PostgreSQL row-level security as the default. Application code must also check tenant membership before opening a tenant data operation. Set database tenant context for each transaction and verify it cannot leak across pooled connections. Request paths must not use a database role that bypasses row-level security. A dedicated PostgreSQL database for a customer is an optional deployment tier if isolation, residency, or scale requires it; the application API and tenant rules remain the same.

## Implementation references

- [Next.js App Router](https://nextjs.org/docs/app)
- [NestJS modules](https://docs.nestjs.com/modules)
- [Docker Compose startup health checks](https://docs.docker.com/compose/how-tos/startup-order/)
- [Docker Compose production configuration](https://docs.docker.com/compose/how-tos/production/)
- [Expo Android App Bundle submission](https://docs.expo.dev/submit/android/)
- [Stripe webhooks](https://docs.stripe.com/webhooks)
- [Mux secure video playback](https://www.mux.com/docs/guides/secure-video-playback)
- [Prometheus metric naming](https://prometheus.io/docs/practices/naming/)
- [Grafana provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/)
