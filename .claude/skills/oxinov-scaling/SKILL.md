---
name: oxinov-scaling
description: Scale Oxinov safely and by evidence - capacity measurement, the memory budget on the single node, the ordered scale-out steps (tune, bigger node, RDS, EKS, queues and cache, media delivery, isolation tiers) with their triggers, load testing, and cost. Use when something is slow or full, when adding a product or heavy feature, or when asked to make the system more scalable.
---

# Scaling Oxinov

Sources: [scalability strategy](../../../docs/04-architecture/scalability.md), [DevOps roadmap](../../../docs/10-devops/devops-roadmap.md) (exact thresholds), [cost optimization](../../../docs/10-devops/cost-optimization.md), [current state](../../../docs/04-architecture/current-state.md). Decisions: ADR-017, ADR-018, ADR-019, ADR-021, ADR-022.

## Principles

- **Scale by evidence, not in advance.** Every step has a measured trigger; do not pre-build the next one.
- Web apps and APIs are stateless; state lives only in PostgreSQL and S3, so any service can run more replicas.
- One modular API per product until a measured need justifies extracting a service.
- Partition by tenant and apply tenant quotas so one large customer cannot starve others.
- Cost is a requirement: all of AWS stays within US$50 a month until the owner approves more.

## Measure first

| Question | Where |
| --- | --- |
| Memory and disk on the node, per workload | `oxctl status` |
| Production memory requests against the budget | `memoryBudgetMi` (3,300 MiB) in the chart, checked in CI |
| Slow queries, connections | PostgreSQL statistics through `oxctl shell` (read only) |
| API latency and errors | Logs today; metrics after OpenTelemetry (ADR-019 step 5) |
| Spend | `oxctl cost` |

## The steps, in order

| Step | Trigger | Change |
| --- | --- | --- |
| 1. Tune the node | Memory pressure or slow queries | Indexes, N+1 fixes, right-sized limits, PostgreSQL settings, CloudFront for static assets |
| 2. Bigger node | Sustained CPU or memory above the roadmap threshold | `t3a.large` or Graviton, with a Savings Plan decision |
| 3. Managed database | Slow restores, or a paying school needs an availability commitment | Amazon RDS for PostgreSQL, same migrations |
| 4. EKS | Two or more products live, or availability needs more than one node | EKS across two Availability Zones, same chart, a staging namespace |
| 5. Async work and cache | Retries, schedules, bulk email, repeated expensive reads | SQS workers first (oxinov-events-and-jobs); cache only for measured hot reads |
| 6. Media delivery | Playback failures on slow networks | HLS transcoding and CloudFront signed delivery |
| 7. Isolation tiers | A customer's size, residency, or contract | Dedicated database or account for that tenant or product |

## Steps for any scaling change

1. Record the measurement that shows the trigger is met.
2. Try the earlier, cheaper step first.
3. Run the load and recovery tests in the [testing strategy](../../../docs/08-engineering/testing-strategy.md) (k6 and restore tests are planned; say so if they are not available).
4. Write or update an ADR with alternatives, the monthly cost, and rollback (oxinov-architecture-decision).
5. Make the change through Terraform and the chart (oxinov-terraform, oxinov-kubernetes) with the owner's approval.
6. Update current state, cost optimization, and the changelog.

## Code that scales from day one

Scope every query by tenant with indexes on `tenant_id`; paginate every list; avoid N+1 queries; keep no state in process memory; make writes idempotent; stream large files through presigned S3 URLs instead of through the API.
