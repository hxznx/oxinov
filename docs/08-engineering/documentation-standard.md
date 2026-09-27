# Documentation standard

How every document under `docs/` is organized, written, and kept true. It applies to people and to every coding assistant. When this standard and [AGENTS.md](../../AGENTS.md) disagree, AGENTS.md wins.

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-28

## 1. Where a document goes

| Content | Location |
| --- | --- |
| Why the company exists; policies, subscriptions, AI strategy | `01-company/` |
| One product: record, charter, brief, PRD, product architecture, roadmap, flows, UI, ERD, acceptance | `02-products/<slug>/`, file names prefixed with the slug (`edu-roadmap.md`) |
| Requirements standard, NFR, and every FRD | `03-requirements/`, FRDs in `03-requirements/frd/<product>-frd.md` |
| Company-wide architecture, current state, and decisions | `04-architecture/`, one file per decision in `04-architecture/adr/` |
| Data, API, design, engineering, security, DevOps, planning, research, marketing | `05-data/` to `13-marketing/` |
| Planned production procedures | `10-devops/runbooks/` |
| Guides that belong to code (how to run, test, or change one folder) | A `README.md` beside the code, linked from the matching `docs/` page |

Every folder has a `README.md` that indexes its documents, and every document must be reachable by links from [docs/README.md](../README.md). Folders are `NN-topic`; files are lowercase kebab-case.

## 2. Kinds of document

Each document is one kind. Mixing kinds is the main reason documents become long and hard to trust, so split a page that tries to be two.

| Kind | Answers | Examples | Shape |
| --- | --- | --- | --- |
| **Guide** | "How do I …?" | Developer setup, runbooks, onboarding | Goal, prerequisites, numbered steps, how to check it worked, rollback or what to do if it fails |
| **Reference** | "What exactly is …?" | FRDs, NFR, API specification, catalogs, data model | Complete, consistent entries in tables or fixed templates; no narrative |
| **Explanation** | "Why is it this way, and how do the parts fit?" | Architecture, strategy, blueprint, threat model | Context, the design or position, trade-offs, links to the decisions and references |
| **Record** | "What was decided or what happened?" | ADRs, changelog, research logs | Dated entries that are never rewritten; new entries supersede old ones |

## 3. The top of every document

1. An `# H1` title in sentence case.
2. One or two sentences: what the document covers and who should read it.
3. A status line:

   `**Status:** Current · **Owner:** <role> · **Last reviewed:** YYYY-MM-DD`

   - **Status:** `Current` (describes what exists or applies now), `Draft` (being written), `Proposed` (awaiting the owner's approval), or `Superseded` (with a link to its replacement).
   - **Owner:** a role, never a person's name. Use the owners in the [requirements area registry](../03-requirements/README.md#area-registry) or `Founder` when no role is assigned.
   - **Last reviewed:** the date someone last checked the whole document against reality.

FRDs, ADRs, and the changelog keep their own established headers.

## 4. Writing

- **Plain English** for readers who may use browser translation (ADR-020): short sentences, common words, one idea per paragraph.
- **Active voice and present tense.** Address the reader as "you" in guides. Use "must" only in requirements and rules.
- **Sentence-case headings**, numbered only when order matters.
- **Define each abbreviation** the first time a document uses it, except the everyday ones (API, URL, AWS).
- **Tables** for comparisons and anything with more than two attributes; lists of up to about seven items; code, paths, commands, and identifiers in backticks.
- **Formats:** dates `YYYY-MM-DD`; times in UTC unless a reader's local time is the point; money as an amount with a currency code (`US$50`, `NPR 1,500`).
- **Product names:** "Oxinov Edu" (short: "Edu"), "Oxinov HR", "Oxinov Market", "Oxinov Services Market", "Oxinov Studio", "Oxinov JP", "Oxinov Tech". Do not call Edu "LMS" or "OxinovLMS". Say "learning platform" or "Edu workspace" instead of "LMS". Three exceptions:
  - quoted history in records
  - SEO keyword research, because it records what people search for
  - the production identifiers listed in [ADR-027](../04-architecture/adr/adr-027-edu-technical-slug.md) until their cutover
- **No hype.** No superlatives, emojis, or claims a reader cannot check.

## 5. Keeping documents true

- **One source of truth per fact.** [Current state](../04-architecture/current-state.md) owns what runs today; FRDs own required behavior; ADRs own decisions; `services.yaml` owns the service list. Other documents link to them instead of restating them.
- **Label maturity.** Say plainly whether something is *live*, *built but not deployed*, *planned*, or *proposed*. Never describe a planned system in the present tense.
- **Cite IDs, not section numbers:** requirement IDs (`FR-TENANT-1605`), ADR numbers, NFR numbers.
- **Never invent** owners, prices, dates, approvals, metrics, or legal positions. If a fact is unknown, write that it is an open decision and who decides it.
- **Change documents with the behavior** they describe, in the same commit, and update **Last reviewed**.

## 6. Links and files

- Use relative links; link text says where it goes ("[current state](../04-architecture/current-state.md)", never "click here").
- Link a folder through its README.
- Do not delete a document. Move an unwanted or superseded one with `python scripts/quarantine.py --tracked <path>` and fix every link to it; `python scripts/validate_project.py` fails on broken links, unreachable documents, and uppercase names.
- Generated files (the [service catalog](service-catalog.md) and [file catalog](file-catalog.md)) are changed only through their generators.

## 7. Checklist before committing a document

- [ ] It is one kind of document, in the right folder, reachable from its folder README.
- [ ] Title, summary, and status line are present; **Last reviewed** is today if you checked it all.
- [ ] Every statement about the running system matches [current state](../04-architecture/current-state.md) or was verified in this change.
- [ ] IDs, numbers, dates, and names are unchanged unless you verified the new value.
- [ ] `python scripts/validate_project.py` passes.
