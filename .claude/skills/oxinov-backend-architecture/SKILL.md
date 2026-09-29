---
name: oxinov-backend-architecture
description: Design Oxinov backends as trusted business systems before coding - domain modeling, module and service boundaries, layering in the NestJS APIs, contract-first APIs, validation, authentication and authorization, multi-tenancy, database integrity, transactions, concurrency and idempotency, error model, configuration, logging and observability, reliability (timeouts, retries, graceful shutdown), caching, jobs and events, integrations, migrations, scaling, and a review checklist. Use when planning a backend feature, module, service, or integration, or before any non-trivial or security-sensitive API change.
---

# Oxinov backend software architecture

Act as a senior backend architect for Oxinov Pvt. Ltd. The backend is not "route → controller → database": it is the trusted system that enforces business rules, authorization, data integrity, consistency, and reliable communication between people, services, databases, and providers.

Related skills: oxinov-backend (build steps and checks), oxinov-mvc, oxinov-api-design, oxinov-database, oxinov-multi-tenancy, oxinov-access-control, oxinov-secure-input-output, oxinov-events-and-jobs, oxinov-payments, oxinov-observability, oxinov-scaling, oxinov-architecture-decision. Rules: [architecture](../../../docs/14-ai-knowledge/architecture-rules.md), [API](../../../docs/14-ai-knowledge/api-rules.md), [database](../../../docs/14-ai-knowledge/database-rules.md), [security](../../../docs/14-ai-knowledge/security-rules.md). Standard: [secure development standard](../../../docs/09-security/secure-development-standard.md).

Keep analysis proportional: a small change follows the neighbouring feature. An architectural, data, money, or security-sensitive change gets the decision process in section 1 written down first.

When goals conflict, prioritize: **correctness, security, data integrity, simplicity, maintainability, reliability, observability, performance, scalability, optimization.**

## 1. Decision process (before a major feature)

1. What business problem, and which requirement ID?
2. Which product and module own the behavior (Edu, platform, a future product)?
3. Who may do it (role, entitlement, trust level, policy)?
4. What data is needed, and how sensitive is it?
5. Which invariants must always hold?
6. What API contract?
7. What must be validated?
8. Which database constraints protect the invariants?
9. Does it need a transaction?
10. Can concurrent requests break it?
11. Must it be idempotent?
12. What happens when a dependency fails or is slow?
13. Which errors can occur, with which codes?
14. What is logged, emitted as a security event, and measured?
15. Which tests prove it, including denials?
16. Is it backward compatible for the running web app, mobile clients, and the previous image?
17. How is it deployed and rolled back safely?

Order of reasoning: requirement → domain → architecture → API contract → validation → business logic → authorization → persistence → transactions → reliability → observability → testing → deployment.

## 2. Domain modeling

Identify actors, entities, value objects, relationships, rules, permissions, state transitions, invariants, external systems, and events before routes or tables. Example from Edu: `Tenant (workspace) → Membership (role) → Course → CourseVersion → Lesson → Note / Submission / Attempt`, with rules such as "only members see a workspace", "only instructors and above author", "authors edit a separate draft version while learners keep the published one, and approval swaps them in one transaction" (FR-COURSE-201/203), "a note belongs to one learner" (FR-PLAYER-403). Record rules in the FRD with IDs (oxinov-requirements) and keep them in services, never scattered in controllers.

## 3. Boundaries

| Question | Oxinov answer |
| --- | --- |
| Which service owns it? | One product API per product (`backend/products/<slug>-api`); cross-product capabilities (account, entitlements, policies, catalogue) in `backend/platform-api` |
| What belongs to the database? | Integrity (keys, unique and check constraints) and tenant isolation (row-level security) |
| What belongs to the frontend? | Presentation and convenience checks only; never authorization |
| What belongs to infrastructure? | TLS, ingress, network policy, secrets, backups (oxinov-kubernetes, oxinov-terraform) |
| Another product's data? | Only through its API or events, never its database or code (ADR-008, ADR-019) |

Start as a **modular monolith per product**: one API with strong internal feature boundaries. Extract a service only for a measured scaling, security, reliability, data, or ownership need, with an ADR; each service costs memory on a 4 GiB node and money under NFR-18.

## 4. Layering and structure (the Oxinov NestJS shape)

```text
HTTP → server-kit middleware (request ID, headers, rate limit)
     → AuthGuard (global) → TenantGuard / RequireRole → ValidationPipe
     → <feature>.controller.ts   parse, call one service method, shape { data }
     → <feature>.service.ts      use case: rules, permissions, entitlements, transaction
     → DatabaseContext + Prisma  persistence under tenant context and row-level security
     → PostgreSQL
```

```text
backend/products/<slug>-api/src/
  main.ts, app.factory.ts, app.module.ts   bootstrap, global pipes, shutdown hooks, one module
  config/        typed configuration, validated at startup
  common/        error codes (errors.ts), request types
  auth/          identity resolution
  tenancy/       TenantGuard, roles
  database/      PrismaService, DatabaseContext
  observability/ domain metrics
  <feature>/     <feature>.controller.ts, .service.ts, .dto.ts, pure rules (grading.ts) and *.spec.ts
test/            *.e2e-spec.ts integration tests
```

Oxinov deliberately has **no separate repository layer**: services use Prisma through `DatabaseContext`, because a repository that only mirrors Prisma adds no value. Pure business rules that need testing go into plain functions beside the service (`exams/grading.ts`, `media/media-rules.ts`). Introduce an interface only where it earns its place: external providers (`PaymentProvider`), or a second implementation. Dependency injection uses Nest constructors; keep dependencies explicit.

Controllers stay thin (no SQL, no business decisions, no transaction orchestration). Middleware handles only cross-cutting concerns; business authorization is explicit in guards and services.

## 5. API contracts

- Routes under `/v1/...`; tenant data under `/v1/tenants/:tenantId/...`. Methods and status codes: `GET` 200, `POST` 201, `PATCH` 200, `DELETE` 204; 400 validation, 401, 403, 404 (also for other tenants' objects), 409 conflict, 429 rate limited, 500, 503 when not ready.
- Oxinov uses **400 `VALIDATION_FAILED`** for invalid input, not 422; changing that is a breaking contract change.
- Input and output DTO classes; never return a Prisma row directly (no internal columns, no other users' emails).
- Error envelope: `{ "error": { "code", "message", "requestId", "details"? } }` with stable codes from `src/common/errors.ts` and [API errors](../../../docs/06-api/api-errors.md).
- Lists are paginated with a stable order; the catalogue uses cursor pagination (`limit + 1` to detect the next page). Never return unbounded collections.
- OpenAPI through `@nestjs/swagger`, regenerated with every contract change. REST is the default; GraphQL or gRPC needs an ADR.
- Evolve additively: add fields and routes, move every caller (web, mobile, jobs), then remove old ones in a later release.

## 6. Validation, authentication, authorization

- Validate body, params, query, relevant headers, uploads, and provider callbacks (types, length, range, enums, formats, cross-field rules). Validation never replaces authorization. (oxinov-secure-input-output)
- Authentication is the Oxinov account: Keycloak OIDC, JWT verified by `server-kit` (issuer, audience, RS256 or ES256, expiry), short-lived access tokens. **Oxinov stores no customer passwords**; there is no password reset to build. (oxinov-authentication-sessions)
- Authorization flow for every protected operation: authenticated → member of the tenant → role or permission → the resource belongs to the tenant (and to the user when private) → entitlement and trust level → allow. Enforced in the API and again by row-level security. (oxinov-access-control, oxinov-multi-tenancy)

## 7. Data integrity, transactions, concurrency, idempotency

- The database protects invariants: primary and foreign keys, `UNIQUE`, `CHECK`, `NOT NULL`, and indexes for the access patterns; ORM models are not the design. (oxinov-database)
- Multi-step changes run in one `DatabaseContext` transaction; keep transactions short and never call external services inside them.
- Never assume sequential requests. Prefer unique constraints and handle Prisma `P2002` over check-then-insert; change state with a conditional update on the expected status and check the count (optimistic concurrency); use row locks only with a reason. No distributed locks without an ADR.
- Retried operations (payments, enrollment, submissions, provider callbacks, jobs) are idempotent: a natural unique key or an idempotency key returns the original result instead of acting twice. A client-supplied `Idempotency-Key` header is not implemented yet; add it to the contract when a client needs it.
- Time in UTC (`timestamptz`), rendered in the reader's time zone; money as integer minor units plus a currency code (`amountMinor`, `currency`).

## 8. Errors and configuration

- Throw `Errors.*` (a `DomainError` with code and status); the global `HttpExceptionFilter` maps everything to the envelope, logs 5xx details server-side, and hides stacks, SQL, and internals. No try/catch in controllers just to reshape errors.
- Configuration comes from the environment, typed and validated at startup (`server-kit` `loadServiceConfig`, `src/config/app-config.ts`); unsafe or missing values stop the process. Secrets come from Parameter Store through the `oxinov-app` Secret (oxinov-secrets-and-crypto). Tokens are verified with the identity provider's public keys, so APIs hold no signing secret.

## 9. Observability and health

- Structured JSON logs through the `server-kit` logger with request ID, service, and version; redaction of tokens, secrets, cookies, passwords; no personal data unless needed.
- `server-kit` `HttpMetrics` (prom-client) exposes `oxinov_http_*` on the private network; production does not scrape them yet (OpenTelemetry arrives with ADR-019 step 5). Add domain counters with bounded labels.
- Security events through the schema; audit records for accountable actions (roles, ownership, payments, policies), append-only.
- `/health/live` answers "is the process alive" without dependencies; `/health/ready` checks PostgreSQL. (oxinov-observability)

## 10. Reliability

- Every network call has a timeout (payments use `AbortSignal.timeout`). Retry only transient failures (network errors, 503, some 429) with backoff and jitter and a small limit; never retry validation, authentication, authorization, or business errors; never retry forever.
- External providers sit behind an adapter interface (`PaymentProvider` with Khalti and eSewa adapters), so business code never calls an SDK directly and tests inject fakes.
- Graceful shutdown: `app.enableShutdownHooks()` and Prisma disconnect on SIGTERM; Kubernetes probes and rolling updates do the rest.
- Assume containers restart, deployments partly fail, and messages arrive twice.

## 11. Caching, jobs, events

- **No cache, queue, or broker runs today** (ADR-021). Before any cache: define key, TTL, invalidation, staleness tolerance, and owner; never cache per-user or tenant data under a shared key; a cache never holds records of truth.
- Long work (bulk email, reports, media processing, imports, large exports) goes to a worker consuming SQS when the first need is measured; jobs are idempotent, observable, retried with a dead-letter queue.
- Events are facts in the past tense (`certificate.issued`), written to a transactional **outbox** in the same transaction, published to SNS with an SQS queue per consumer; consumers are idempotent and tolerate reordering. Design for eventual consistency and say so in the UI. (oxinov-events-and-jobs)

## 12. Security

Protect against SQL and NoSQL injection, command injection (never run a shell with input), XSS in returned content, CSRF, SSRF, path traversal, insecure deserialization (parse JSON only, validate after parsing), broken access control, authentication bypass, mass assignment, data exposure, unsafe uploads, and vulnerable dependencies. Least privilege everywhere: request database roles without bypass, no superuser from the app, scoped pod network access, OIDC roles for CI. Internal traffic is not trusted: every API verifies the token, and network policies deny by default. Details: the [secure development standard](../../../docs/09-security/secure-development-standard.md).

## 13. Migrations and deployment

Migrations are new timestamped files, reviewed, immutable once merged, forward-only, in expand → migrate → contract steps: add the column, deploy code that handles both, backfill, switch reads and writes, remove later. They run as the Helm pre-upgrade hook before new pods, so the previous image must keep working. CI runs tests, the drift check, Trivy, and image builds; releases roll back automatically on failure. (oxinov-database, oxinov-cicd)

## 14. Scaling and distribution

APIs are stateless; state lives in PostgreSQL and S3, and sessions live in the web app's sealed cookie, so replicas can be added. Scale by measured bottleneck through the ordered steps in oxinov-scaling. When the system becomes distributed, design for partial failure, duplicates, reordering, clock differences, and compensating actions instead of distributed transactions; choose the consistency each operation needs (payments strong, dashboards eventual). An API gateway (`backend/gateway`, planned) would route and limit, never hold business logic.

## 15. Existing code first

Before changing an API, inspect: module layout, `app.module.ts`, guards, DTO conventions, error codes, `DatabaseContext` use, schema and migrations, tests in `test/`, configuration, logging, metrics, and the chart entry. Follow the existing architecture unless a documented reason says otherwise; do not rewrite working code or add a framework the stack already covers.

## 16. Review checklist

- **Architecture:** right product and module; thin controller; rules in the service or pure functions; explicit dependencies.
- **API:** correct methods and codes; DTOs in and out; stable contract; pagination; OpenAPI updated.
- **Security:** authentication and authorization enforced; tenant and ownership checks; input validated; no mass assignment; secrets protected; nothing sensitive in responses or logs.
- **Database:** constraints and indexes; row-level security for tenant tables; transactions correct; new migration, backward compatible; no drift.
- **Reliability:** timeouts; safe retries; idempotency; concurrency handled; graceful failure.
- **Operations:** structured logs with request IDs; metrics; security and audit events; health checks.
- **Quality:** unit tests for rules; integration tests for allowed and denied paths and concurrency; FR IDs cited; docs, current state, and changelog updated.
