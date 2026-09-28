---
name: oxinov-research
description: Run Oxinov research - user research and usability evidence, R&D projects and experiments with the project template, portfolio records, stage gates, and safe data handling. Use when investigating an opportunity, testing a hypothesis, evaluating a technology, or gathering user evidence before building.
---

# Oxinov research

Sources: [R&D operating system](../../../docs/12-research/README.md), [user-centred product standard](../../../docs/12-research/user-centered-product-standard.md), [project template](../../../docs/12-research/project-template.md), [portfolio](../../../docs/12-research/portfolio.md).

## Two kinds of research

| Kind | Question | Standard |
| --- | --- | --- |
| User and product research | What do people need, and can they use what we built? | User-centred product standard |
| Technical research and development | Can this uncertain capability work, at what cost? | R&D operating system |

Research never authorizes a customer launch, a product subdomain, production data access, or a product-plane scaffold. Those need the release gate.

## Steps for an R&D project or experiment

1. **Check the portfolio** for existing work on the same question.
2. **Copy the project template** and replace every bracketed instruction. IDs: `RD-YYYY-NNN` for projects, `RD-YYYY-NNN-EXP-NN` for experiments.
3. **Name an owner**, a time-boxed hypothesis, the success and stop criteria, and the decision it informs.
4. **Plan safe data and environments:** synthetic or approved data only, never production personal data, never secrets; no production access.
5. **Run small and reproducible:** record versions, inputs, commands, and results so another person can repeat it.
6. **Decide:** stop, continue, pivot, or transfer to an approved product owner. Record the decision and the evidence.
7. **Add it to the portfolio** and link it from the research README.

## Steps for user research

1. Write the question and the decision it serves.
2. Choose representative participants (devices, networks, languages read through translation, accessibility needs).
3. Get consent; store no raw personal data in the repository.
4. Record observed evidence, not opinions, and link findings to user needs and critical journeys in the product's records.

## Technology evaluation for engineering

When comparing tools or services: state the problem, list options including "do nothing" and what is already in the stack, compare on cost (US$50 budget), memory (4 GiB node), security, and operating effort, run a small spike on synthetic data, then write an ADR if the stack changes. Check the [technology radar](../../../docs/04-architecture/tech-radar.md) first.

## Never

Invent evidence, metrics, participant quotes, or results; publish research or share data with partners without intellectual-property and privacy review and the owner's approval.
