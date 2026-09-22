# Database design

PostgreSQL is the mandatory transactional database and runs in Docker locally and in the planned production topology. Default: shared tables with `tenant_id`, tenant-scoped keys/indexes, API authorization, and PostgreSQL row-level security. Set tenant context transaction-locally and test pooled connections. Never use an RLS-bypassing role for tenant request paths.

Keep global identity and tenant registry separate from tenant-owned educational and financial records. Payment provider event IDs are unique and processed once. Money uses integer minor units plus currency; timestamps use UTC. Use reviewed Prisma migrations and PostgreSQL full-text search for the first catalog implementation.

Redis supports queues/cache/fanout; S3-compatible storage holds uploads and certificates; Mux hosts video. Neither replaces PostgreSQL as source of truth. Dedicated PostgreSQL per tenant is an optional tier requiring an ADR. See [data model](DATA-MODEL.md), [ERD](ERD.md), and [migration strategy](MIGRATION-STRATEGY.md).
