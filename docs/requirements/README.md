# Oxinov requirements standard

This standard governs every functional requirements document (FRD) at Oxinov Pvt. Ltd. It keeps requirements for the company website, the shared platform, and each product consistent, traceable to code and tests, and safe to change.

## Requirement hierarchy

```text
Company blueprint, policies, subscription model, ADRs      why and what the company commits to
        │
Product charter (docs/products/)                           problem, scope, exclusions, release gate
        │
FRD                                                        what the system must do (this standard)
  ├── Platform FRD   docs/requirements/PLATFORM-FRD.md      website, identity, trust, policies, orgs, plans, KYC, payments, notifications
  └── Product FRDs   docs/02-FRD.md (OxinovLMS)             one FRD per product plane
                     docs/requirements/<PRODUCT>-FRD.md     created when a product passes its release gate
        │
NFR (docs/03-NFR.md) and acceptance criteria               how well, and how we prove it
        │
Code, migrations, OpenAPI, tests                           cite the FR ID they implement
```

A product FRD may use platform capabilities but never redefines them. When a product needs different platform behavior, change the Platform FRD and record an ADR.

## Requirement IDs

Format: `FR-<AREA>-<NUMBER>`, for example `FR-TRUST-2302`.

- `AREA` is an uppercase code from the registry below. Each area belongs to exactly one FRD.
- `NUMBER` is unique across the company. Each area owns a number block, so an ID never collides even when areas move between documents.
- IDs are permanent. Never renumber or reuse an ID. A removed requirement stays in its FRD marked **Superseded** or **Withdrawn** with a pointer to its replacement.
- Code comments, test names, migrations, commit messages, and pull requests cite IDs, never section numbers.

### Area registry

| Block | Areas | FRD | Owner |
| --- | --- | --- | --- |
| 101–1799 | AUTH, COURSE, CATALOG, PLAYER, ASSESS, CERT, COMM, ANALYTICS, LANG, SSW, IT, EXAM, CHAT, MGMT, MOBILE, TENANT, AI | [OxinovLMS FRD](../02-FRD.md) | LMS product owner |
| 2101–2199 | SITE | [Platform FRD](PLATFORM-FRD.md) | Company website owner |
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
| 5000–5999 | MKT | Commodity Market FRD (after release gate) | Commodity Market owner |
| 6000–6999 | JOB | Jobs FRD (after release gate) | Jobs owner |
| 7000–7999 | SVC | Services Market FRD (after release gate) | Services Market owner |
| 8000–8999 | Reserved | Future products (Oxinov AI and others) | Assigned at release gate |

LMS areas keep their historical numbers. New LMS requirements continue in the LMS block.

## Requirement template

Each requirement is one paragraph that starts with its bold ID and title, followed by a compact attribute line and testable acceptance statements.

```markdown
**FR-AREA-0000 — Short title.** The system must <observable behavior>. <Rules, limits, and edge cases.>
*Priority:* Must | Should | Could. *Status:* Proposed | Approved | Implemented | Superseded | Withdrawn. *Access:* T0–T4, role, or entitlement key. *Source:* ADR, charter, or policy link.
- Acceptance: Given <state>, when <action>, then <result>.
- Acceptance: <denied or failure path>.
```

Writing rules:

- Use **must** for mandatory behavior and **may** for optional behavior. Avoid "should" inside a requirement statement; use the Priority attribute instead.
- Describe observable behavior, not implementation. Put technology choices in ADRs and architecture documents.
- Every requirement that reads or writes protected data states its access rule (trust level, role, tenant or owner scope, entitlement key).
- Every requirement has at least one allowed path and one denied or failure path in its acceptance statements.
- Money, time, identity, and personal data rules state units, time zones, retention, and audit behavior.
- Keep one behavior per requirement. Split a requirement when parts can ship or fail independently.

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
| FR | Acceptance criteria | Acceptance statements live with the FR; cross-product journeys live in [acceptance criteria](../planning/ACCEPTANCE-CRITERIA.md) |
| FR | Code and tests | Implementations and tests cite the FR ID in a comment or test name |
| FR | OpenAPI | Operations that implement an FR list its ID in their description |
| FR | Security events | Security-relevant FRs name the event emitted from `security/soc/EVENT-CATALOG.md` |

## Change process

1. Propose the change in the owning FRD with status **Proposed**; add new IDs from the area's block.
2. If the change alters a company decision, add or update an ADR in the same change.
3. The area owner approves; the status becomes **Approved**.
4. When code, tests, and documentation are merged and verified, set **Implemented**.
5. Run `python scripts/validate_project.py`; it fails on duplicate IDs across all FRDs.

## Product FRD creation

A product FRD is created only when its charter passes the release gate. Copy the section layout of the Platform FRD: purpose and scope, roles, dependencies on platform FRs, functional requirements by area, out of scope, and open decisions. Use the product's number block from the registry.
