# AI command to build the Oxinov company platform

## How to use this command

Give the command below to the coding agent at the start of the platform-foundation work. The agent must implement one milestone at a time, show the changed files and verification, and stop only at a real approval or external-account dependency. Do not ask the agent to generate all future products in one change.

## Master command

```text
You are building the Oxinov company platform for Oxinov Pvt. Ltd. in the existing repository.

Read these files before changing code:
- README.md
- AGENTS.md
- docs/README.md
- docs/01-company/platform-blueprint.md
- docs/01-company/platform-policies.md
- docs/04-architecture/identity-and-access.md
- docs/01-company/subscription-model.md
- docs/07-design/brand.md and docs/07-design/design-system.md
- docs/04-architecture/platform-architecture.md
- docs/04-architecture/tech-stack.md
- docs/08-engineering/company-project-structure.md
- docs/11-planning/company-roadmap.md
- the product charter in docs/02-products/ for any product touched by the milestone
- all existing Oxinov Edu PRD, FRD, NFR, security, data, API, and DevOps documents relevant to the milestone

Context:
- Oxinov Edu is the first Oxinov product and its current code must remain functional.
- The platform needs one company website, one Oxinov identity, one account portal, shared organizations and product entitlements, and independently owned product planes.
- Use oxinov.com for the company site, app.oxinov.com for the account portal, id.oxinov.com for OIDC identity, api.oxinov.com for the API gateway, and edu.oxinov.com for Oxinov Edu.
- Oxinov HR (`hr.oxinov.com`, ADR-025) is the second product module and combines managed recruitment with the former direct-hiring Jobs scope. Commodity Market and Services Market remain future candidates. Each product gets its own frontend, backend, and database only after its release gate is approved.
- Future AI, engineering, robotics, IoT, media, research, and space products are roadmap items. Do not create empty services for them.
- One Oxinov account works across all products. Customers sign in with Continue with Google or an email one-time code, never a password, and higher-risk actions require trust levels and policy acceptance (ADR-011).

Architecture requirements:
- Preserve separate frontend, backend, database, packages, devops, monitoring, and security areas.
- Use a pnpm workspace and Turborepo for the TypeScript monorepo.
- Use Next.js App Router for company and portal web applications, NestJS for APIs and workers, Expo for product mobile applications, PostgreSQL with Prisma for transactional data, Redis for rebuildable cache/queues/fanout, and private S3-compatible object storage for files.
- Use OpenID Connect with provider-neutral application code; Keycloak is the default implementation.
- Deploy production workloads to AWS Mumbai through Terraform. Use CloudFront/WAF, an Application Load Balancer, ECS Fargate, ECR, RDS PostgreSQL, ElastiCache, private S3, Route 53, Secrets Manager/KMS, separate environment VPCs, and short-lived GitHub Actions OIDC credentials. Keep EKS as a later approved option.
- Start with modular applications and a transactional outbox. Do not create premature microservices or introduce NATS, Kafka, OpenSearch application search, or a separate analytics warehouse without an approved need.
- Each product owns its data. No service reads another product database directly.
- Use REST/OpenAPI and generated clients. Version API and event contracts.
- Use payment adapters and an internal ledger. For Nepal, do not assume Stripe eligibility; keep Khalti and eSewa integrations server-verified and idempotent.
- Instrument with OpenTelemetry. Keep Prometheus, Alertmanager, Grafana, Loki, and Tempo operational telemetry separate from the SIEM and SOC pipeline.
- Use the approved Oxinov logo files in packages/design-system/assets/brand/ and the cyberpunk design tokens in docs/07-design/brand.md; never hard-code colors or redraw the logo. Dark is the default theme and the light Daylight theme is required. Meet WCAG 2.2 AA and honor reduced motion.
- Use strict TypeScript, SOLID where useful, KISS, DRY for stable shared rules, YAGNI, dependency inversion at provider boundaries, least privilege, secure defaults, accessibility, internationalization, and privacy by design.
- AI-generated changes can create drafts through typed authorized actions. AI never receives direct production SQL, shell, secrets, payment, publishing, role-change, deletion, or cross-tenant privileges.

Delivery rules:
1. State the selected roadmap milestone and inspect the current repository before editing.
2. Write or update the requirement, acceptance criteria, architecture decision, API contract, and data migration before or with the implementation.
3. Make the smallest complete vertical slice. Preserve backward compatibility or provide a tested migration.
4. Add meaningful domain, authorization, tenant-isolation, database, contract, and critical-journey tests as applicable.
5. Update Docker, CI, observability, security events, documentation, and rollback instructions for the slice.
6. Run repository validation, type checking, linting, tests, builds, migration checks, security scanning, and Docker health checks that are available.
7. Report what changed, why, verification evidence, unresolved decisions, and the next milestone. Do not claim an application or deployment works unless it was executed and verified.

Implement only this milestone now:
[REPLACE THIS LINE WITH ONE MILESTONE FROM THE ROADMAP]
```

## First command to run

```text
Use the Oxinov company platform master command. Implement Phase 1 foundation slice: scaffold frontend/company-web as the public oxinov.com application with packages/design-system (cyberpunk tokens from docs/07-design/brand.md, dark default and Daylight theme, self-hosted Orbitron, Rajdhani, Inter, Noto Sans Devanagari, and JetBrains Mono, and the approved logo SVGs), the Full effect level on hero sections, accessible responsive navigation, company and product landing pages, one division page for each of the ten strategic pillars listed in docs/01-company/platform-blueprint.md (education, ai, engineering, services, robotics, studio, agritech, space, research, production), placeholder routes for careers, contact, privacy, terms, and security contact, company identity (Oxinov Pvt. Ltd., registered in Lalitpur, Nepal), health/readiness endpoints, Docker target, CI checks, and basic OpenTelemetry instrumentation. Content must identify Oxinov Edu as the first product, show unified Oxinov HR, Oxinov Commodity Market, and Oxinov Services Market as coming soon, and label all unlaunched sectors as future initiatives. Include a pricing page placeholder at /pricing and legal routes under /legal. Do not move the current Edu applications or rename their technical identifiers in this milestone. Add tests for navigation, metadata, accessibility-critical markup, and health endpoints, then update the relevant documentation and validation script.
```

## Second command after Phase 1 passes

```text
Use the Oxinov company platform master command. Implement the first Phase 2 vertical slice: platform identity and organizations. Add frontend/platform-web, backend/platform-api, database/platform, and shared auth/contracts/config packages. Support sign-in at id.oxinov.com with Continue with Google and email one-time codes (no customer passwords), a first-sign-in welcome screen that records Terms and Privacy acceptance, single sign-on across platform-web and the Edu web client, automatic member entitlements for launched products, trust levels T0-T2 with SMS phone verification behind a provider adapter, policy-version and acceptance records, a user profile, organization creation, invitations, memberships, role checks, product catalogue entries, and read-only product entitlements. Add two-organization isolation tests, audit and security events, OpenAPI contracts, Prisma migrations, Docker targets, metrics, traces, dashboards, and rollback instructions. Use local Keycloak configuration for development but keep application authentication OIDC-provider-neutral. Do not integrate payments, KYC review (T3/T4), or move LMS code in this milestone.
```
