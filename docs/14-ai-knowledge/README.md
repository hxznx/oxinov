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
| [oxinov-backend](../../.claude/skills/oxinov-backend/SKILL.md) | Build or change a NestJS API endpoint, service, or module |
| [oxinov-mvc](../../.claude/skills/oxinov-mvc/SKILL.md) | Decide which layer a piece of code belongs in (controller, service, data, view) |
| [oxinov-api-design](../../.claude/skills/oxinov-api-design/SKILL.md) | Design or change an API contract, error code, or OpenAPI description |
| [oxinov-validation](../../.claude/skills/oxinov-validation/SKILL.md) | Validate input, configuration, or the repository itself |
| [oxinov-database](../../.claude/skills/oxinov-database/SKILL.md) | Change a Prisma schema, write a migration, or change row-level security |
| [oxinov-frontend](../../.claude/skills/oxinov-frontend/SKILL.md) | Build or change a page, component, or server action in a Next.js app |
| [oxinov-branding](../../.claude/skills/oxinov-branding/SKILL.md) | Name a product, write public copy, or use the logo, colors, and tokens |
| [oxinov-testing](../../.claude/skills/oxinov-testing/SKILL.md) | Write or run unit, integration, policy, or site tests |
| [oxinov-security](../../.claude/skills/oxinov-security/SKILL.md) | Touch sign-in, authorization, secrets, personal data, or security events |
| [oxinov-version-control](../../.claude/skills/oxinov-version-control/SKILL.md) | Branch, commit, or push, especially in a shared checkout |
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

## Which skills each part of the company uses

| Part | Folders | Skills |
| --- | --- | --- |
| Company website (`oxinov.com`) | `frontend/company-web` | oxinov-frontend, oxinov-seo, oxinov-branding, oxinov-testing |
| Account portal (`app.oxinov.com`) | `frontend/platform-web` | oxinov-frontend, oxinov-branding, oxinov-security |
| Platform API | `backend/platform-api`, `database/platform` | oxinov-backend, oxinov-mvc, oxinov-api-design, oxinov-database, oxinov-security, oxinov-testing |
| Identity (`id.oxinov.com`) | `devops/keycloak` | oxinov-security, oxinov-kubernetes, oxinov-server |
| [Oxinov Edu](../02-products/edu/README.md) web | `frontend/products/edu-web` | oxinov-frontend, oxinov-branding, oxinov-validation, oxinov-testing |
| Oxinov Edu API | `backend/products/edu-api`, `database/products/edu` | oxinov-backend, oxinov-mvc, oxinov-api-design, oxinov-validation, oxinov-database, oxinov-security, oxinov-testing |
| Future products (HR, Market, Services Market, Studio, JP, Tech) | None until the release gate | oxinov-requirements, oxinov-research; then oxinov-new-service |
| Shared packages | `packages/server-kit`, `packages/web-auth`, `packages/design-system` | oxinov-backend, oxinov-frontend, oxinov-branding, oxinov-testing |
| Delivery | `.github/workflows`, `devops/scripts`, `devops/docker`, `devops/kubernetes` | oxinov-cicd, oxinov-docker, oxinov-kubernetes, oxinov-version-control |
| Infrastructure | `devops/terraform`, `devops/ansible` | oxinov-terraform, oxinov-aws, oxinov-ansible |
| Production operations | The k3s node, `oxctl` | oxinov-server, oxinov-aws, oxinov-kubernetes |
| Security operations | `security/` | oxinov-security |
| Documentation and planning | `docs/`, `prompts/` | oxinov-documentation, oxinov-requirements |
| Research | `docs/12-research` | oxinov-research |

## Keeping this folder true

- A rule set restates rules from AGENTS.md and the linked documents in short form, and links to its source. It never adds a rule of its own; a new rule goes into AGENTS.md or its source document first.
- A skill names only commands, paths, and scripts that exist. When you rename a script, a package, or a folder, search `.claude/skills/` and this folder in the same change.
- Add a skill for a task that assistants repeat and get wrong. Give it a folder `.claude/skills/oxinov-<task>/` with one `SKILL.md`, add it to the tables above, and link it from the README of the code folder it serves.
