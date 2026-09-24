# Backend

Server-side code is separated into `gateway/`, the shared `platform-api/`, platform `workers/`,
and independently owned `products/`. The working Oxinov Edu service still lives at the legacy
`api/` path; `worker/` and `chat/` are LMS placeholders. They move only through a dedicated,
fully tested migration to the target product paths.

Backend processes enforce tenant membership and may use approved shared packages. Platform code
must not import product business logic, and one product must never read another product's
database. See [the current LMS API](api/README.md) and the
[target structure](../docs/engineering/COMPANY-PROJECT-STRUCTURE.md).
