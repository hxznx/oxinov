# Coding standards

**Updated:** 2026-09-26. Applies to every contributor and coding assistant ([AGENTS.md](../../AGENTS.md)). Related: [testing](testing-strategy.md), [dependencies](dependency-policy.md), [project structure](project-structure.md).

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

## Everywhere

- Strict TypeScript (`strict: true`, no `any` without a comment explaining why). Small focused modules; names that say what and in which unit (`priceMinor`, `timeLimitMin`, `expiresAt`).
- Validate at every boundary; typed results and stable error codes; never swallow an exception.
- SOLID where it clarifies ownership, DRY for stable shared rules, KISS, and YAGNI against speculative abstraction.
- Cite requirement IDs (for example `FR-ASSESS-502`) in comments and tests for the behaviour they implement.
- Formatting and linting run in CI (ESLint 9 flat config, Prettier); the code must read like the code around it.
- No secrets, personal data, or real customer content in code, fixtures, logs, or prompts.

## Frontend (Next.js 16, React 19)

- Server components by default; add `'use client'` only for interaction. Data is fetched on the server; the browser never holds API tokens (`@oxinov/web-auth`).
- Mutations use server actions that validate input and call the API; never trust client state for authorization.
- Style only with Tailwind classes mapped to `@oxinov/design-system` tokens; never hard-code colours or redraw the logo.
- WCAG 2.2 AA: one `h1`, headings in order, labels on every control, visible focus, keyboard paths, reduced motion respected.
- English only, written for translation (ADR-020); user content keeps full Unicode and right-to-left support.
- Performance budget: Core Web Vitals "good" on a mid-range phone on 4G (NFR-01); `next/font` self-hosted with Latin subsets; images with explicit sizes; no third-party scripts on the company website.
- Public pages get metadata through `src/seo` ([SEO](../13-marketing/seo/README.md)).

## Backend (NestJS 11)

- One module per domain area (controller, service, DTOs, tests). Controllers stay thin; services hold rules.
- DTOs with class-validator on every input; whitelist and forbid unknown properties.
- Authorization in the service for every protected action: token, entitlement, trust level, membership, role, and object ownership (see [auth](../06-api/api-auth.md)).
- All tenant data access goes through the database context that sets tenant and user transaction-locally (ADR-006).
- Use `@oxinov/server-kit` for hardening, health, readiness, metrics, and structured JSON logs with request IDs; never log bodies, tokens, answers, or personal data.
- External providers sit behind ports (interfaces) so they can be replaced and faked in tests.
- Idempotency for anything that can repeat (webhooks, submissions, payments).

## Database (PostgreSQL 18, Prisma 7)

- Every tenant-owned table has `tenant_id`, composite keys and foreign keys that include it, and a row-level security policy in the same migration.
- Forward-only migrations, compatible with the previous release (expand, then contract).
- Index filters and sorts with `tenant_id` first; paginate every list; no N+1 queries; no network calls inside transactions ([database design](../05-data/database-design.md#performance-rules)).

## Scripts and infrastructure

- Bash: `set -euo pipefail`, idempotent, `shellcheck`-clean, no secrets in output; logic in scripts, not only in workflow YAML (ADR-018).
- Terraform: `terraform fmt`, pinned providers, variables with validation, `default_tags`, no secrets in state; every apply follows a saved plan and the owner's approval.
- Helm and Kubernetes: non-root, no capabilities, read-only root filesystem where possible, requests and limits, network policies.
- Container images: pinned base images by digest, multi-stage builds, only runtime files in the final stage.
