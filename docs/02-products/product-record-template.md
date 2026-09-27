# Product record template

Template only; not an approved product or release gate decision.
Use alongside the [company library standard](../08-engineering/company-library-standard.md) and existing [release gate](../11-planning/company-roadmap.md#release-gate-for-every-new-product).
For a research-only initiative, use the [research project template](../12-research/project-template.md) instead.

## Identity and ownership

| Field | Value to supply |
| --- | --- |
| Display name | Customer-facing name |
| Technical slug | Stable lowercase slug; independent of display name |
| Kind | Software / service / hardware / content / other, explained |
| Company pillar | Link to the relevant blueprint section |
| Product owner | Name or Unassigned |
| Engineering and operations owners | Names or Unassigned |
| Lifecycle | Candidate initially; evidence required for advancement |
| Last reviewed / next review trigger | Date and event or interval |
| Approval | Not approved until a signed decision is linked |

## Purpose and boundaries

- Intended customers, observed needs and supporting evidence.
- Value proposition, success measures, scope and explicit exclusions.
- Product-specific workflows versus shared platform dependencies.
- Pricing or strategic justification, budget and stop/continue checkpoint.
- Data classification, rights, regulatory assessment, support and retention responsibilities.

## Canonical locations

| Artifact | Actual path or approved reference | Status |
| --- | --- | --- |
| Charter and approval | Supply link | Not approved |
| Functional requirements | Supply link after gate | Not created |
| Web / mobile / API / worker | List only needed components | Not created |
| Database and contracts | Supply owned paths when approved | Not created |
| Hardware / firmware / source media | Approved repository or asset-storage reference, if applicable | Not applicable until scoped |
| Deployment and monitoring | Supply runbook and dashboard references | Not verified |
| Tests and release evidence | Supply CI and journey verification references | Not verified |

Replace these placeholders with factual status. Do not create empty application folders to fill this table.

## Release and retirement

Record completed release-gate items, unresolved decisions, approved pilot scope and evidence for each lifecycle transition.
When retired, identify the successor, customer migration, data retention/deletion and operational shutdown evidence. Keep historical decisions accessible.
