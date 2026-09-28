---
name: oxinov-validation
description: Validate data and the repository in Oxinov - request DTOs, environment configuration, uploads and provider responses, plus the repository validators (validate_project.py, catalogs, workspace check). Use when adding inputs or configuration, or before committing any change.
---

# Oxinov validation

Two kinds of validation matter here: **runtime validation** of everything that enters a service, and **repository validation** of the code and documents before they are committed. Rules: [API rules](../../../docs/14-ai-knowledge/api-rules.md), [security rules](../../../docs/14-ai-knowledge/security-rules.md).

## Runtime validation

| Input | How |
| --- | --- |
| HTTP body, query, params | DTO classes with `class-validator`; the global `ValidationPipe` uses whitelist and forbid-non-whitelisted; `ParseUUIDPipe` on IDs |
| Environment configuration | Parsed and checked at startup (`src/config/app-config.ts`, `packages/server-kit/src/config.ts`); a missing or bad value stops the process with a clear error |
| Web forms | Checked in the server action for a good message, and always again by the API |
| Uploads | Size and type checked by the API before issuing a presigned URL (see `src/media/`, `src/assignments/submission-files.ts`) |
| Provider callbacks (payments) | Verified server-side with the provider and processed once; never trust a browser redirect |
| Tokens | Issuer, audience, and signature checked by `server-kit` (`auth.ts`) |

Steps for a new input: add the DTO field with decorators, add a unit or integration test for a rejected value, and check that the error is `VALIDATION_FAILED` with no internal detail.

## Repository validation

| When | Run from the repository root |
| --- | --- |
| Any change to `docs/` | `python scripts/validate_project.py` |
| A file added, removed, or renamed | `python scripts/project_catalog.py`, then the line above |
| `services.yaml`, the chart's services, or a Dockerfile target | `python scripts/service_catalog.py`, then `python scripts/service_catalog.py --check` |
| Dependencies or workspace layout | `pnpm install`, `node scripts/validate-workspace.mjs` |
| Both of the first and last | `pnpm validate` |
| Security settings of the repository | `pnpm validate:security` |

`validate_project.py` fails on an unreachable or uppercase document, a broken link, and a stale catalog. On Windows, run Python as `python`, not `python3`.

In a checkout shared with other sessions, generate catalogs in a separate worktree, so their untracked files do not leak into the catalog (AGENTS.md section 12).
