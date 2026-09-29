---
name: oxinov-architecture-decision
description: Record an Oxinov architecture decision (ADR) - when one is required, the file name and next number, the date, status, context, decision, consequences, and alternatives, superseding older decisions, and updating the ADR index. Use when changing the stack, cloud, identity, payments, architecture, a product boundary, or reversing an earlier decision.
---

# Oxinov architecture decisions

Source: [ADR index](../../../docs/04-architecture/adr/README.md). Rule: [AGENTS.md](../../../AGENTS.md) section 4.3.

## When an ADR is required

- Changing the stack, cloud, identity, payments, or architecture
- Adding a new kind of runtime component (queue, cache, broker, new database engine, new language)
- Approving a product plane, merging or splitting products
- Reversing or narrowing an earlier ADR
- Any scale-out step (bigger node, RDS, EKS, isolation tiers)

A bug fix, a new endpoint, or a new feature inside the existing design does not need one.

## Steps

1. Read the related ADRs; never contradict one silently.
2. Take the next number after the last row in the index (the index ends at ADR-027 as of 2026-09-29); never renumber or reuse one.
3. Create `docs/04-architecture/adr/adr-NNN-short-title.md`:

   ```markdown
   # ADR-NNN: <decision in plain words>

   **Date:** YYYY-MM-DD. **Status:** Proposed | Accepted | Superseded by ADR-MMM.
   <Who decided, for example "owner decision" with the date, or "proposed for owner approval".>

   ## Context
   What forces the decision: facts, measurements, constraints (budget, 4 GiB node, team size).

   ## Decision
   What we will do, as numbered points.

   ## Consequences
   What gets easier, what gets harder, cost per month, operations, migration and rollback.

   ## Alternatives considered
   Each option with why it lost, including "do nothing".
   ```

4. Add a row to the index table.
5. If it supersedes an older ADR, add a new ADR that says so; do not rewrite the old one beyond its status line pointing to the new one.
6. Update the documents that describe the changed design (architecture, current state when it is live, tech radar, cost) and the changelog.
7. Run `python scripts/validate_project.py`.

## Rules

- Status is **Proposed** until the owner approves; never write "Accepted" on the owner's behalf.
- Never invent measurements, costs, or approvals; mark unknowns as open.
- One decision per ADR.
