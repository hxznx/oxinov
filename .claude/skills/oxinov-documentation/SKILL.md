---
name: oxinov-documentation
description: Write, move, or review Oxinov documents under docs/ - choosing the numbered folder and document kind, the status line, plain English, links and reachability, generated catalogs, quarantine instead of deletion, and validation. Use for any change to a Markdown document.
---

# Oxinov documentation

Rules: [documentation rules](../../../docs/14-ai-knowledge/documentation-rules.md). Source: [documentation standard](../../../docs/08-engineering/documentation-standard.md), [documentation map](../../../docs/README.md).

## Steps for a new document

1. **Check it does not exist.** Search `docs/` first; extend the existing document instead of adding a second source.
2. **Pick the folder:**

   | Content | Folder |
   | --- | --- |
   | Getting started | `00-onboarding/` |
   | Company, policies, strategy | `01-company/` |
   | One product | `02-products/<slug>/`, file named `<slug>-<topic>.md` |
   | Requirements | `03-requirements/`, FRDs in `03-requirements/frd/` |
   | Architecture and decisions | `04-architecture/`, ADRs in `04-architecture/adr/` |
   | Data, API, design, engineering, security, DevOps, planning, research, marketing | `05-data/` to `13-marketing/` |
   | Production procedures | `10-devops/runbooks/` |
   | Assistant rules | `14-ai-knowledge/` (skills go in `.claude/skills/`) |
   | How to run or change one code folder | `README.md` beside the code |

3. **Pick one kind:** guide (how to), reference (what exactly), explanation (why), or record (what was decided). Split a page that is two kinds.
4. **Write the top:** H1 title in sentence case, one or two sentences on what it covers and who reads it, then:

   `**Status:** Current · **Owner:** <role> · **Last reviewed:** YYYY-MM-DD`

   Status is Current, Draft, Proposed, or Superseded. Owner is a role from the requirements area registry, or Founder.
5. **Write the body** in plain English: short sentences, active voice, tables for comparisons, code and paths in backticks, dates `YYYY-MM-DD`, money with a currency code. Label maturity: live, built but not deployed, planned, proposed.
6. **Link it** from its folder README, and link out to the single sources (current state, FRDs, ADRs) instead of copying facts.
7. **Validate:**

   ```bash
   python scripts/project_catalog.py
   python scripts/validate_project.py
   ```

## Moving or removing a document

Never delete. Move it with `python scripts/quarantine.py --tracked <path>` (it goes to the Git-ignored `DELETE_ME/`), then fix every link to it. Do not move shared documents while another session is working on them.

## Records

ADRs and changelog entries are never rewritten. Supersede an ADR with a new one; add a new changelog entry at the top of [the changelog](../../../docs/11-planning/changelog.md).

## Review checklist

- [ ] Right folder, one kind, reachable from its README
- [ ] Title, summary, and status line present
- [ ] Every claim about the running system matches current state or was verified
- [ ] No invented owners, prices, dates, approvals, or metrics
- [ ] Validator passes
