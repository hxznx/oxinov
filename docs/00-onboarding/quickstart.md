# Quickstart

This guide takes you from a fresh clone to Oxinov Edu running on your machine, and then through your first verified change. It is for any new engineer. The full reference for local tools and apps is [developer setup](../10-devops/dev-setup.md).

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-28

## Goal

By the end you will have:

- PostgreSQL running in Docker with the Edu schema and demo data
- the Edu API answering on `http://localhost:4000`
- optionally, the Edu web app on `http://localhost:3002` with local sign-in
- one small change on a branch that passes the same checks CI runs

Everything runs on your machine with synthetic data. Nothing in this guide touches production.

## Before you start

- **Tools:** Docker with Compose, Node.js 22, pnpm 12.6.0, Python 3.12, and Git. On Windows, use Git Bash and run Python as `python`, not `python3`.
- **Access:** read access to the GitHub repository.
- **Rules:** read sections 1 to 3 of [AGENTS.md](../../AGENTS.md). One rule matters on day one: every push to `main` deploys to production, so you work on a branch.

Local addresses used in this guide:

| Service | Address | Defined in |
| --- | --- | --- |
| PostgreSQL | `127.0.0.1:5432` | `docker-compose.yml` (`postgres`) |
| Edu API | `http://localhost:4000` | `backend/products/edu-api/.env.example` (`PORT`) |
| Edu web | `http://localhost:3002` | `frontend/products/edu-web/package.json` (`dev`) |
| Keycloak (identity) | `http://localhost:8080` | `docker-compose.yml` (`keycloak`, profile `identity`) |
| Mailpit (local inbox) | `http://localhost:8025` | `docker-compose.yml` (`mailpit`, profile `identity`) |
| Platform API | `http://localhost:4200` | `backend/platform-api/.env.example` (`PORT`) |
| Account portal | `http://localhost:3001` | `frontend/platform-web/package.json` (`dev`) |

You need only the first two for the API, and the next three for the web app. The platform API and account portal are not needed for Edu; see their READMEs ([platform API](../../backend/platform-api/README.md), [account portal](../../frontend/platform-web/README.md)).

## Steps

### 1. Clone and install

```bash
git clone git@github.com:hxznx/oxinov.git
cd oxinov
corepack enable
pnpm install --frozen-lockfile
```

`corepack enable` makes the pnpm version pinned in the root `package.json` (`packageManager`) available.

### 2. Create your local settings

```bash
cp .env.example .env
cp backend/products/edu-api/.env.example backend/products/edu-api/.env
```

- In `.env`, replace every `change-me` value with your own local value.
- In `backend/products/edu-api/.env`, make the passwords match `.env`:
  - `DATABASE_URL` uses the `oxinov_app` role, so its password is your `APP_DB_PASSWORD`.
  - `MIGRATION_DATABASE_URL` uses the `oxinov` owner role, so its password is your `POSTGRES_PASSWORD`.
- `.env` files stay on your machine. Git ignores them; never commit one.

### 3. Start PostgreSQL

```bash
docker compose up -d postgres
```

On a new Docker volume, PostgreSQL creates the Edu request role `oxinov_app` (password `APP_DB_PASSWORD`), the platform request role, and the Keycloak database. The Edu database is still named `oxinov_lms`; it is renamed only in the [ADR-027](../04-architecture/adr/adr-027-edu-technical-slug.md) cutover.

If your volume existed before, let the request role log in once, using your own `APP_DB_PASSWORD` value:

```bash
docker compose exec postgres psql -U oxinov -d oxinov_lms \
  -c "ALTER ROLE oxinov_app LOGIN PASSWORD 'change-me-local-app'"
```

### 4. Create the schema and demo data

```bash
pnpm edu:migrate
pnpm edu:seed
```

`edu:migrate` applies the migrations in `database/products/edu/migrations` as the owner role. `edu:seed` loads two demo workspaces with sample Japanese (JLPT N5) course content.

### 5. Build the shared server code

```bash
pnpm --filter @oxinov/server-kit build
pnpm --filter @oxinov/edu-api prisma:generate
```

The Edu API loads `@oxinov/server-kit` from its build output, and the Prisma database client is generated into `backend/products/edu-api/src/generated/`, which Git ignores. CI runs the same two commands before it checks the API.

### 6. Start the Edu API

The API reads its settings only from environment variables. `pnpm edu:dev` does not load `backend/products/edu-api/.env` by itself (the migration, seed, and token scripts do). Before you start it, make the values from that file available as environment variables in the terminal you use.

```bash
pnpm edu:dev
```

## Check that it works

In a second terminal:

```bash
curl http://localhost:4000/health/ready
pnpm --filter @oxinov/edu-api dev:token
```

- The health check answers when the API can reach PostgreSQL.
- `dev:token` prints a local development token for the seeded learner `dev|learner-aiko`. To use another seeded person, pass the subject as the first argument without `--`, for example `pnpm --filter @oxinov/edu-api dev:token "dev|sakura-owner"`. The subjects are listed in `backend/products/edu-api/scripts/dev-token.mjs`.

Call the API with the token in place of `<token>`:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:4000/v1/tenants
```

It returns the demo workspaces that person belongs to. The interactive API documentation is at `http://localhost:4000/docs` while `DEPLOY_ENVIRONMENT` is `local`.

## Optional: run the Edu web app

The web app signs people in through the local identity server, so it needs Keycloak and Mailpit.

1. Set `KEYCLOAK_AUTOMATION_SECRET` in `.env` (any random string of 24 or more characters), then start the identity profile and create the realm and clients:

   ```bash
   docker compose --profile identity up -d --wait
   bash devops/keycloak/configure-realm.sh
   ```

2. Restart the Edu API with these three settings added to its environment. The first two are the local Keycloak values from `backend/platform-api/.env.example`; the audience keeps its old name until the ADR-027 cutover:

   ```text
   AUTH_ISSUER=http://localhost:8080/realms/oxinov
   AUTH_JWKS_URL=http://localhost:8080/realms/oxinov/protocol/openid-connect/certs
   AUTH_AUDIENCE=oxinov-lms-api
   ```

3. Build the design system and create the web app settings:

   ```bash
   pnpm --filter @oxinov/design-system build
   cp frontend/products/edu-web/.env.example frontend/products/edu-web/.env.local
   ```

   In `.env.local`, set `SESSION_SECRET` to a random value of at least 32 characters, and `OIDC_CLIENT_SECRET` to the secret shown in the Keycloak admin console (`http://localhost:8080/admin`, Clients → `oxinov-edu-web` → Credentials). The admin console asks you to set up an authenticator app on first sign-in; details are in the [identity server README](../../devops/keycloak/README.md).

4. Start the web app:

   ```bash
   pnpm --filter @oxinov/edu-web dev
   ```

5. Open `http://localhost:3002`, choose email sign-in, and read the six-digit code in Mailpit at `http://localhost:8025`. After sign-in you can create a learning space.

For video and audio lessons you also need local object storage; follow the `object-storage` steps in [developer setup](../10-devops/dev-setup.md).

## Make your first verified change

1. Create a branch. Never commit to `main`:

   ```bash
   git switch -c <your-branch-name>
   ```

2. Make a small, low-risk change, such as a wording fix in a document or a new unit test. If the change touches behavior, find its requirement ID in the [Edu FRD](../03-requirements/frd/edu-frd.md) and cite it.

3. Run the checks for what you changed. These come from the checks table in [AGENTS.md](../../AGENTS.md#checks-to-run):

   | You changed | Run from the repository root |
   | --- | --- |
   | `backend/products/edu-api` | `pnpm --filter @oxinov/edu-api typecheck`, then `lint`, then `test` |
   | `frontend/products/edu-web` | `pnpm --filter @oxinov/edu-web typecheck`, then `lint`, `test`, and `build` |
   | Anything under `docs/` | `python scripts/validate_project.py` |
   | Added, removed, or renamed a file | `python scripts/project_catalog.py`, then the validation above |

   `pnpm validate` runs the documentation validation and the workspace check together. A change is not done while any check fails.

4. Commit only the files you changed, with a clear conventional message:

   ```bash
   git commit -m "docs: fix wording in the Edu README" -- <paths>
   ```

5. Push your branch and open a pull request against `main`. Say what changed, which requirement IDs it touches, and which checks you ran. The rules are in the [Git workflow](../08-engineering/git-workflow.md).

## If something fails

| What you see | What it means | What to do |
| --- | --- | --- |
| `docker compose` stops with `copy .env.example to .env and set POSTGRES_PASSWORD` or `set … in .env` | `.env` is missing or a required value is empty | Finish step 2 |
| `pnpm edu:dev` stops with `Invalid configuration` and `DATABASE_URL is required` | The API settings are not in the environment | See step 6 |
| The API or `edu:seed` cannot sign in to PostgreSQL | The passwords in `backend/products/edu-api/.env` do not match `.env`, or the volume is older than the request role | Match the passwords; run the `ALTER ROLE` command in step 3 |
| `pnpm --filter @oxinov/edu-web dev` stops with `Build @oxinov/design-system first` | The design system has not been built | Run `pnpm --filter @oxinov/design-system build` |
| Port 3001 is already in use | Local Grafana and the account portal both use it | Run one at a time |
| The containers or data belong to another checkout | `COMPOSE_PROJECT_NAME` in `.env.example` is `oxinov-lms`, so every checkout on the machine shares the same containers and volume | Coordinate before you change or reset the database |

To stop the local services, run `docker compose stop`. Your data stays in the Docker volume for next time.

## Next

Read the documents for your role in the [onboarding index](README.md#what-to-read-for-your-role).
