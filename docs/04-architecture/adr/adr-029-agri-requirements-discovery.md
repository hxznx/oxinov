# ADR-029: Agri requirements discovery and number reservation

**Date:** 2026-10-01. **Status:** Proposed; documentation reservation only, architecture and commercial approval pending.

## Context

The owner requested an Agri FRD after defining an agricultural store for seeds, plants, technology, equipment, tools and manufacturing, with Edu-style free information and paid access. [ADR-026](adr-026-central-frd-folder.md) centralizes FRDs and leaves 8800–8999 reserved. [ADR-013](adr-013-commodity-market.md) already places agricultural trading in Market. The new request permits a discovery draft but does not resolve that boundary.

## Proposed decision

1. Record a Candidate [Agri product](../../02-products/agri/README.md) and [Proposed FRD](../../03-requirements/frd/agri-frd.md) in the existing document hierarchy, following the owner's explicit discovery request.
2. Reserve 8800–8899 for AGRI discovery IDs to prevent collisions. Keep 8900–8999 reserved. This administrative reservation does not approve requirements or a product plane.
3. Treat `agri` as a documentation candidate slug. Before implementation, the owner must resolve whether it is a Market storefront/module or an independent product. Existing Market, Edu, identity and payment decisions remain unchanged.
4. Keep requirements Proposed; no runtime, spending, subdomain, bank configuration, or release is approved.

## Consequences

The owner can review acceptance statements before committing development funds. Physical commerce overlaps with Market and must not be implemented twice. Exact recurring cost, staffing and node capacity are unknown and require estimates and approval before implementation. This document introduces no new AWS resource or recurring spend. Documentation rollback is a revert; there is no data migration.

## Alternatives considered

- Extend only Market now: possible eventual implementation, but would prematurely settle the requested Agri identity and paid-access boundary.
- Approve a separate Agri product now: premature without customer evidence, commercial scope, operating ownership and a funded release gate.
- Keep the request only in chat: loses durable requirement IDs and repository traceability.

