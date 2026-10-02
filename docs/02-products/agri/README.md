# Oxinov Agri product record

The discovery record for an agricultural store with free information and paid access. Read the [proposed FRD](../../03-requirements/frd/agri-frd.md) for testable behavior.

**Status:** Proposed · **Owner:** Founder · **Last reviewed:** 2026-10-03

## Identity and ownership

| Field | Value |
| --- | --- |
| Display name | Oxinov Agri; final use of “Agri Market” remains an owner decision |
| Technical slug | `agri` for discovery documents only; no runtime identifiers approved |
| Kind | Agricultural goods store with paid information/services and conditional quoted manufacturing |
| Company pillar | AgriTech in the [platform blueprint](../../01-company/platform-blueprint.md) |
| Product, engineering and operations owners | Unassigned |
| Lifecycle | Candidate; requirements discovery only |
| Address | Open decision; no subdomain approved |
| Approval | Owner requested an FRD on 2026-10-01; product release and business rules not approved |
| Next review trigger | Owner review of access model, Market boundary, and initial catalog |

## Owner brief and evidence

On 2026-10-01 the owner clarified that Agri should sell agricultural products including seeds, plants, agricultural technology, equipment, tools, and agricultural manufacturing. The owner asked for an Edu-style customer model: paid customers gain access, while unpaid customers receive normal information, and explicitly requested this FRD.

This is owner direction, not observed customer demand. Earlier assistant suggestions for a farm-management/cooperative dashboard do not define this candidate. The [Edu store decision](../../04-architecture/adr/adr-028-edu-knowledge-store.md) provides a reference pattern; its prices and payment methods are not Agri approvals.

## Product-manager review

The 2026-10-03 audit improvements retain version 0.2 in the single canonical FRD, preserving IDs 8801–8844 and adding 8845–8850 for inventory receiving, adjustments, delivery eligibility, delivery exceptions, service commitments and the operations queue. It recommends one customer segment and a small stock-backed catalog with complete payment, fulfillment and support before broad expansion. Free information and optional paid value are distinct from goods purchases. Per-offering access and Oxinov-only selling are recommendations awaiting owner approval.

The first paid pilot must specify exactly what the buyer receives; purchasing remains disabled while membership prerequisites are undecided. Custom manufacturing follows in a later release, and seeds/plants require lot, handling and recall readiness before sales. Detailed measures, screens, delivery slices and acceptance journeys are maintained only in the FRD.

## Purpose and boundaries

Intended customers include growers, gardeners, farms, businesses purchasing equipment, and manufacturing customers. The first buyer segment, needs evidence and willingness to pay are unverified. Proposed value is a clear agricultural catalog with paid resources/services and separately fulfilled goods.

Ox Inov Pvt. Ltd. is the proposed initial seller, awaiting confirmation. Shared identity, trust, organization authority, billing, communications and privacy belong to the platform. Agricultural learning belongs to Edu. The overlap with [Market](../market/market-charter.md) must be decided before building; this document neither changes ADR-013 nor creates an independent product plane.

Commercial outcome is proposed goods margin, digital-access sales, and agreed manufacturing/service fees. Prices, costs, budget and numerical success targets remain open. Before funding, measure buyer comprehension, task success, payment completion, delivery issues, refunds, repeat purchase or renewal, and contribution after direct costs. Stop or narrow the initiative if demand or safe, sustainable fulfillment cannot be established.

Data includes public product information, private delivery details, payment-review evidence, purchased access records, and confidential manufacturing specifications. Approved classification, rights, category/regional restrictions, processor duties, retention and qualified regulatory review are release prerequisites.

## Canonical documents and implementation

- [Proposed Agri FRD](../../03-requirements/frd/agri-frd.md): AGRI discovery requirements.
- [Discovery reservation proposal](../../04-architecture/adr/adr-029-agri-requirements-discovery.md): documentation-only exception and number reservation.
- [Company library standard](../../08-engineering/company-library-standard.md): lifecycle and filing.
- [Current state](../../04-architecture/current-state.md): existing production systems.
- Applications, database, contracts, device assets, deployment and release tests: not created or approved.

## Release and retirement

The FRD's release-gate table is authoritative for this candidate. Product status stays Candidate until owner review and the documented gates pass. No launch date, infrastructure, recurring spend or production changes are authorized. A later retirement decision must preserve customer orders, licenses and required financial records and define migration, retention and shutdown evidence.

