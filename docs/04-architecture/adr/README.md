# Architecture decision records

Record each decision with date, status, context, choice, consequences, and alternatives considered. Do not silently change the stack in the FRD.

Each decision has its own file, named `adr-NNN-short-title.md`. Add new decisions at the end with the next number, and never renumber or reuse one.

| ADR | Decision | Status |
| --- | --- | --- |
| [ADR-001](adr-001-postgresql.md) | PostgreSQL as system of record | Accepted |
| [ADR-002](adr-002-separate-frontend-backend.md) | Separate frontend and backend | Proposed |
| [ADR-003](adr-003-one-shared-mobile-app.md) | One shared mobile app | Proposed |
| [ADR-004](adr-004-prometheus-grafana.md) | Prometheus and Grafana observability baseline | Accepted (initial implementation) |
| [ADR-005](adr-005-security-operations-pipeline.md) | Separate security operations pipeline | Accepted (baseline design) |
| [ADR-006](adr-006-tenant-context-rls.md) | Tenant context through transaction-local settings and a non-bypass role | Accepted |
| [ADR-007](adr-007-identity-token-verification.md) | Identity token verification and local development tokens | Accepted |
| [ADR-008](adr-008-control-plane-product-planes.md) | Shared company control plane with independent product planes | Accepted (target architecture) |
| [ADR-009](adr-009-aws-production-cloud.md) | AWS as the production cloud | Accepted |
| [ADR-010](adr-010-flo-softwares-adoption.md) | Adopt Flo Softwares marketplace concepts as Oxinov product planes | Accepted in principle; amended by ADR-025 |
| [ADR-011](adr-011-one-account-simple-signin.md) | One Oxinov account with simple sign-in and progressive trust | Accepted |
| [ADR-012](adr-012-feature-subscriptions.md) | Feature-based subscriptions governed by oxinov.com | Proposed (research) |
| [ADR-013](adr-013-commodity-market.md) | Expand Agri Market into Oxinov Commodity Market | Accepted in principle; release gate and legal review pending |
| [ADR-014](adr-014-bedrock-ai-platform.md) | Bedrock-first governed AI platform | Accepted (target architecture); implementation gated |
| [ADR-015](adr-015-rename-to-oxinov-edu.md) | Rename OxinovLMS to Oxinov Edu | Accepted |
| [ADR-016](adr-016-keycloak-signin.md) | Keycloak sign-in implementation for ADR-011 | Accepted |
| [ADR-017](adr-017-starter-single-server.md) | Starter single-server hosting for the Oxinov Edu launch | Accepted; runtime superseded by ADR-018 |
| [ADR-018](adr-018-kubernetes-k3s-cd.md) | Kubernetes (k3s) runtime and continuous deployment for every Oxinov service | Accepted |
| [ADR-019](adr-019-multi-product-architecture.md) | Multi-product platform architecture (one company, many services) | Accepted |
| [ADR-020](adr-020-english-only.md) | English-only product and company language | Accepted |
| [ADR-021](adr-021-production-baseline.md) | Production baseline until scale-out (media, cache, secrets, environments, monitoring) | Accepted |
| [ADR-022](adr-022-one-node-all-products.md) | Oxinov Jobs approved, and every product shares one Kubernetes node | Superseded in part by ADR-025 |
| [ADR-023](adr-023-khalti-esewa.md) | Oxinov sells its own courses first, with Khalti and eSewa | Accepted |
| [ADR-024](adr-024-tech-radar-q4.md) | Technology radar and stack improvements (2026-Q4) | Accepted |
| [ADR-025](adr-025-two-products-edu-hr.md) | Two product modules now—Oxinov Edu and unified Oxinov HR | Accepted |
| [ADR-026](adr-026-central-frd-folder.md) | Central FRD folder and five proposed module definitions | Accepted for requirements discovery only |
| [ADR-027](adr-027-edu-technical-slug.md) | One slug for Oxinov Edu: `edu` replaces `lms` | Accepted; production cutover pending |

## Pending

Choose company-platform product owners, AWS account and operations owners, identity operations model, final production sizing, Nepal and international payment providers, SIEM hosting/retention/on-call ownership, AI pilot owners/model aliases/approved data/budgets, tenant billing plans, and mobile purchase approach by market. See [RISKS.md](../../11-planning/risks.md).

## Assistant skills

Coding assistants working here follow [oxinov-architecture-decision](../../../.claude/skills/oxinov-architecture-decision/SKILL.md). All rules and skills: [AI knowledge](../../14-ai-knowledge/README.md).
