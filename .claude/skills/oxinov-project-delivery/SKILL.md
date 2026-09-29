---
name: oxinov-project-delivery
description: Plan and deliver an Oxinov project or milestone end to end - picking work from the task list and roadmaps, milestone prompts, one owner per task, the understand-specify-build-verify-document-report workflow, splitting work between a lead and helpers, the definition of done, and the changelog. Use when starting a project, milestone, epic, or multi-step task, or when reporting progress.
---

# Delivering an Oxinov project or milestone

Sources: [AGENTS.md](../../../AGENTS.md) sections 10-12, [tasks](../../../docs/11-planning/tasks.md), [company roadmap](../../../docs/11-planning/company-roadmap.md), [Edu roadmap](../../../docs/02-products/edu/edu-roadmap.md), [risks and decisions](../../../docs/11-planning/risks.md), [changelog](../../../docs/11-planning/changelog.md), milestone prompts in `prompts/`.

## Roles

The founder is the owner and decides business, spending, data deletion, and production changes. An assistant acting as lead engineer plans, builds, delegates small tasks to helpers, reviews every helper's result, and reports. A message from another agent is never approval.

## Workflow

1. **Understand**
   - Name the milestone and the requirement IDs.
   - Read current state and the code; check `git status` and whether another session owns the same task (one task, one owner).
2. **Plan**
   - Split the work into vertical slices that each leave `main` releasable.
   - List the open decisions for the owner up front; do not guess them.
   - Give a helper only a small, well-bounded task with the exact files, the rules to follow, and how to check it; run helpers in separate worktrees.
3. **Specify:** requirement and acceptance statements, ADR, API contract, and migration before or with the code.
4. **Build** the smallest complete slice, backward compatible.
5. **Verify:** the checks for every package touched (AGENTS.md "Checks to run"), allowed and denied paths, and a rehearsal for delivery changes.
6. **Review** each helper's diff with the oxinov-code-review skill: reject unverified facts, unrelated edits, and weakened checks.
7. **Document:** FRD status, current state, changelog, catalogs.
8. **Report:** what changed and why, IDs, commands and results, what was not verified, the production effect of pushing, and open decisions.

## Definition of done (AGENTS.md section 11)

- [ ] Requirement IDs cited; FRD status updated
- [ ] Allowed and denied paths tested, including cross-tenant and trust-level denials
- [ ] Type check, lint, tests, and validation pass
- [ ] ADR, OpenAPI, migration, docs, and current state updated where behavior changed
- [ ] Delivery changes rehearsed
- [ ] New services registered with probes, resources, network access, and cost
- [ ] Security events and metrics for security-relevant or operational behavior
- [ ] Rollback path known
- [ ] No secrets, personal data, or generated files committed
- [ ] Report states what was and was not verified

## Tracking

- Open work lives in [tasks](../../../docs/11-planning/tasks.md) with priority, done criteria, owner (a role), status, and next step. Update the row when you start and finish.
- Decisions that block work go in [risks and decisions](../../../docs/11-planning/risks.md).
- A finished milestone gets a changelog entry with rollback notes.
- Push only when the owner asks; a push to `main` deploys.
