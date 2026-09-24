# Frontend

User-facing clients are separated by company, platform, and product responsibility:

- `company-web/` is the approved public company-site boundary.
- `platform-web/` is the approved account portal and product-launcher boundary.
- `products/` contains independently owned product web clients.
- `mobile/` contains product mobile clients only when approved.

The legacy `web/` and `mobile/` placeholders belong to Oxinov Edu and remain until a dedicated
migration updates every path together. All clients call versioned APIs and must never connect
directly to PostgreSQL or contain server secrets.
