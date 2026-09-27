# Backend

Server-side code is separated into `gateway/`, the shared `platform-api/`, platform `workers/`,
and independently owned `products/`, one folder per product component named `<slug>-api`,
`<slug>-worker` or `<slug>-chat`. Oxinov Edu (`lms`) has `products/lms-api/` implemented and
`products/lms-worker/` and `products/lms-chat/` planned.

Backend processes enforce tenant membership and may use approved shared packages. Platform code
must not import product business logic, and one product must never read another product's
database. See [the current LMS API](products/lms-api/README.md) and the
[target structure](../docs/08-engineering/company-project-structure.md).
