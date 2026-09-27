# Backend

Server-side code is separated into `gateway/`, the shared `platform-api/`, platform `workers/`,
and independently owned `products/`, one folder per product component named `<slug>-api`,
`<slug>-worker` or `<slug>-chat`. Oxinov Edu (`edu`) has `products/edu-api/` implemented and
`products/edu-worker/` and `products/edu-chat/` planned.

Backend processes enforce tenant membership and may use approved shared packages. Platform code
must not import product business logic, and one product must never read another product's
database. See [the Edu API](products/edu-api/README.md) and the
[target structure](../docs/08-engineering/company-project-structure.md).
