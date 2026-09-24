# Oxinov Edu database target

This is the target product-plane location for the existing LMS database assets currently under
`database/prisma/`, `database/migrations/`, `database/seeds/`, and `database/policies/`. Move those
assets only in the same dedicated migration that updates the LMS API, Docker, CI, and tests.

LMS tenant-owned records retain immutable `tenant_id` values, API authorization, PostgreSQL RLS,
and automated allowed and denied cross-tenant tests.
