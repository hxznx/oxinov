# Scalability strategy

Begin with Docker Compose for local development and a measured single-host staging setup. Keep frontend, API, worker, and chat stateless so their images can scale independently. PostgreSQL and object storage hold durable state; Redis is replaceable.

Partition work by tenant in queues and apply tenant-level quotas to uploads, chat, exams, and AI usage. Monitor p95 API latency, database connections, queue lag, video failures, and storage/bandwidth by tenant. Add read replicas, dedicated tenant databases, or orchestration only when measured load or isolation needs justify them.

Before scale changes, run the [load and recovery tests](../engineering/TESTING-STRATEGY.md) and update the [ADR](ADR.md).
