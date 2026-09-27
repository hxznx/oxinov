# ADR-015: Rename OxinovLMS to Oxinov Edu

**Date:** 2026-09-24. **Status:** Accepted. The first product's customer-facing name is **Oxinov Edu**, served at `edu.oxinov.com`. This replaces the working name OxinovLMS and the planned address `lms.oxinov.com`, which was never launched. Internal technical identifiers keep the `lms` prefix: package names (`@oxinov/lms-api`, `@oxinov/lms-web`), folders (`lms-web`, `lms-api`, `lms-worker`, `database/products/lms`), database names (`oxinov_lms`), entitlement keys and design tokens (`lms.*`, `color.product.lms`), and requirement-ID ranges. Renaming them would be a risky code, migration, and data change with no customer benefit.

Consequences: DNS records, the OIDC client, redirect URIs, and TLS certificates use `edu.oxinov.com` when they are created; no existing deployment needs migration. Documentation uses "Oxinov Edu" for the product and keeps `lms` only in technical identifiers. Alternatives considered: "Oxinov LMS" and "Oxinov Learn".
