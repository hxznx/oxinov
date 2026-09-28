# Documentation rules

The rules for documents under `docs/`, in short form. Read them before you write, move, or review a document.

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

Source: the [documentation standard](../08-engineering/documentation-standard.md) and [AGENTS.md](../../AGENTS.md) sections 2 and 10.

## Must

- Put the document in the right numbered folder; a document about one product goes in `02-products/<slug>/` with the slug as a file prefix; every FRD goes in `03-requirements/frd/`.
- Name files in lowercase kebab-case, and link every document from its folder README so it is reachable from [docs/README.md](../README.md).
- Write one kind of document: guide, reference, explanation, or record.
- Start with an H1 title, a one- or two-sentence summary, and the status line (`Status`, `Owner` as a role, `Last reviewed`).
- Write plain English for browser translation: short sentences, active voice, dates as `YYYY-MM-DD`, money with a currency code.
- Say whether something is live, built but not deployed, planned, or proposed.
- Link to the single source of a fact (current state, an FRD, an ADR, `services.yaml`) instead of restating it.
- Change documents in the same commit as the behavior they describe; update [current state](../04-architecture/current-state.md) and the [changelog](../11-planning/changelog.md) for runtime, data, security, or cost changes.
- Run `python scripts/validate_project.py`, and `python scripts/project_catalog.py` after adding, removing, or renaming files.

## Never

- Invent owners, prices, dates, approvals, metrics, or legal positions; write that the fact is an open decision and who decides it.
- Rewrite an ADR or a changelog entry; add a new one that supersedes it.
- Delete a document; move it with `python scripts/quarantine.py --tracked <path>` and fix every link.
- Edit the generated catalogs by hand.
- Call Oxinov Edu "LMS", except in quoted history, SEO keyword research, and the production identifiers listed in ADR-027.

Skills: [oxinov-documentation](../../.claude/skills/oxinov-documentation/SKILL.md), [oxinov-requirements](../../.claude/skills/oxinov-requirements/SKILL.md).
