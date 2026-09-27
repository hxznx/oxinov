# Scalability strategy

**Updated:** 2026-09-26 (ADR-018, ADR-021). Scale by evidence, not in advance: each step below has a measured trigger, and the [DevOps roadmap](../10-devops/devops-roadmap.md) holds the exact thresholds.

## Principles

- Web apps and APIs are stateless; durable state lives only in PostgreSQL and S3 (NFR-12), so any service can run more replicas.
- Keep one modular API per product until a measured scaling, security, or ownership need justifies extracting a service (ADR-019 step 8).
- Partition work by tenant and apply tenant quotas to uploads, exams, and AI usage so one large school cannot starve others.
- Measure first: p95 API latency, error rate, database connections and slow queries, node CPU and memory, and storage per tenant.

## Steps, in order

| Step | Trigger (measured) | Change |
| --- | --- | --- |
| 1. Tune the node | Memory pressure or slow queries on the `t3a.medium` | Query indexes and N+1 fixes, right-size resource limits, PostgreSQL settings, CloudFront in front of static assets |
| 2. Bigger node | Sustained CPU or memory above the roadmap threshold | Resize to `t3a.large` (or Graviton equivalent) with a Savings Plan ([cost](../10-devops/cost-optimization.md)) |
| 3. Managed database | Data size makes restores slow, or a paying school needs an availability commitment | Amazon RDS for PostgreSQL (Multi-AZ when committed), same migrations |
| 4. EKS | Two or more products live, or availability commitments need more than one node | Amazon EKS across two Availability Zones with the same chart, plus a staging namespace |
| 5. Async work and cache | Retries, schedules, bulk email, or repeated expensive reads | SQS workers first; a Redis-compatible cache only for measured hot reads (ADR-021) |
| 6. Media delivery | Playback failures or rebuffering on slow networks | HLS transcoding and CloudFront signed delivery |
| 7. Isolation tiers | A customer's size, residency, or contract requires it | Dedicated database or account for that tenant or product (ADR-019 step 7) |

Before each step, run the load and recovery tests in the [testing strategy](../08-engineering/testing-strategy.md) and record the change in an ADR.
