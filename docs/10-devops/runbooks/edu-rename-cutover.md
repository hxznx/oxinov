# Edu rename cutover: the last three `lms` identifiers

**Status:** prepared, not executed. Every step changes production and needs the owner's explicit "yes" for that step (AGENTS.md section 3). Decision: [ADR-027](../../04-architecture/adr/adr-027-edu-technical-slug.md).

The repository already uses `edu` everywhere else. Three names stay `lms` because production state depends on them. Do the three parts in this order, each as its own change, and never combine two in one push.

| Part | Changes | Downtime | Needs |
| --- | --- | --- | --- |
| A. Image repository | `oxinov/lms-api` → `oxinov/edu-api`; service key `lms-api` → `edu-api` | None | `terraform apply` |
| B. Token audience | `oxinov-lms-api` → `oxinov-edu-api` | None (users stay signed in) | Realm re-apply, three pushes |
| C. Database | `oxinov_lms` → `oxinov_edu` | Edu only, a few minutes | Maintenance window, fresh backup |

Before starting any part: `main` is green, no deploy is running (`oxctl runs`), and the change was rehearsed with `bash devops/kubernetes/scripts/rehearse-local.sh`.

## A. Image repository and service key

Terraform creates one ECR repository per key in `services.yaml` (`devops/terraform/environments/production/starter/storage.tf`). Renaming the key alone would make Terraform try to destroy `oxinov/lms-api`, whose images a rollback still needs.

1. In one change:
   - `services.yaml`: rename the key `lms-api` to `edu-api` (its `helm_tag` and `workload` are already `edu-api`), then run `python scripts/service_catalog.py`; `TAG_LMS_API` becomes `TAG_EDU_API`.
   - `devops/kubernetes/helm/oxinov/values.yaml`: `image: oxinov/edu-api`.
   - `storage.tf`: keep the old repository by adding a `retired_repositories = ["lms-api"]` local to the `for_each` set.
   - `outputs.tf`: reference `aws_ecr_repository.app["edu-api"]`.
   - Update `devops/scripts/release-plan.test.sh` and the image check in `rehearse-local.sh`.
2. `oxctl plan`: expect exactly one new repository, `oxinov/edu-api`, plus its lifecycle policy, and no destroy. The added monthly cost is ECR storage only (cents).
3. After the owner's "yes apply", apply, then push the change. CI builds `oxinov/edu-api:<sha>` and the release uses it.
4. Verify: `oxctl release` shows the Edu API image from `oxinov/edu-api`; `oxctl smoke` passes.
5. Rollback: `oxctl rollback` returns to the previous release, whose images are still in `oxinov/lms-api`.
6. Later, and only with the owner's approval to delete those images, remove `lms-api` from `retired_repositories` so Terraform deletes the old repository.

## B. Token audience

Keycloak adds an audience mapper to the Edu client for the audience named in `configure-realm.sh`, and never removes one. Access tokens live 10 minutes (`accessTokenLifespan=600`). The API accepts a comma-separated `AUTH_AUDIENCE`, so both names can be valid at once.

1. **Expand the API.** In `devops/kubernetes/helm/oxinov/templates/_helpers.tpl`, set `AUTH_AUDIENCE` to `oxinov-edu-api,oxinov-lms-api`. Push. Every existing token keeps working.
2. **Issue the new audience.** In `configure-realm.sh`, change `web_client oxinov-edu-web "$EDU_URL" oxinov-lms-api` to `oxinov-edu-api`. Push; the deploy re-applies the realm because the script changed. New tokens now carry both audiences.
3. **Contract**, at least 10 minutes after step 2:
   - Make `configure-realm.sh` delete the `lms-api-audience` mapper when present.
   - Set `AUTH_AUDIENCE` to `oxinov-edu-api` only.
   - Update the audience in `.env.example`, `frontend/products/edu-web/.env.example`, the edu-web README and `src/lib/auth.ts` comment, and `devops/keycloak/README.md`.
   - Push.
4. Verify after each push: sign in to `edu.oxinov.com` in a fresh browser, open a course, and confirm a signed-in session from before the change still works.
5. Rollback: revert the last push. Step 1 is harmless on its own; step 2 is safe while step 1 is live.

## C. Database name

`ALTER DATABASE … RENAME` fails while anything is connected, so the Edu API stops for the window. Other products and sign-in keep running.

1. Prepare, but do not push, one change that renames `oxinov_lms` to `oxinov_edu` in:
   - the chart: `_helpers.tpl` (`dbUrl` database), and `templates/platform.yaml` (`POSTGRES_DB`, both `pg_isready` checks, and the migration URL)
   - `devops/kubernetes/scripts/rehearse-local.sh`
   - `docker-compose.yml`, `.env.example`, and `backend/products/edu-api/.env.example`, including the local Compose project name `oxinov-lms` (renaming it makes Compose create new, empty containers and volumes, so each developer re-creates their local stack)
   - the documents that name the database: AGENTS.md section 5, current state, and database design

   Rehearse it locally, including a restore of a dump into the renamed database.
2. At the start of the window: `oxctl backup`, then confirm the new dump with `oxctl backups`.
3. `oxctl shell`, then stop the Edu API and rename the database:

   ```bash
   kubectl -n oxinov scale deployment edu-api --replicas=0
   kubectl -n oxinov exec postgres-0 -- psql -U oxinov -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'oxinov_lms'"
   kubectl -n oxinov exec postgres-0 -- psql -U oxinov -d postgres -c "ALTER DATABASE oxinov_lms RENAME TO oxinov_edu"
   ```

4. Push the prepared change and follow it with `oxctl watch`. The migration hook and the new Edu API pods use `oxinov_edu`, and Helm restores the replica count.
5. Verify: `oxctl status` shows `edu-api` ready, `oxctl smoke` passes, and a signed-in learner sees their courses and progress.
6. Rollback: if the release fails, rename the database back (`ALTER DATABASE oxinov_edu RENAME TO oxinov_lms`, with `edu-api` scaled to 0 again), then run `oxctl rollback`. Restoring the dump from step 2 is the last resort and needs the owner's approval, because it overwrites data.

Record each completed part in the [changelog](../../11-planning/changelog.md) and [current state](../../04-architecture/current-state.md), and tick it in ADR-027's table.
