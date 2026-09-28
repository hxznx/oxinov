# 08 · Engineering

How code is written, tested, organized, and found. The [service catalog](service-catalog.md) and [file catalog](file-catalog.md) are generated; edit their generators in `scripts/`, never the files.

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

| Document | Purpose |
| --- | --- |
| [Documentation standard](documentation-standard.md) | Where documents go, the four kinds of document, how to write them, and how to keep them true |
| [Coding standards](coding-standards.md) | TypeScript, NestJS, and Next.js conventions |
| [Testing strategy](testing-strategy.md) | Unit, integration, end-to-end, accessibility, and load testing |
| [Dependency policy](dependency-policy.md) | Pinning, the pnpm catalog, updates, and licences |
| [Logging](logging.md) | Structured JSON logs, levels, and redaction |
| [Error handling](error-handling.md) | Application errors and how they map to API errors |
| [Git workflow](git-workflow.md) | Branches, commits, and pull requests |
| [Project structure](project-structure.md) | Current code layout and placement rules |
| [Company project structure](company-project-structure.md) | Target monorepo layout and the product plane template |
| [Company library standard](company-library-standard.md) | Classifying and growing the repository across products |
| [Service catalog](service-catalog.md) | Every deployable service (generated from `services.yaml`) |
| [File catalog](file-catalog.md) | Every repository file, by folder (generated) |

## Assistant skills

Coding assistants working here follow [oxinov-backend](../../.claude/skills/oxinov-backend/SKILL.md), [oxinov-frontend](../../.claude/skills/oxinov-frontend/SKILL.md), [oxinov-testing](../../.claude/skills/oxinov-testing/SKILL.md), [oxinov-version-control](../../.claude/skills/oxinov-version-control/SKILL.md), [oxinov-documentation](../../.claude/skills/oxinov-documentation/SKILL.md). All rules and skills: [AI knowledge](../14-ai-knowledge/README.md).
