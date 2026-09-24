# OxinovLMS web target

This is the target product-plane location for the OxinovLMS web application. The existing
`frontend/web/` placeholder remains in place until a dedicated migration updates workspace,
Docker, CI, import, and test references together.

The LMS client calls versioned LMS and platform APIs and never connects directly to PostgreSQL.
