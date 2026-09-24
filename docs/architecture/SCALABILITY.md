# Scalability strategy

Begin with Docker Compose for local development and ECS Fargate in AWS for deployed application containers. Keep frontend, API, worker, and chat stateless so their images can scale independently. RDS PostgreSQL and S3 hold durable state; ElastiCache Redis is replaceable.

Partition work by tenant in queues and apply tenant-level quotas to uploads, chat, exams, and AI usage. Monitor p95 API latency, database connections, queue lag, video failures, and storage/bandwidth by tenant. Add ECS task capacity, RDS read replicas, dedicated tenant databases, or EKS only when measured load, isolation, or team ownership justifies them.

Before scale changes, run the [load and recovery tests](../engineering/TESTING-STRATEGY.md) and update the [ADR](ADR.md).
