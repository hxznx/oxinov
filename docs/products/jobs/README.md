# Oxinov Jobs product record

The front page for everything about Oxinov Jobs. Files stay on their subject shelves; this page links them.
Structure follows the [company library standard](../../engineering/COMPANY-LIBRARY-STANDARD.md).

## Identity and ownership

| Field | Value |
| --- | --- |
| Display name | Oxinov Jobs |
| Technical slug | `jobs` |
| Kind | Software: job board and hiring workflow for Nepal |
| Company pillar | Education: talent and placements ([platform blueprint](../../company/PLATFORM-BLUEPRINT.md)) |
| Product owner | The founder (owner decision, 2026-09-27) |
| Engineering and operations owners | Lead engineer (assistant sessions) |
| Lifecycle | **Approved → In development** (2026-09-27); not public yet |
| Last reviewed / next review trigger | 2026-09-27 / each build step in the FRD, and before publishing `jobs.oxinov.com` |
| Approval | Owner approved the full first release on 2026-09-27 ([ADR-022](../../architecture/ADR.md#adr-022-oxinov-jobs-approved-and-every-product-shares-one-kubernetes-node)) |

## Product documents

| Document | Purpose |
| --- | --- |
| [Charter](../JOBS.md) | Problem, customers, scope, exclusions, data classification, regulatory review |
| [FRD](../../requirements/JOBS-FRD.md) | Functional requirements FR-JOB-6001 to 6092 and the build order |
| [NFR](../../requirements/NFR.md) | Company-wide non-functional requirements Jobs must meet |

## Canonical locations

| Artifact | Path | Status |
| --- | --- | --- |
| Web client | `frontend/products/jobs-web` (`jobs.oxinov.com`) | Build step 1 |
| API | `backend/products/jobs-api` | Build step 1 |
| Database | `database/products/jobs` (`oxinov_jobs`, row-level security) | Build step 1 |
| API contract | `packages/contracts` (`jobs`) | With the API |
| Deployment | Shared Helm chart and [`services.yaml`](../../../services.yaml), on the same k3s node as every product, priority class `oxinov-growth` (ADR-022) | With build step 1 |

## Release gate

The owner approved implementation of the full first release. Publishing `jobs.oxinov.com` to the public still needs:

| Item | Status |
| --- | --- |
| Accountable product owner | Done: the founder |
| Scope, exclusions, data classification, architecture boundary | Done: [charter](../JOBS.md) and [FRD](../../requirements/JOBS-FRD.md) |
| Delivery budget | Done: no new AWS cost; runs on the existing node (ADR-022) |
| Rights to Flo Softwares concepts confirmed in writing | Open (no source code is copied) |
| Regulatory review by Nepal counsel (Labour Act, privacy, retention) | Open; blocks publishing |
| Pricing model | Open; free first release |
| Launch employers, candidate segment, moderation and support plan | Open |
| Stop or continue checkpoint | Open; proposed after build step 3 |
