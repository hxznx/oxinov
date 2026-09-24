# Coding agent instructions

This file applies to the whole Oxinov Platform repository. Read `README.md`, `docs/company/PLATFORM-BLUEPRINT.md`, the company architecture, company stack, company target structure, and the relevant product requirements, data, API, security, and DevOps documents before changing a feature. Use `docs/README.md` as the documentation map. For product work, read that product's charter in `docs/products/`; for sign-in or access work, read `docs/architecture/IDENTITY-AND-ACCESS.md` and `docs/company/PLATFORM-POLICIES.md`. OxinovLMS is the first product and its current implementation must remain functional during platform work.

- Treat the numbered FRD requirements and tenant isolation rules as the source of truth. Link changed behavior to its requirement ID.
- PostgreSQL is the transactional system of record. Every tenant-owned record and operation must carry and verify `tenant_id`; test allowed and denied cross-tenant paths.
- Keep Next.js presentation, NestJS business logic, worker jobs, and mobile clients within the boundaries in `docs/engineering/PROJECT-STRUCTURE.md`. Web and mobile use the versioned backend API.
- Keep browser/mobile code in `frontend/`, server processes in `backend/`, schema assets in `database/`, deployment automation in `devops/`, operational telemetry in `monitoring/`, and executable security/SOC assets in `security/`. Do not create a second competing folder layout.
- Keep the shared company control plane independent of product business logic. Products use versioned APIs and events and never read another product's database. Do not scaffold future product services until their product charter and release gate are approved.
- Treat AWS Mumbai, separate environment VPCs, ECS Fargate, RDS PostgreSQL, ElastiCache, S3, CloudFront/WAF, Route 53, ECR, Secrets Manager/KMS, GitHub Actions OIDC, and Terraform as the production baseline in `docs/architecture/AWS-CLOUD-ARCHITECTURE.md`. Do not replace it silently or introduce EKS without an ADR.
- Every product has its own frontend, backend, and database per the product plane template. One Oxinov account and session works across all products; customers sign in with Google or email one-time codes, never passwords. Products enforce the trust level and policy acceptance required per action and never store their own login data (ADR-011).
- Apply strict TypeScript, focused modules, SOLID where useful, DRY for shared rules, KISS, and YAGNI. Validate inputs at boundaries and use stable errors.
- Do not grant course access from a checkout redirect. Verify provider events and process each event idempotently.
- AI commands may propose tenant-scoped drafts through typed application actions. Never give generated content or agents direct production SQL, shell, secrets, publishing, refund, payout, or cross-tenant privileges.
- Do not copy official exam questions or imply official certification without rights. Mock results are practice results.
- Add meaningful tests for domain changes, migrations, payments, exams, and tenant access. Run `python scripts/validate_project.py` after documentation edits.
- Keep `.env`, keys, payment credentials, and personal data out of Git, logs, prompts, fixtures, and Docker images.
- Emit security events through the versioned schema in `security/soc/event-schema.json`; never place secrets, raw bodies, private messages, exam answers, or raw AI prompts in the SOC pipeline.
- Update docs, ADRs, OpenAPI contract, migrations, and acceptance criteria when changing their behavior. State what was tested and any remaining risks.

The repository currently contains a partial OxinovLMS backend plus documentation and infrastructure scaffolding. The company website, platform control plane, frontend, mobile app, and production deployment are not functional until implemented and verified.
