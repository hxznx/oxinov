# Database

PostgreSQL schema assets live here. `prisma/` owns the ORM schema, `migrations/` owns reviewed changes, `seeds/` owns deterministic synthetic data, and `policies/` owns row-level security definitions. PostgreSQL remains the transactional system of record.

Only controlled backend and CI tasks may apply migrations or seeds. Frontend applications cannot import anything from this folder.
