# Coding agent instructions

This file applies to the whole Oxinov LMS repository. Read `README.md`, `docs/01-PRD.md`, `docs/02-FRD.md`, `docs/03-NFR.md`, and the relevant architecture/data/API document before changing a feature.

- Treat the numbered FRD requirements and tenant isolation rules as the source of truth. Link changed behavior to its requirement ID.
- PostgreSQL is the transactional system of record. Every tenant-owned record and operation must carry and verify `tenant_id`; test allowed and denied cross-tenant paths.
- Keep Next.js presentation, NestJS business logic, worker jobs, and mobile clients within the boundaries in `docs/engineering/PROJECT-STRUCTURE.md`. Web and mobile use the versioned backend API.
- Apply strict TypeScript, focused modules, SOLID where useful, DRY for shared rules, KISS, and YAGNI. Validate inputs at boundaries and use stable errors.
- Do not grant course access from a checkout redirect. Verify provider events and process each event idempotently.
- AI commands may propose tenant-scoped drafts through typed application actions. Never give generated content or agents direct production SQL, shell, secrets, publishing, refund, payout, or cross-tenant privileges.
- Do not copy official exam questions or imply official certification without rights. Mock results are practice results.
- Add meaningful tests for domain changes, migrations, payments, exams, and tenant access. Run `python scripts/validate_project.py` after documentation edits.
- Keep `.env`, keys, payment credentials, and personal data out of Git, logs, prompts, fixtures, and Docker images.
- Update docs, ADRs, OpenAPI contract, migrations, and acceptance criteria when changing their behavior. State what was tested and any remaining risks.

The repository is currently a documentation and infrastructure scaffold. Do not claim the frontend, backend, mobile app, or deployment is functional until implemented and verified.
