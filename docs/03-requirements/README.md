# Oxinov requirements standard

How Oxinov Pvt. Ltd. writes, numbers, and changes functional requirements documents (FRDs) for the company website, the shared platform, and each product. Read it before you add or change a requirement: code, tests, and migrations cite the IDs it defines.

**Status:** Current · **Owner:** Founder · **Last reviewed:** 2026-09-28

## Requirement hierarchy

```text
Company blueprint, policies, subscription model, ADRs   why and what the company commits to
        │
Product record and charter (docs/02-products/<slug>/)   problem, scope, exclusions, release gate
        │
FRD (docs/03-requirements/frd/<product>-frd.md)          what the system must do (this standard)
  ├── Platform FRD   platform-frd.md                     website, identity, trust, policies, orgs, plans, KYC, payments, notifications
  └── Product FRDs   edu-frd.md, hr-frd.md, ...          one per product, all in the same folder
        │
NFR (docs/03-requirements/nfr.md) and acceptance        how well, and how we prove it
        │
Code, migrations, OpenAPI, tests                        cite the FR ID they implement
```

A product FRD may use platform capabilities but never redefines them. When a product needs different platform behavior, change the Platform FRD and record an ADR.

## Requirement IDs

Format: `FR-<AREA>-<NUMBER>`, for example `FR-TRUST-2302`.

- `AREA` is an uppercase code from the registry below. Each area belongs to exactly one FRD.
- `NUMBER` is unique across the company. Each area owns a number block, so IDs never collide, even when an area moves to another document.
- IDs are permanent. Never renumber or reuse an ID. A removed requirement stays in its FRD, marked **Superseded** or **Withdrawn**, with a pointer to its replacement.
- Code comments, test names, migrations, commit messages, and pull requests cite IDs, never section numbers.

### Area registry

| Block | Areas | FRD | Owner |
| --- | --- | --- | --- |
| 101–1799 | AUTH, COURSE, CATALOG, PLAYER, ASSESS, CERT, COMM, ANALYTICS, LANG, SSW, IT, EXAM, CHAT, MGMT, MOBILE, TENANT, AI | [Oxinov Edu FRD](frd/edu-frd.md) | Edu product owner |
| 2101–2199 | SITE | [Platform FRD](frd/platform-frd.md) | Company website owner |
| 2201–2299 | ID | Platform FRD | Identity owner |
| 2301–2399 | TRUST | Platform FRD | Identity owner |
| 2401–2499 | POLICY | Platform FRD | Legal and trust owner |
| 2501–2599 | ORG | Platform FRD | Platform owner |
| 2601–2699 | PLAN | Platform FRD | Billing owner |
| 2701–2799 | PAY | Platform FRD | Billing owner |
| 2801–2899 | KYC | Platform FRD | Trust and safety owner |
| 2901–2999 | NOTIF | Platform FRD | Platform owner |
| 3001–3099 | MSG | Platform FRD | Platform owner |
| 3101–3199 | PORTAL | Platform FRD | Platform owner |
| 3201–3299 | PRIV | Platform FRD | Privacy owner |
| 3301–3399 | OPS | Platform FRD | Operations owner |
| 5000–5999 | MKT | [Oxinov Market FRD](frd/market-frd.md) (proposed) | Market product owner |
| 6000–6999 | JOB | [Oxinov HR FRD](frd/hr-frd.md), direct-hiring module (retained IDs) | HR product owner |
| 7000–7999 | SVC | [Services Market FRD](frd/services-market-frd.md) (proposed) | Services Market owner |
| 8000–8499 | HR | [Oxinov HR FRD](frd/hr-frd.md), managed-recruitment module (proposed) | HR product owner |
| 8500–8599 | STUDIO | [Oxinov Studio FRD](frd/studio-frd.md) (proposed) | Studio product owner |
| 8600–8699 | JP | [Oxinov JP FRD](frd/jp-frd.md) (proposed; definition to validate) | JP product owner |
| 8700–8799 | TECH | [Oxinov Tech FRD](frd/tech-frd.md) (proposed; definition to validate) | Tech product owner |
| 8800–8999 | Reserved | Future products (Oxinov AI and others) | Assigned at release gate |

Edu areas keep their historical numbers. New Edu requirements continue in the Edu block (101–1799).

## Requirement template

Each requirement is one paragraph that starts with its bold ID and title. An attribute line and testable acceptance statements follow it.

```markdown
**FR-AREA-0000 — Short title.** The system must <observable behavior>. <Rules, limits, and edge cases.>
*Priority:* Must | Should | Could. *Status:* Proposed | Approved | Implemented | Superseded | Withdrawn. *Access:* T0–T4, role, or entitlement key. *Source:* ADR, charter, or policy link.
- Acceptance: Given <state>, when <action>, then <result>.
- Acceptance: <denied or failure path>.
```

Writing rules:

- Use **must** for mandatory behavior and **may** for optional behavior. Avoid "should" in a requirement statement; express importance with the Priority attribute instead.
- Describe observable behavior, not implementation. Technology choices belong in ADRs and architecture documents.
- A requirement that reads or writes protected data states its access rule: trust level, role, tenant or owner scope, or entitlement key.
- Every requirement has at least one allowed path and one denied or failure path in its acceptance statements.
- Rules about money, time, identity, and personal data state units, time zones, retention, and audit behavior.
- Keep one behavior per requirement. Split a requirement when its parts can ship or fail independently.

## Priorities and status

| Priority | Meaning |
| --- | --- |
| Must | Required for the release named in the roadmap phase |
| Should | Important; can move to the next release with product-owner approval |
| Could | Desirable; implemented only when capacity allows |

| Status | Meaning |
| --- | --- |
| Proposed | Drafted, not yet reviewed by the owner |
| Approved | Reviewed and accepted for implementation |
| Implemented | Code, tests, and documentation merged and verified |
| Superseded | Replaced by another requirement named in the text |
| Withdrawn | Removed from scope with a reason |

## Traceability

| From | To | Rule |
| --- | --- | --- |
| Charter or ADR | FR | Each FR names its source in the *Source* attribute |
| FR | Acceptance criteria | Acceptance statements live with the FR; end-to-end Edu journeys live in the [Edu acceptance criteria](../02-products/edu/edu-acceptance-criteria.md) |
| FR | Code and tests | Implementations and tests cite the FR ID in a comment or test name |
| FR | OpenAPI | Operations that implement an FR list its ID in their description |
| FR | Security events | Security-relevant FRs name the event they emit from the [security event catalog](../../security/soc/EVENT-CATALOG.md) |

## Change process

1. Propose the change in the owning FRD with status **Proposed**. Take new IDs from the area's block.
2. If the change alters a company decision, add or update an ADR in the same change.
3. The area owner approves, and the status becomes **Approved**.
4. When code, tests, and documentation are merged and verified, set the status to **Implemented**.
5. Run `python scripts/validate_project.py`. It fails on duplicate IDs across all FRDs.

## FRD location and layout

Every FRD lives in [`frd/`](frd/) and is named `<product>-frd.md` in lowercase. This folder also holds this standard and the shared [non-functional requirements](nfr.md).

A product FRD is normally created when its charter passes the release gate. [ADR-026](../04-architecture/adr/adr-026-central-frd-folder.md) records the owner's exception for early discovery drafts for Market, Services Market, Studio, JP, and Tech. Those FRDs stay **Proposed**. They do not authorize application scaffolding or spending, and their release gates stay closed until the owner approves the missing owner, customer, legal, operating, data, and budget decisions.

Each FRD uses the product's number block from the registry and contains these parts:

1. **Header block:** Version, Date, Status, scope or product address, technical slug, a link to this standard with the number block, and sources.
2. **Implementation status**, once any requirement is built: a table of what is verified today.
3. **Purpose and scope**, with shared terms where the product needs them.
4. **Roles and access.**
5. **Dependencies:** the Platform FRs (and other products' APIs) the product relies on. The Platform FRD lists the products that depend on it instead.
6. **Functional requirements**, grouped by area.
7. **Out of scope**, as its own section or inside purpose and scope.
8. **Open decisions**, including the release gate for products that are not yet approved.
9. Optionally, a **build order** or suggested delivery slices, and related documents.

Section numbers help readers only. Always cite requirement IDs.
