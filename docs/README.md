# Oxinov documentation

This is the entry point to every document about **Oxinov Pvt. Ltd.**: the company, its shared platform, and its products. Folders are numbered in reading order, from *why the company exists* to *how it is marketed*. Each folder has a README that indexes its documents.

**Status:** Current · **Owner:** Founder · **Last reviewed:** 2026-09-29

New here? Read [AGENTS.md](../AGENTS.md) (how everyone works in this repository), then [current state](04-architecture/current-state.md) (what actually runs today), then the folder for your task.

## Folders

| Folder | What it answers | Start with |
| --- | --- | --- |
| [00 · Onboarding](00-onboarding/README.md) | How to get the code running and what to read for your role | [Quickstart](00-onboarding/quickstart.md) |
| [01 · Company](01-company/README.md) | Why Oxinov exists; policies, subscriptions, AI strategy | [Platform blueprint](01-company/platform-blueprint.md) |
| [02 · Products](02-products/README.md) | What each product is, and its release gate | [Oxinov Edu](02-products/edu/README.md) |
| [03 · Requirements](03-requirements/README.md) | What the system must do, requirement by requirement | [Area registry and FRDs](03-requirements/README.md#area-registry) |
| [04 · Architecture](04-architecture/README.md) | How the pieces fit, what runs, and why | [Current state](04-architecture/current-state.md) |
| [05 · Data](05-data/README.md) | How data is stored, isolated, changed, and deleted | [Database design](05-data/database-design.md) |
| [06 · API](06-api/README.md) | Shared API contracts | [API specification](06-api/api-spec.md) |
| [07 · Design](07-design/README.md) | Brand, design system, accessibility | [Brand](07-design/brand.md) |
| [08 · Engineering](08-engineering/README.md) | How code is written, tested, and organized | [Coding standards](08-engineering/coding-standards.md) |
| [09 · Security](09-security/README.md) | Security baseline, privacy, secrets, AI governance, SOC | [Security baseline](09-security/security-baseline.md) |
| [10 · DevOps](10-devops/README.md) | Delivery, operations, backups, and cost | [CI/CD](10-devops/ci-cd.md) |
| [11 · Planning](11-planning/README.md) | Roadmaps, tasks, risks, and the changelog | [Company roadmap](11-planning/company-roadmap.md) |
| [12 · Research](12-research/README.md) | R&D operating system and user research standard | [User-centred product standard](12-research/user-centered-product-standard.md) |
| [13 · Marketing](13-marketing/README.md) | Marketing plan and search engine optimization | [SEO](13-marketing/seo/README.md) |
| [14 · AI knowledge](14-ai-knowledge/README.md) | Rule sets and step-by-step skills for coding assistants, by area and by service | [Skills map](14-ai-knowledge/README.md#which-skills-each-part-of-the-company-uses) |

## Which document wins

| Question | Source of truth |
| --- | --- |
| How to work in this repository | [AGENTS.md](../AGENTS.md) |
| What the product must do | The FRDs listed in the [area registry](03-requirements/README.md#area-registry) |
| What runs today | [Current state](04-architecture/current-state.md) |
| Why a decision was made | [Architecture decisions](04-architecture/adr/README.md) |

If two documents disagree and it matters, stop and ask the owner.

## Conventions

The full rules are in the [documentation standard](08-engineering/documentation-standard.md). In short:

- **Names:** folders are `NN-topic`; files are lowercase kebab-case (`current-state.md`). Product documents are prefixed with the product slug (`edu-roadmap.md`). The validator enforces lowercase names.
- **Links:** every document must be reachable by following links from this page. `python scripts/validate_project.py` fails on an unreachable document or a broken link.
- **Placement:** company-wide documents go in the numbered topic folder; a document about one product goes in `02-products/<slug>/`; every FRD goes in `03-requirements/frd/`.
- **Unwanted files:** never delete them by hand. Run `python scripts/quarantine.py --scan` to list leftovers (empty folders, caches, merge leftovers, unreachable documents) and `--scan --move` to move them into `DELETE_ME/`, which Git ignores. Empty `DELETE_ME/` once you have checked it.
- **Generated files:** the [service catalog](08-engineering/service-catalog.md) and [file catalog](08-engineering/file-catalog.md) come from `scripts/`; regenerate them instead of editing them.

Code-side guides live beside the code: the [project library](../PROJECT-LIBRARY.md), the [production runbook](../devops/kubernetes/README.md), and the [security engineering area](../security/README.md).
