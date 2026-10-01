# ADR-027: One slug for Oxinov Edu: `edu` replaces `lms`

**Date:** 2026-09-28. **Status:** Accepted (owner decision: "lms word and folder and file completely remove and delete, it should be edu"). Supersedes the part of [ADR-015](adr-015-rename-to-oxinov-edu.md) that kept the `lms` prefix for internal identifiers, and point 3 of [ADR-025](adr-025-two-products-edu-hr.md) where it kept the `lms` slug for source paths, package names, OIDC audience, and database.

1. **`edu` is the product's only slug.** Folders are `frontend/products/edu-web`, `backend/products/edu-api`, `edu-worker`, `edu-chat`, `database/products/edu`, and `docs/02-products/edu`; packages are `@oxinov/edu-*`; root scripts are `pnpm edu:dev`, `edu:migrate`, and `edu:seed`; the `services.yaml` product, CI jobs, design tokens (`--ox-color-product-edu`), SOC detections, and monitoring labels use `edu` or plain `oxinov`. New code, configuration, and documents must not introduce `lms`.
2. **The platform product key becomes `edu`.** Platform migration `20260928120000_edu_product_key` renames the `products` row from `lms` to `edu`; the `ON UPDATE CASCADE` foreign key moves every entitlement with it, and member entitlements are renamed from `lms.*` to `edu.*` so `grantMemberAccess` does not create duplicates. The migration is forward-only and a no-op when already applied.
3. **Three production identifiers change only in an owner-approved cutover.** They are part of running production state, so renaming them in code alone would break deploys, sign-in, or data access:

   | Identifier | Today | Target | Why it waits |
   | --- | --- | --- | --- |
   | Image repository and `services.yaml` service key | `oxinov/lms-api`, `lms-api` | `oxinov/edu-api`, `edu-api` | Terraform names ECR repositories from the service keys; the new repository needs `terraform apply`, and the old one must survive until rollback no longer needs its images |
   | OIDC access-token audience | `oxinov-lms-api` | `oxinov-edu-api` | Existing tokens carry the old audience; the API accepts both during the switch (`AUTH_AUDIENCE` takes a comma-separated list) so nobody is signed out |
   | PostgreSQL database | `oxinov_lms` | `oxinov_edu` | Done on 2026-10-01 in a short Edu maintenance window (`ALTER DATABASE … RENAME` needs every connection closed) |

   The steps, checks, and rollback are in the [Edu rename cutover runbook](../../10-devops/runbooks/edu-rename-cutover.md). Until each step runs, its old name stays in the chart, realm, local environment, and Terraform, and only there.
4. **History is not rewritten.** Merged migrations are immutable (migration `20260924100300_product_catalogue` still inserts `lms`), and accepted ADRs and changelog entries describe the names used at the time.

Consequences: the next deploy rebuilds every Node image because source paths changed, with unchanged behavior; the account portal colors the Edu tile only when the migration and the new platform web app are both live (after a rollback the tile shows without its accent color, nothing else); developers run `pnpm install` once and start local servers from the renamed folders. Alternatives considered: keeping `lms` internally (ADR-015 and ADR-025; rejected by the owner), and renaming everything in one push (rejected: it would break the deploy until Terraform is applied, sign everyone out, and take Edu down while the database was renamed).
