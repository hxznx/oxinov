# Oxinov HR product record

The front page for everything about Oxinov HR. Files stay on their subject shelves; this page links them.
Structure follows the [company library standard](../../engineering/COMPANY-LIBRARY-STANDARD.md).

## Identity and ownership

| Field | Value |
| --- | --- |
| Display name | Oxinov HR |
| Technical slug | `hr` |
| Kind | Software: global marketplace of verified HR professionals and agencies, and a recruitment workspace from CV to deployment |
| Company pillar | Services: talent and workforce ([platform blueprint](../../company/PLATFORM-BLUEPRINT.md)) |
| Product owner | The founder |
| Engineering and operations owners | Lead engineer (assistant sessions) |
| Lifecycle | **Candidate**: FRD drafted for owner review (2026-09-28); not approved for implementation |
| Last reviewed / next review trigger | 2026-09-28 / owner review of the FRD |
| Approval | Not approved. The owner asked for the FRD on 2026-09-28; implementation needs release approval |

## The problem it solves

HR professionals with real skills and experience work in every country, and companies search for them all the time, but there is no authenticated platform where companies can trust who they are hiring and collaborate with them. Oxinov HR verifies HR professionals and agencies (identity, credentials, licences, and a placement record that only counts confirmed placements), lets companies anywhere find them by skill, sector, role type, country, and experience, and gives both one workspace to take candidates from CV to deployment, with candidate consent, fair-recruitment rules, and milestone payments.

It differs from [Oxinov Jobs](../jobs/README.md): Jobs is a job board in Nepal where employers and candidates meet directly; Oxinov HR is where companies engage HR professionals to recruit for them, worldwide.

## Product documents

| Document | Purpose |
| --- | --- |
| [FRD](../../requirements/HR-FRD.md) | Functional requirements FR-HR-8001 to 8143 (53 proposed requirements across the allocated block), dependencies, open decisions, and build order |
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
| Scope and requirements | Draft: [FRD](../../requirements/HR-FRD.md) for owner review |
| Owner approval of the first release and budget | Open |
| Legal review: employment agency, foreign employment, data protection, cross-border transfer (Nepal first, then launch destinations) | Open; blocks publishing |
| Business model (service fee, agency subscription) and payments with escrow | Open |
| Launch markets, sectors, and licence verification partners | Open |
| Moderation, dispute handling, and worker-safety operations staffing | Open |
| Stop or continue checkpoint | Proposed after build step 4 |
