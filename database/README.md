# Database

PostgreSQL is the transactional system of record. The approved target separates the shared
`platform/` database from independently owned `products/<slug>/` databases, each with the same
`prisma/`, `migrations/`, `seeds/` and `policies/` shelves. Oxinov Edu's database is
[products/lms](products/lms/README.md).

Every tenant-owned product record and operation carries and verifies `tenant_id`. Services use
only their owned database or schema and communicate across boundaries through versioned APIs and
events. Only controlled backend and CI tasks may apply migrations or seeds; frontend applications
cannot import anything from this folder.
