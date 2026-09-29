# 14 · AI knowledge

The company knowledge that coding assistants (Claude, Codex, Copilot, and others) load before they work in this repository: short rule sets by area, and step-by-step skills for each kind of task. People can use them too, as checklists.

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

## How it fits together

| Layer | What it is | Where |
| --- | --- | --- |
| Binding rules | How everyone works here; wins over everything in this folder | [AGENTS.md](../../AGENTS.md) |
| Rule sets | The rules for one area, as short must and never lists, each linked to its source | This folder (table below) |
| Skills | Step-by-step procedures for one kind of task, with the exact commands and checks | `.claude/skills/<skill>/SKILL.md` (table below) |
| Source documents | The full reasoning, specifications, and decisions | The numbered `docs/` folders the rules link to |

Claude Code loads the skills automatically from `.claude/skills/`. Other assistants read the matching `SKILL.md` before they start, as [AGENTS.md](../../AGENTS.md) section 2 says. When a rule set or skill disagrees with AGENTS.md, a requirement, or an ADR, those win; fix the rule set or skill in the same change.

## Rule sets

| Rules | Covers |
| --- | --- |
| [Architecture rules](architecture-rules.md) | Layers, product planes, boundaries, design principles, decisions |
| [Coding rules](coding-rules.md) | TypeScript, structure, naming, dependencies, code quality |
| [API rules](api-rules.md) | Routes, validation, authorization, errors, OpenAPI, versioning |
| [Database rules](database-rules.md) | Ownership, tenancy, row-level security, migrations, personal data, recovery |
| [Frontend rules](frontend-rules.md) | Next.js, tokens and brand, accessibility, performance, English only |
| [Security rules](security-rules.md) | Secrets, identity, authorization, security events, supply chain |
| [DevOps rules](devops-rules.md) | Delivery, Terraform, Kubernetes, the server, cost |
| [Documentation rules](documentation-rules.md) | Where documents go, how to write them, and how to keep them true |
| [AI feature rules](ai-rules.md) | How AI features are built and governed |

## Skills

| Skill | Use it when you |
| --- | --- |
| [oxinov-backend-architecture](../../.claude/skills/oxinov-backend-architecture/SKILL.md) | Plan a backend feature, module, service, or integration: domain, boundaries, contract, integrity, concurrency, reliability, and review checklist |
| [oxinov-backend](../../.claude/skills/oxinov-backend/SKILL.md) | Build or change a NestJS API endpoint, service, or module |
| [oxinov-mvc](../../.claude/skills/oxinov-mvc/SKILL.md) | Decide which layer a piece of code belongs in (controller, service, data, view) |
| [oxinov-api-design](../../.claude/skills/oxinov-api-design/SKILL.md) | Design or change an API contract, error code, or OpenAPI description |
| [oxinov-validation](../../.claude/skills/oxinov-validation/SKILL.md) | Validate input, configuration, or the repository itself |
| [oxinov-database-architecture](../../.claude/skills/oxinov-database-architecture/SKILL.md) | Design tables, relationships, indexes, queries, concurrency, migrations, retention, and recovery before writing SQL |
| [oxinov-rds](../../.claude/skills/oxinov-rds/SKILL.md) | Plan or carry out the move to Amazon RDS for PostgreSQL: triggers, Multi-AZ, backups and PITR, connections, cutover runbook (not in use today) |
| [oxinov-database](../../.claude/skills/oxinov-database/SKILL.md) | Change a Prisma schema, write a migration, or change row-level security |
| [oxinov-frontend-architecture](../../.claude/skills/oxinov-frontend-architecture/SKILL.md) | Plan a new screen, flow, feature, or web app: UX decisions, routes, state, API access, UI states, and design system |
| [oxinov-frontend](../../.claude/skills/oxinov-frontend/SKILL.md) | Build or change a page, component, or server action in a Next.js app |
| [oxinov-branding](../../.claude/skills/oxinov-branding/SKILL.md) | Name a product, write public copy, or use the logo, colors, and tokens |
| [oxinov-testing](../../.claude/skills/oxinov-testing/SKILL.md) | Write or run unit, integration, policy, or site tests |
| [oxinov-security](../../.claude/skills/oxinov-security/SKILL.md) | Start any security work: principles, threat check, and which security skill to use |
| [oxinov-keycloak](../../.claude/skills/oxinov-keycloak/SKILL.md) | Change sign-in, the realm script, Keycloak clients, token lifetimes, or identity infrastructure |
| [oxinov-authentication-sessions](../../.claude/skills/oxinov-authentication-sessions/SKILL.md) | Touch JWT verification, OIDC sign-in, sessions, cookies, CSRF, or redirects |
| [oxinov-access-control](../../.claude/skills/oxinov-access-control/SKILL.md) | Decide who may see or change something: guards, roles, RLS, IDOR, mass assignment, race conditions |
| [oxinov-secure-input-output](../../.claude/skills/oxinov-secure-input-output/SKILL.md) | Accept input, render user content, build queries, fetch URLs, store files, or return errors |
| [oxinov-secrets-and-crypto](../../.claude/skills/oxinov-secrets-and-crypto/SKILL.md) | Add a secret, key, signature check, token, or anything encrypted |
| [oxinov-security-operations](../../.claude/skills/oxinov-security-operations/SKILL.md) | Add audit or security logging, rate limits, configuration, dependencies, or backups |
| [oxinov-version-control](../../.claude/skills/oxinov-version-control/SKILL.md) | Branch, commit, or push, especially in a shared checkout |
| [oxinov-devops-architecture](../../.claude/skills/oxinov-devops-architecture/SKILL.md) | Plan or review any infrastructure, pipeline, deployment, or operations change: tool ownership, today's production against the reference architecture, safety rules |
| [oxinov-docker](../../.claude/skills/oxinov-docker/SKILL.md) | Change the Dockerfile, an image target, or the local Compose stack |
| [oxinov-kubernetes](../../.claude/skills/oxinov-kubernetes/SKILL.md) | Change the Helm chart, a workload, probes, resources, or network policy |
| [oxinov-cicd](../../.claude/skills/oxinov-cicd/SKILL.md) | Change a GitHub Actions workflow, a delivery script, or the release plan |
| [oxinov-terraform](../../.claude/skills/oxinov-terraform/SKILL.md) | Change any AWS resource through Terraform |
| [oxinov-aws](../../.claude/skills/oxinov-aws/SKILL.md) | Use or reason about an AWS service (EC2, S3, SES, ECR, Systems Manager, CloudFront) |
| [oxinov-ansible](../../.claude/skills/oxinov-ansible/SKILL.md) | Are asked for host configuration management with Ansible |
| [oxinov-server](../../.claude/skills/oxinov-server/SKILL.md) | Operate the production node: status, logs, deploy, rollback, backups, incidents |
| [oxinov-new-service](../../.claude/skills/oxinov-new-service/SKILL.md) | Add a new API, web app, or worker to a product |
| [oxinov-documentation](../../.claude/skills/oxinov-documentation/SKILL.md) | Write, move, or review a document under `docs/` |
| [oxinov-requirements](../../.claude/skills/oxinov-requirements/SKILL.md) | Add or change a requirement in an FRD or the NFR |
| [oxinov-research](../../.claude/skills/oxinov-research/SKILL.md) | Run user research, an experiment, or a technical investigation |
| [oxinov-seo](../../.claude/skills/oxinov-seo/SKILL.md) | Add or change a public page on `oxinov.com` |
| [oxinov-new-product](../../.claude/skills/oxinov-new-product/SKILL.md) | Take a new product, module, or offering from idea through the release gate to its first release |
| [oxinov-platform-integration](../../.claude/skills/oxinov-platform-integration/SKILL.md) | Connect a product to the one Oxinov account, entitlements, the app launcher, and its sign-in client |
| [oxinov-multi-tenancy](../../.claude/skills/oxinov-multi-tenancy/SKILL.md) | Build anything that belongs to a school, company, or workspace |
| [oxinov-mobile](../../.claude/skills/oxinov-mobile/SKILL.md) | Plan or build an Android or iOS app |
| [oxinov-shared-package](../../.claude/skills/oxinov-shared-package/SKILL.md) | Extract code into `packages/` or change a shared library |
| [oxinov-events-and-jobs](../../.claude/skills/oxinov-events-and-jobs/SKILL.md) | Need background work, schedules, retries, or data from another product |
| [oxinov-payments](../../.claude/skills/oxinov-payments/SKILL.md) | Touch money: checkout, prices, providers, refunds, or plans |
| [oxinov-observability](../../.claude/skills/oxinov-observability/SKILL.md) | Add logs, metrics, health checks, alerts, or security events |
| [oxinov-scaling](../../.claude/skills/oxinov-scaling/SKILL.md) | Something is slow or full, or a new product or heavy feature needs capacity |
| [oxinov-accessibility](../../.claude/skills/oxinov-accessibility/SKILL.md) | Build or review any page, component, email, or mobile screen |
| [oxinov-ai-feature](../../.claude/skills/oxinov-ai-feature/SKILL.md) | Add a model call, copilot, chatbot, or other AI capability to a product |
| [oxinov-architecture-decision](../../.claude/skills/oxinov-architecture-decision/SKILL.md) | Change the stack or architecture, or reverse an earlier decision |
| [oxinov-project-delivery](../../.claude/skills/oxinov-project-delivery/SKILL.md) | Plan and deliver a project or milestone, or report progress |
| [oxinov-code-review](../../.claude/skills/oxinov-code-review/SKILL.md) | Review a change, a pull request, or a helper's work |

## From idea to a scaled product

Use the skills in this order when the company grows. Each step names what the owner must approve.

| Stage | What happens | Skills | Owner approves |
| --- | --- | --- | --- |
| 1. Idea | Classify it: product, module, platform capability, service offering, hardware, or research | oxinov-new-product, oxinov-research | - |
| 2. Evidence | User research and experiments | oxinov-research | Research owner and scope |
| 3. Definition | Product record, proposed FRD with its own ID block | oxinov-new-product, oxinov-requirements, oxinov-documentation | - |
| 4. Release gate | Owner, evidence, journeys, budget, data and regulatory review, architecture boundary | oxinov-new-product, oxinov-architecture-decision | The gate |
| 5. Platform connection | Sign-in client, token audience, catalogue row, entitlements, accent token | oxinov-platform-integration, oxinov-security | Realm change on push |
| 6. Product plane | Database with tenancy, API, web app, later mobile app | oxinov-new-service, oxinov-database, oxinov-multi-tenancy, oxinov-backend, oxinov-frontend, oxinov-mobile | Each new service's memory and cost |
| 7. Money | Checkout, plans, entitlements after payment | oxinov-payments | Providers, prices, switching payments on |
| 8. Delivery | Images, chart, pipeline, infrastructure | oxinov-docker, oxinov-kubernetes, oxinov-cicd, oxinov-terraform | Terraform apply; push |
| 9. Operation | Health, logs, alarms, incidents, backups | oxinov-observability, oxinov-server, oxinov-aws | Restores and deletions |
| 10. Growth | Events between products, workers, bigger node, RDS, EKS, isolation tiers | oxinov-events-and-jobs, oxinov-scaling, oxinov-architecture-decision | Every scale-out step and its cost |

Every stage uses oxinov-project-delivery to plan and oxinov-code-review before work is accepted.

## Which skills each part of the company uses

| Part | Folders | Skills |
| --- | --- | --- |
| Company website (`oxinov.com`) | `frontend/company-web` | oxinov-frontend-architecture, oxinov-frontend, oxinov-seo, oxinov-branding, oxinov-accessibility, oxinov-testing |
| Account portal (`app.oxinov.com`) | `frontend/platform-web` | oxinov-frontend-architecture, oxinov-frontend, oxinov-authentication-sessions, oxinov-secure-input-output, oxinov-platform-integration, oxinov-branding, oxinov-accessibility, oxinov-security |
| Platform API | `backend/platform-api`, `database/platform` | oxinov-backend-architecture, oxinov-database-architecture, oxinov-backend, oxinov-access-control, oxinov-secure-input-output, oxinov-platform-integration, oxinov-mvc, oxinov-api-design, oxinov-database, oxinov-payments, oxinov-security, oxinov-testing |
| Identity (`id.oxinov.com`) | `devops/keycloak` | oxinov-keycloak, oxinov-authentication-sessions, oxinov-platform-integration, oxinov-security, oxinov-kubernetes, oxinov-server |
| [Oxinov Edu](../02-products/edu/README.md) web | `frontend/products/edu-web` | oxinov-frontend-architecture, oxinov-frontend, oxinov-authentication-sessions, oxinov-secure-input-output, oxinov-branding, oxinov-accessibility, oxinov-validation, oxinov-testing |
| Oxinov Edu API | `backend/products/edu-api`, `database/products/edu` | oxinov-backend-architecture, oxinov-database-architecture, oxinov-backend, oxinov-access-control, oxinov-secure-input-output, oxinov-mvc, oxinov-multi-tenancy, oxinov-api-design, oxinov-validation, oxinov-database, oxinov-payments, oxinov-security, oxinov-observability, oxinov-testing |
| Oxinov Edu mobile app (planned) | `frontend/mobile/` | oxinov-mobile, oxinov-accessibility |
| Oxinov Edu worker and chat (placeholders) | `backend/products/edu-worker`, `edu-chat` | oxinov-events-and-jobs, oxinov-new-service |
| Future products (HR, Market, Services Market, Studio, JP, Tech) | None until the release gate | oxinov-new-product, oxinov-requirements, oxinov-research; after approval oxinov-platform-integration and oxinov-new-service |
| AI features (planned) | None yet | oxinov-ai-feature, oxinov-security |
| Shared packages | `packages/*` | oxinov-shared-package, oxinov-authentication-sessions, oxinov-secrets-and-crypto, oxinov-backend, oxinov-frontend, oxinov-branding, oxinov-testing |
| Delivery | `.github/workflows`, `devops/scripts`, `devops/docker`, `devops/kubernetes` | oxinov-devops-architecture, oxinov-cicd, oxinov-docker, oxinov-kubernetes, oxinov-version-control |
| Infrastructure | `devops/terraform`, `devops/ansible` | oxinov-devops-architecture, oxinov-rds, oxinov-terraform, oxinov-aws, oxinov-ansible, oxinov-scaling |
| Production operations | The k3s node, `oxctl`, `monitoring/` | oxinov-devops-architecture, oxinov-server, oxinov-observability, oxinov-scaling, oxinov-aws, oxinov-kubernetes |
| Security operations | `security/` | oxinov-security, oxinov-security-operations, oxinov-observability |
| Architecture decisions | `docs/04-architecture/adr/` | oxinov-architecture-decision |
| Documentation and planning | `docs/`, `prompts/` | oxinov-documentation, oxinov-requirements, oxinov-project-delivery |
| Research | `docs/12-research` | oxinov-research |
| Every change | - | oxinov-version-control, oxinov-code-review, oxinov-security (threat check) |

## Keeping this folder true

- A rule set restates rules from AGENTS.md and the linked documents in short form, and links to its source. It never adds a rule of its own; a new rule goes into AGENTS.md or its source document first.
- A skill names only commands, paths, and scripts that exist. When you rename a script, a package, or a folder, search `.claude/skills/` and this folder in the same change.
- Add a skill for a task that assistants repeat and get wrong. Give it a folder `.claude/skills/oxinov-<task>/` with one `SKILL.md`, add it to the tables above, and link it from the README of the code folder it serves.
