# Database

PostgreSQL is the transactional system of record. The approved target separates the shared
`platform/` database from independently owned `products/` databases. Existing `prisma/`,
`migrations/`, `seeds/`, and `policies/` assets belong to OxinovLMS and remain at their legacy
paths until a dedicated migration updates the API, Docker, CI, and tests together.

Every tenant-owned product record and operation carries and verifies `tenant_id`. Services use
only their owned database or schema and communicate across boundaries through versioned APIs and
events. Only controlled backend and CI tasks may apply migrations or seeds; frontend applications
cannot import anything from this folder.
