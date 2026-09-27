# Technology radar

**Owner:** lead engineer; the founder approves anything with a cost. **Updated:** 2026-09-28 (ADR-024). Reviewed every quarter. What runs today is in [CURRENT-STATE.md](current-state.md); the full stack, today and target, is in the [company stack](tech-stack.md).

Every item is placed in one ring, with its reason, monthly cost, effort, and trigger. Moving an item between rings is a pull request to this file; adopting a new runtime, database, or cloud service also needs an ADR.

| Ring | Meaning |
| --- | --- |
| **Adopt** | Use for all new work now; migrate existing code in the order below |
| **Trial** | Use in one product or package first, with a written result before wider use |
| **Assess** | Study and prototype only; no production use yet |
| **Hold** | Do not start using; existing use is phased out when touched |

## Adopt

| # | Technology | Replaces or adds | Why | Cost | Effort |
| --- | --- | --- | --- | --- | --- |
| A1 | **OpenTelemetry** (Node SDK in `@oxinov/server-kit`; `instrumentation.ts` in the Next.js apps) exporting OTLP to **Grafana Cloud free tier** | Adds production metrics, traces, and logs (ADR-019 step 5; closes NFR-07) | One trace from portal to API to sign-in; no memory used on the 4 GiB node; vendor-neutral, so the backend can move later | US$0 within the free tier (10k metric series, 50 GB logs, 50 GB traces, 14 days); alert at 80% of the free limits | 2–3 days |
| A2 | **Generated API clients:** `openapi-typescript` + `openapi-fetch` from `packages/contracts/openapi.json`, and an **`oasdiff`** breaking-change check in CI | The hand-written client and types in `lms-web/src/lib/edu-api.ts` (about 640 lines) | Web and future mobile clients can never drift from the API; breaking changes fail CI (ADR-019 step 6) | US$0 | 2 days per client |
| A3 | **Playwright** end-to-end tests with **axe-core** accessibility checks | Adds browser tests for the critical journeys | Catches breaks between layers and WCAG 2.2 AA regressions; runs against the Compose stack in CI | US$0 (CI minutes) | 3 days for the first five journeys |
| A4 | **Semgrep** (open-source rules for TypeScript, Node, Next.js, Terraform) in `security.yml` | Fills the CodeQL gap without GitHub Advanced Security | Code-level security findings on every push, gated on HIGH like Trivy | US$0 | 0.5 day |
| A5 | **Signed releases:** CycloneDX SBOM from Trivy and **cosign** keyless signatures (GitHub OIDC) on every image; the node verifies the signature before `helm upgrade` | Adds supply-chain proof (security roadmap #4) | Only images built by our pipeline can run | US$0 | 1 day |
| A6 | **Structured logging with pino** (`nestjs-pino`) in `server-kit`, with redaction paths for tokens, emails, and bodies, and the OpenTelemetry trace ID in every line | The custom `JsonLogger` in `server-kit` | One log format across services, faster, correlated with traces | US$0 | 1 day |
| A7 | **React Compiler** (`reactCompiler: true`) in `edu-web`, `platform-web`, and `company-web` | Manual `useMemo`/`useCallback` | Automatic memoization; fewer re-renders on low-end phones (NFR-01) | US$0 | 0.5 day plus a regression pass |
| A8 | **Node.js 24 LTS** for images, CI, and local development | Node.js 22 (maintenance only until April 2027) | Stay on an active LTS; newer V8 and built-in TypeScript stripping | US$0 | 1 day with a rehearsal |
| A9 | **`pg_stat_statements`** in production PostgreSQL | Adds query-level performance data | Find slow queries before customers do | US$0 | 0.5 day |

## Trial

| # | Technology | Where first | Why | Trigger to adopt |
| --- | --- | --- | --- | --- |
| T1 | **Vitest** (with the SWC plugin for NestJS decorators) | `backend/workers/mail-relay`, then `platform-api` | Native ESM and TypeScript, several times faster than Jest, one runner for API and web tests | The trial package runs faster with equal coverage; then migrate `lms-api` |
| T2 | **Testcontainers** for integration tests | `platform-api` | The same PostgreSQL 18 and S3-compatible images locally and in CI, with no manual setup | Trial passes in CI and on Windows laptops |
| T3 | **Transactional outbox → Amazon SNS/SQS** (ADR-019 step 3) | First cross-product event: Edu certificate issued → Oxinov HR candidate profile (ADR-025) | Products stay independent; costs cents | The event is delivered once, idempotently, with a dead-letter queue |
| T4 | **OpenFeature** with a database-backed provider (ADR-019 step 4) | Paid checkout in Edu (ADR-023) | Deploy every push, release features when ready | Flag toggles work per tenant and plan without a deploy |
| T5 | **Graviton (arm64)** multi-architecture images | All images, at the next server rebuild | About 10–20% cheaper compute ([cost](../10-devops/cost-optimization.md)) | Rehearsed rebuild passes; savings confirmed in Cost Explorer |
| T6 | **Expo (React Native) with Expo Router** | Oxinov Edu learner app (Edu roadmap phase 4) | One TypeScript codebase for Android and iOS against the generated API client | Mobile phase starts |

## Assess

| Technology | Question to answer |
| --- | --- |
| **TypeScript 7 native compiler** (`tsgo`) | Are type checks much faster with our NestJS and Next.js setup, and is the tooling stable? |
| **Fastify adapter for NestJS** | Does an API become CPU-bound under the load test? Only then is the switch worth it. |
| **pgvector** in PostgreSQL | Is it enough for the AI gateway's retrieval (ADR-014), before any separate vector store? |
| **PgBouncer or RDS Proxy** | Does connection count become a limit at scale-out? |
| **Argo CD (GitOps) and Karpenter** | Plan for the EKS move (DevOps roadmap Phase 5), not before |
| **Amazon Bedrock model aliases and Guardrails** | Per the AI roadmap, after the AI Phase 0 gate |

## Hold

| Technology | Why not |
| --- | --- |
| GraphQL | REST with generated clients covers our clients; revisit only for a measured need |
| A microservice per feature, a service mesh | One modular API per product until a measured need (ADR-019 step 8) |
| Kafka, RabbitMQ, NATS | Always-on cost and operations; SNS/SQS costs cents at our scale |
| Redis, Mux, Secrets Manager, managed Prometheus and Grafana | Wait for their triggers (ADR-021) |
| Self-hosted Prometheus, Loki, and Grafana in production on the 4 GiB node | Crowds out the applications; use the hosted free tier (A1) |
| MongoDB or a second transactional database | PostgreSQL is the system of record (ADR-001) |
| Another ORM or query builder next to Prisma | One data-access approach per codebase |
| Next.js Pages Router, runtime CSS-in-JS libraries | App Router and Tailwind tokens only |
| npm or Yarn lockfiles, Bun or Deno as runtimes | One package manager (pnpm) and Node.js LTS |
| Renovate | Dependabot already groups weekly updates; switching adds no value today |
| OpenTofu | Terraform works and state is healthy; revisit only if licensing or features require it |

## Golden path for a new service

Every new service follows the same framework, so any engineer or assistant can work on any of them:

1. **Scaffold:** `bash devops/scripts/oxctl new-service <product> <api|web|worker>` creates the code, Dockerfile stage, `services.yaml` entry, and Helm values (ADR-019).
2. **API:** NestJS with one module per domain (controller, service, DTOs, tests), `@oxinov/server-kit` for hardening, health, metrics, logging, and tracing; class-validator DTOs; generated OpenAPI.
3. **Data:** its own PostgreSQL database and role pair, Prisma migrations, row-level security with a non-bypass request role, `tenant_id` or owner ID on every scoped row (ADR-006).
4. **Web:** Next.js App Router with server components, server actions, `@oxinov/web-auth`, the generated API client, and `@oxinov/design-system` tokens; English only (ADR-020).
5. **Events:** outbox table and SNS/SQS; idempotent consumers (ADR-019).
6. **Tests:** unit and PostgreSQL integration tests (allowed and denied tenant paths), contract check, Playwright journeys.
7. **Delivery:** nothing to add; the service catalog feeds CI, the release planner, and the chart. Every green `main` deploys (NFR-17).

## Order of work

A4 and A9 (half a day each, immediate security and insight), then A1 and A6 together, A2, A3, A5, A7, and A8 last with a rehearsal. Trials start with their named feature. Each finished item updates this file, the [company stack](tech-stack.md), and [CURRENT-STATE.md](current-state.md).
