---
name: oxinov-requirements
description: Add or change Oxinov requirements - functional requirements in the product FRDs with permanent IDs from each area's number block, acceptance statements, implementation status, NFRs, and tracing IDs into code and tests. Use before building behavior that no requirement covers, or when behavior changes.
---

# Oxinov requirements

Sources: [requirements standard and area registry](../../../docs/03-requirements/README.md), [NFR](../../../docs/03-requirements/nfr.md), the FRDs in [docs/03-requirements/frd](../../../docs/03-requirements/README.md#area-registry).

## Where requirements live

| Product | FRD | ID blocks |
| --- | --- | --- |
| Oxinov Edu | `docs/03-requirements/frd/edu-frd.md` | 101-1799 (AUTH, COURSE, CATALOG, PLAYER, ASSESS, CERT, COMM, ANALYTICS, LANG, SSW, IT, EXAM, CHAT, MGMT, MOBILE, TENANT, AI) |
| Platform | `docs/03-requirements/frd/platform-frd.md` | 2101-3399 (SITE, ID, TRUST, POLICY, ORG, PLAN, PAY, KYC, NOTIF, MSG, PORTAL, PRIV, OPS) |
| Oxinov HR | `docs/03-requirements/frd/hr-frd.md` | JOB 6000-6999, HR 8000-8499 |
| Market, Services Market, Studio, JP, Tech | Their proposed FRDs | 5000s, 7000s, 8500s, 8600s, 8700s |
| All products | `docs/03-requirements/nfr.md` | NFR-01 onward |

The area registry in the requirements standard is authoritative for blocks and owners.

## Steps for a new requirement

1. Search the FRDs for an existing requirement; extend it instead of duplicating.
2. Take the next unused ID in the area's block. **Never renumber or reuse an ID**; IDs are cited by code, migrations, and tests.
3. Write it in the FRD's template: statement ("The system must ..."), actors, acceptance statements that a test can check, and status (proposed until the owner approves).
4. If it changes a product decision (scope, pricing, stack, identity, payments), it needs the owner's approval and possibly an ADR.
5. When built, update the FRD's implementation table, cite the ID in code comments and tests, and in the commit message.

## Steps for changing existing behavior

1. Find the ID the code cites.
2. Change the requirement text and acceptance statements in the same change as the code.
3. Record the change in the changelog.

## Never

- Build behavior for a product whose release gate is not approved.
- Mark a requirement done without a passing test that checks its acceptance statements.
- Invent prices, legal positions, or dates in a requirement; mark them as open decisions for the owner.
