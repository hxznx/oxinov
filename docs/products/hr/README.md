# Oxinov HR product record

The front page for everything about Oxinov HR. Files stay on their subject shelves; this page links them.
Structure follows the [company library standard](../../engineering/COMPANY-LIBRARY-STANDARD.md).

## Identity and ownership

| Field | Value |
| --- | --- |
| Display name | Oxinov HR |
| Technical slug | `hr` |
| Kind | Software: verified HR network, managed recruitment from CV to deployment, and direct job discovery and applications |
| Company pillar | Services: talent and workforce ([platform blueprint](../../company/PLATFORM-BLUEPRINT.md)) |
| Product owner | The founder |
| Engineering and operations owners | Lead engineer (assistant sessions) |
| Lifecycle | **Candidate, consolidated**: standalone Jobs merged into HR by owner decision (2026-09-28); no HR application exists yet |
| Last reviewed / next review trigger | 2026-09-28 / owner review of the unified first release |
| Approval | Consolidation is approved. The former direct-hiring `FR-JOB-*` scope retains its 2026-09-27 approval; managed-recruitment `FR-HR-*` scope and publication need unified release approval |

## The problem it solves

HR professionals with real skills and experience work in every country, and companies search for them all the time, but there is no authenticated platform where companies can trust who they are hiring and collaborate with them. Oxinov HR verifies HR professionals and agencies (identity, credentials, licences, and a placement record that only counts confirmed placements), lets companies anywhere find them by skill, sector, role type, country, and experience, and gives both one workspace to take candidates from CV to deployment, with candidate consent, fair-recruitment rules, and milestone payments.

The former Oxinov Jobs scope is now HR's direct-hiring module: verified employers publish Nepal jobs and candidates apply directly under `hr.oxinov.com/jobs`. It shares the HR service and database boundary but keeps explicit permissions between direct applications and professional-managed engagements (ADR-024). There is no standalone Jobs product or `jobs.oxinov.com` release.

## Product documents

| Document | Purpose |
| --- | --- |
| [FRD](../../requirements/HR-FRD.md) | Unified functional requirements: 53 `FR-HR-*` managed-recruitment requirements and 30 retained `FR-JOB-*` direct-hiring requirements, dependencies, open decisions, and build order |
| [NFR](../../requirements/NFR.md) | Company-wide non-functional requirements Oxinov HR must meet |

## Canonical locations (planned)

| Artifact | Path | Status |
| --- | --- | --- |
| Web client | `frontend/products/hr-web` (`hr.oxinov.com`) | Not created; waits for approval |
| API | `backend/products/hr-api` | Not created |
| Database | `database/products/hr` (`oxinov_hr`, row-level security) | Not created |
| Deployment | Shared Helm chart and [`services.yaml`](../../../services.yaml) (`oxctl new-service hr api` and `hr web`) | Not created |

## Release gate

| Item | Status |
| --- | --- |
| Accountable product owner | Done: the founder |
| Scope and requirements | Unified [FRD](../../requirements/HR-FRD.md); direct hiring approved, managed recruitment proposed |
| Owner approval of the first release and budget | Open |
| Legal review: Nepal labour/job-posting rules, employment agency, foreign employment, data protection, retention, and cross-border transfer (Nepal first, then launch destinations) | Open; blocks publishing |
| Business model (service fee, agency subscription) and payments with escrow | Open |
| Launch employers and candidate segment; launch markets, sectors, and licence verification partners | Open |
| Moderation, dispute handling, and worker-safety operations staffing | Open |
| Stop or continue checkpoint | Proposed after build step 4 |
