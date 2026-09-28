# Product record template

A blank product record to copy into `docs/02-products/<slug>/README.md` when a new offering is registered. It is a template only: it is not an approved product or a release-gate decision.

**Status:** Current · **Owner:** Founder · **Last reviewed:** 2026-09-28

## How to use this template

1. Read the [company library standard](../08-engineering/company-library-standard.md) and the [release gate](../11-planning/company-roadmap.md#release-gate-for-every-new-product).
2. For a research-only initiative, use the [research project template](../12-research/project-template.md) instead.
3. Copy the sections below and replace every placeholder with a fact. Where a fact is unknown, write "Open decision" and name the role that decides.
4. Do not create empty application folders to fill the tables.

## Identity and ownership

| Field | Value to supply |
| --- | --- |
| Display name | Customer-facing name |
| Technical slug | Stable lowercase slug, independent of the display name |
| Kind | Software, service, hardware, content, or other, with a short explanation |
| Company pillar | Link to the relevant blueprint section |
| Product owner | Role, or Unassigned |
| Engineering and operations owners | Roles, or Unassigned |
| Lifecycle | Candidate at first; each advancement needs evidence |
| Last reviewed / next review trigger | Date, and the event or interval that triggers the next review |
| Approval | Not approved until a signed decision is linked |

## Purpose and boundaries

- Intended customers, their observed needs, and the supporting evidence.
- Value proposition, success measures, scope, and explicit exclusions.
- Product-specific workflows compared with shared platform dependencies.
- Pricing or strategic justification, budget, and the stop-or-continue checkpoint.
- Data classification, rights, regulatory assessment, and support and retention responsibilities.

## Canonical locations

| Artifact | Actual path or approved reference | Status |
| --- | --- | --- |
| Charter and approval | Supply link | Not approved |
| Functional requirements | Supply link after the gate | Not created |
| Web, mobile, API, worker | List only the components needed | Not created |
| Database and contracts | Supply owned paths when approved | Not created |
| Hardware, firmware, source media | Approved repository or asset-storage reference, if applicable | Not applicable until scoped |
| Deployment and monitoring | Supply runbook and dashboard references | Not verified |
| Tests and release evidence | Supply CI and journey verification references | Not verified |

## Release and retirement

- **Release:** record completed release-gate items, unresolved decisions, the approved pilot scope, and the evidence for each lifecycle transition.
- **Retirement:** name the successor, the customer migration, data retention or deletion, and the evidence of operational shutdown. Keep historical decisions accessible.
