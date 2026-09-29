---
name: oxinov-events-and-jobs
description: Design background work and communication between Oxinov products and services - the planned transactional outbox to Amazon SNS with SQS queues, idempotent consumers, dead-letter queues, product workers, scheduled jobs, and what to do while no queue exists. Use when a feature needs async processing, retries, schedules, bulk email, or data from another product.
---

# Events, workers, and background jobs

Sources: [platform architecture](../../../docs/04-architecture/platform-architecture.md), [scalability](../../../docs/04-architecture/scalability.md), [technology radar](../../../docs/04-architecture/tech-radar.md), [observability](../../../docs/10-devops/observability.md). Decisions: ADR-019 (step 3), ADR-021, ADR-024.

## Today

**No queue, broker, cache, or worker runs in production** (ADR-021). `backend/products/edu-worker`, `edu-chat`, and `backend/workers` are placeholders. Scheduled work that exists runs as Kubernetes CronJobs (the nightly `backup`). Do not add infrastructure for async work without a measured need.

## The planned design (ADR-019)

```text
product API ── same DB transaction ──▶ outbox table ──▶ relay ──▶ SNS topic ──▶ SQS queue per consumer ──▶ consumer
                                                                                   └─▶ dead-letter queue
```

- A service writes the event to an **outbox table in its own database in the same transaction** as the state change.
- A relay publishes to Amazon SNS; every consumer has its own SQS queue with a dead-letter queue.
- Delivery is at least once, so every consumer is **idempotent** (record processed event IDs, or use unique constraints).
- First planned events: `account.created`, `entitlement.changed`, `tenant.member.joined`; first cross-product trial: Edu certificate issued → Oxinov HR candidate profile.
- Synchronous calls between products stay for queries that need an immediate answer, through versioned APIs only.
- Kafka, RabbitMQ, and NATS are not used (always-on cost); SNS and SQS cost cents at this scale.

## Deciding what to build

| Need | Do this |
| --- | --- |
| Work that finishes within a request | Keep it in the request |
| Another product needs to know something happened | Outbox event (when the first one is approved) |
| Retries, schedules, bulk email, long jobs | A product worker consuming SQS (scalability step 5) |
| Nightly or periodic maintenance | A Kubernetes CronJob in the chart |
| Repeated expensive reads | Measure first; then a Redis-compatible cache for hot reads only (never records of truth) |

## Steps for the first queue or worker (with the owner's approval)

1. Write an ADR entry or update ADR-019's step with the measured need, the monthly cost, and the memory for the worker.
2. Create the SNS topic, SQS queues, and dead-letter queues in Terraform (oxinov-terraform; saved plan, "yes apply").
3. Create the outbox table and relay in the producing product (oxinov-database), and the event schema in `packages/contracts/<slug>`.
4. Create the worker with `oxctl new-service <product> worker` (oxinov-new-service).
5. Emit `oxinov_job_runs_total`, `oxinov_job_duration_seconds`, `oxinov_queue_depth`, and `oxinov_queue_oldest_job_age_seconds` (oxinov-observability).
6. Test duplicate delivery, out-of-order delivery, and poison messages reaching the dead-letter queue.
