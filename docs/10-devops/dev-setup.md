# Local development setup

**Updated:** 2026-09-26. Everything runs on your machine with synthetic data ([environments](environments.md)).

## 1. Tools

Docker with Compose, Node.js 22, pnpm 12.6.0 (`corepack enable`), Python 3.12, and for infrastructure work Terraform 1.16, Helm 4, and ShellCheck.

## 2. Install and configure

```bash
pnpm install --frozen-lockfile
```

Copy `.env.example` to `.env` at the repository root and replace every `change-me` value. Each app has its own `.env.example` (for example `backend/products/lms-api/.env.example`, `frontend/products/lms-web/.env.example`).

## 3. Start dependencies

```bash
docker compose up -d postgres object-storage
docker compose --profile identity up -d
```

- `postgres`: PostgreSQL 18. A fresh volume creates the `oxinov_app` request role from `APP_DB_PASSWORD`; for an existing volume, run the `ALTER ROLE` command in the [Edu API README](../../backend/products/lms-api/README.md) once.
- `object-storage`: SeaweedFS with an S3 API on `127.0.0.1:9000`. Set `MEDIA_BUCKET`, `MEDIA_S3_ENDPOINT`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` in `backend/products/lms-api/.env`, then create the bucket and its CORS rule once with `pnpm --filter @oxinov/lms-api media:bucket`.
- `identity` profile: Keycloak and Mailpit (every email, including sign-in codes, at `http://localhost:8025`). Run `bash devops/keycloak/configure-realm.sh` once to create the realm and clients.
- The Compose `redis` service is not used by any app yet (ADR-021).

## 4. Database

```bash
pnpm lms:migrate
pnpm lms:seed
```

## 5. Run the apps

| App | Command | Address |
| --- | --- | --- |
| Edu API | `pnpm lms:dev` | `http://localhost:4000` |
| Edu web | `pnpm --filter @oxinov/lms-web dev` | `http://localhost:3002` |
| Platform API | `pnpm --filter @oxinov/platform-api db:migrate`, then `build` and `start` (it has no watch mode yet) | See its README |
| Account portal | `pnpm --filter @oxinov/platform-web dev` | `http://localhost:3001` (the same port as local Grafana; run one at a time) |
| Company website | `pnpm --filter @oxinov/company-web dev` | `http://localhost:3000` |
| Everything | `pnpm dev` (Turborepo) | |

## 6. Checks before you push

```bash
pnpm typecheck && pnpm lint && pnpm test
python scripts/validate_project.py
```

Add `pnpm test:integration` for database or tenant-isolation changes, and `bash devops/scripts/check-delivery.sh` for scripts, the chart, or workflows (see [AGENTS.md](../../AGENTS.md#checks-to-run)).

## Optional: monitoring

`docker compose --profile monitoring up -d` adds Prometheus (`:9090`), Alertmanager (`:9093`), Grafana (`:3001`), and exporters. See [observability](observability.md).
