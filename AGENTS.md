# Coding agent instructions

These rules apply to every coding assistant (Claude, Copilot, and others) working anywhere in the Oxinov repository. `CLAUDE.md` and `.github/copilot-instructions.md` point here.

## 1. What this repository is

The Oxinov repository holds the company platform of **Oxinov Pvt. Ltd.** and its products, organized as **company website → Oxinov platform → products**:

| Layer | Address | State |
| --- | --- | --- |
| Company website | `oxinov.com` | Not built (Phase 1) |
| Identity, account portal, API gateway | `id.`, `app.`, `api.oxinov.com` | Not built (Phase 2) |
| OxinovLMS | `lms.oxinov.com` | Partial backend in `backend/api`; must stay working |
| Commodity Market, Jobs, Services Market | `market.`, `jobs.`, `services.oxinov.com` | Draft charters only; do not scaffold |

Do not claim that an application, deployment, or integration works unless it was executed and verified.

## 2. Read before you change anything

Start with [docs/README.md](docs/README.md), the documentation map. Then read what matches the task:

| Task | Read first |
| --- | --- |
| Any change | This file, [README.md](README.md), [platform blueprint](docs/company/PLATFORM-BLUEPRINT.md), [requirements standard](docs/requirements/README.md) |
| Platform feature (sign-in, trust, policies, plans, payments, KYC, portal) | [Platform FRD](docs/requirements/PLATFORM-FRD.md), [identity and access](docs/architecture/IDENTITY-AND-ACCESS.md), [policies](docs/company/PLATFORM-POLICIES.md), [subscription model](docs/company/SUBSCRIPTION-MODEL.md) |
| OxinovLMS feature | [LMS FRD](docs/02-FRD.md), [NFR](docs/03-NFR.md), [LMS architecture](docs/architecture/ARCHITECTURE.md), [current code structure](docs/engineering/PROJECT-STRUCTURE.md) |
| Other product | Its charter in [docs/products/](docs/products/README.md); build nothing until its release gate is approved |
| Website or any UI | [brand](docs/design/BRAND.md), [design system](docs/design/DESIGN-SYSTEM.md), [accessibility](docs/design/ACCESSIBILITY.md), [user-centred product standard](docs/research/USER-CENTERED-PRODUCT-STANDARD.md) |
| AI feature | [AI strategy](docs/company/AI-IMPLEMENTATION-STRATEGY.md), [AI architecture](docs/architecture/AI-PLATFORM-ARCHITECTURE.md), [AI governance](docs/security/AI-GOVERNANCE.md), [AI roadmap](docs/planning/AI-IMPLEMENTATION-ROADMAP.md) |
| Data, API, security, or infrastructure | [company architecture](docs/architecture/COMPANY-PLATFORM-ARCHITECTURE.md), [company stack](docs/architecture/COMPANY-TECH-STACK.md), [AWS](docs/architecture/AWS-CLOUD-ARCHITECTURE.md), [ADRs](docs/architecture/ADR.md), [threat model](docs/security/THREAT-MODEL.md) |
| Research or experiment | [R&D operating system](docs/research/README.md) |

Milestone build commands live in [prompts/](prompts/). Implement one milestone at a time.

## 3. Non-negotiable rules

### Requirements and decisions
- FRDs are the source of truth for behavior. Cite the requirement ID (for example `FR-TENANT-1605`) in code comments, tests, and pull requests for every behavior you change.
- Never renumber or reuse a requirement ID. Add new IDs from the area's block in the [requirements standard](docs/requirements/README.md).
- Do not silently change a recorded decision. Changing the stack, cloud, identity, payments, or architecture needs an ADR in the same change.

### Architecture boundaries
- Keep one folder layout: `frontend/`, `backend/`, `database/`, `packages/`, `devops/`, `monitoring/`, `security/`, `docs/`, `prompts/`. Follow the [product plane template](docs/engineering/COMPANY-PROJECT-STRUCTURE.md#product-plane-template): each product has its own frontend, API, and database.
- The platform control plane never contains product business logic. Products call platform and product APIs and events only; no product reads another product's database.
- Frontends and mobile apps call versioned APIs and never connect to a database.
- AWS Mumbai with ECS Fargate, RDS PostgreSQL, ElastiCache, S3, CloudFront/WAF, Route 53, ECR, Secrets Manager/KMS, GitHub Actions OIDC, and Terraform is the production baseline. No EKS without an ADR.
- Start modular; extract a service only for a measured scaling, security, reliability, data, or ownership need (YAGNI).

### Identity, trust, and tenancy
- One Oxinov account works across all products. Customers sign in with Google, Apple (iOS), or an email one-time code, never a password. Products never store login data (ADR-011).
- Enforce trust level (T0–T4) and policy acceptance on the server for every protected action; ignore client-supplied levels.
- PostgreSQL is the system of record. Every tenant- or owner-scoped record carries and verifies `tenant_id` or owner ID, with application checks plus row-level security. Test both allowed and denied cross-tenant paths.

### Money
- Never grant access, orders, or subscriptions from a browser redirect. Verify provider results server-side and process each provider event once.
- Oxinov never holds a customer balance. Escrow is a ledger state; funds sit only with licensed banks or payment providers (ADR-013).

### AI
- Route every AI feature through the backend AI gateway with model aliases, authorization before retrieval and every tool call, versioned prompts and evaluations, and metadata-only telemetry.
- AI may propose drafts through typed, authorized actions. It never gets direct production SQL, shell, secrets, publishing, refund, payout, account or role change, or cross-tenant privileges.

### Content, privacy, and security
- Do not copy official exam questions or imply official certification without rights. Mock results are practice results.
- Keep `.env` files, keys, payment credentials, and personal data out of Git, logs, prompts, fixtures, and images.
- Emit security events only through `security/soc/event-schema.json`; never include secrets, raw bodies, private messages, exam answers, KYC documents, or raw AI prompts.
- Use the design tokens and approved logo files; never hard-code colors or redraw the logo. Meet WCAG 2.2 AA.

### Code quality
- Strict TypeScript, focused modules, validation at every boundary, stable error codes, SOLID where useful, DRY for stable shared rules, KISS.
- Write code that reads like the surrounding code.

## 4. Workflow

1. **Understand:** name the milestone and the requirement IDs involved; inspect the current code before editing.
2. **Specify:** add or update the requirement, acceptance statements, ADR, API contract, and migration before or with the code.
3. **Build:** make the smallest complete vertical slice; keep backward compatibility or add a tested migration.
4. **Verify:** run the checks below and add tests for the allowed and denied paths.
5. **Document:** update docs, `docs/README.md` for new documents, the changelog, and rollback notes.
6. **Report:** what changed and why, requirement IDs, commands run with results, what was not verified, and open decisions.

### Checks to run

| When | Command |
| --- | --- |
| Any documentation change | `python scripts/validate_project.py` |
| `backend/api` change | `pnpm --filter @oxinov/lms-api typecheck`, `pnpm --filter @oxinov/lms-api lint`, `pnpm --filter @oxinov/lms-api test` from the repository root |
| Database or tenant-isolation change | `pnpm lms:migrate`, `pnpm --filter @oxinov/lms-api db:test-policies`, `pnpm --filter @oxinov/lms-api test:integration` from the repository root (needs PostgreSQL) |

CI runs the same checks on every push (`.github/workflows/ci.yml`). A change is not done while any required check fails.

## 5. Definition of done

- [ ] Requirement IDs cited; FRD status updated
- [ ] Allowed and denied paths tested, including cross-tenant and trust-level denials
- [ ] Type check, lint, tests, and validation pass locally or in CI
- [ ] ADR, OpenAPI, migration, and docs updated where behavior changed
- [ ] Security events and metrics added for security-relevant or operational behavior
- [ ] No secrets, personal data, or generated files committed
- [ ] Unverified parts and remaining risks stated in the report

## 6. Working alongside other agents

Several assistants may work in this repository at the same time.

- Re-read a file immediately before editing it, and never revert changes you did not make.
- Do not move or rename shared documents while another session is active; links and validators depend on paths.
- Keep each change scoped to its task, and commit or push only when the person asks.
