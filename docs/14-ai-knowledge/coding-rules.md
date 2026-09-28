# Coding rules

The rules for writing code in this repository, in short form. Read them before you write TypeScript, scripts, or tests.

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

Source: [AGENTS.md](../../AGENTS.md) section 6.7, [coding standards](../08-engineering/coding-standards.md), [dependency policy](../08-engineering/dependency-policy.md), [error handling](../08-engineering/error-handling.md), and [logging](../08-engineering/logging.md).

## Must

- Use strict TypeScript. Group modules by feature (for example `src/notes/notes.controller.ts`, `notes.service.ts`, `notes.dto.ts`).
- Write code that reads like the surrounding code: the same naming, comment density, and idioms.
- Validate at every boundary: HTTP input, configuration, provider responses, and files.
- Use the stable error codes and the shared error envelope from `@oxinov/server-kit`.
- Cite the requirement ID (for example `FR-PLAYER-403`) in a comment or test for every behavior you add or change.
- Log one JSON line per event with the request ID; keep personal data and secrets out of logs.
- Pin exact dependency versions. Put a dependency that more than one package uses in the pnpm catalog (`pnpm-workspace.yaml`, `catalogMode: strict`).
- Check the implemented shared packages (`server-kit`, `web-auth`, `design-system`) before you add an abstraction.
- Write bash scripts with `set -euo pipefail`, make them idempotent and `shellcheck`-clean, and mark them executable in Git.
- Apply SOLID where it helps, DRY for stable shared rules, and KISS everywhere.

## Never

- Import one application from another, or an application from a package.
- Add a second copy of a framework (`scripts/validate-workspace.mjs` fails on a second `@nestjs/core` or `@nestjs/common`).
- Commit generated files (`dist/`, `.next/`, `src/generated/`) or `.env` files.
- Branch on an error `message`; clients branch on `code`.
- Add a dependency for something the platform or an existing package already does.

## Checks

| Changed | Run |
| --- | --- |
| An API | `pnpm --filter <package> typecheck`, `lint`, `test` |
| A web app | `pnpm --filter <package> typecheck`, `lint`, `test`, `build` |
| Dependencies | `pnpm install`, `node scripts/validate-workspace.mjs` |

Skills: [oxinov-backend](../../.claude/skills/oxinov-backend/SKILL.md), [oxinov-frontend](../../.claude/skills/oxinov-frontend/SKILL.md), [oxinov-testing](../../.claude/skills/oxinov-testing/SKILL.md).
