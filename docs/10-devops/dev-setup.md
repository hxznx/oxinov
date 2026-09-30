# Local development setup

**Updated:** 2026-09-26. Everything runs on your machine with synthetic data ([environments](environments.md)).

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

## 1. Tools

Docker with Compose, Node.js 22, pnpm 12.6.0 (`corepack enable`), Python 3.12, and for infrastructure work Terraform 1.16, Helm 4, and ShellCheck.

## 2. Install and configure

```bash
pnpm install --frozen-lockfile
```

Copy `.env.example` to `.env` at the repository root and replace every `change-me` value. Each app has its own `.env.example` (for example `backend/products/edu-api/.env.example`, `frontend/products/edu-web/.env.example`).

## 3. Start dependencies

```bash
docker compose up -d postgres object-storage
docker compose --profile identity up -d
```

- `postgres`: PostgreSQL 18. A fresh volume creates the `oxinov_app` request role from `APP_DB_PASSWORD`; for an existing volume, run the `ALTER ROLE` command in the [Edu API README](../../backend/products/edu-api/README.md) once.
- `object-storage`: SeaweedFS with an S3 API on `127.0.0.1:9000`. Set `MEDIA_BUCKET`, `MEDIA_S3_ENDPOINT`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` in `backend/products/edu-api/.env`, then create the bucket and its CORS rule once with `pnpm --filter @oxinov/edu-api media:bucket`.
- `identity` profile: Keycloak and Mailpit (every email, including sign-in codes, at `http://localhost:8025`). Copy `devops/keycloak/admin/.env.example` to `devops/keycloak/admin/.env` once, replace every value, then run `bash devops/keycloak/admin/start-local.sh`: it starts the profile and applies the same realm script production uses, so it doubles as the rehearsal for a realm change ([Keycloak](../../devops/keycloak/README.md#run-locally)). If Keycloak already has a database, keep the administrator name and password it was created with. The Oxinov sign-in theme (`devops/keycloak/themes/oxinov`) is mounted into the container, so theme edits show on the next page load.
- The Compose `redis` service is not used by any app yet (ADR-021).

## 4. Database

```bash
pnpm edu:migrate
pnpm edu:seed
```

## 5. Run the apps

| App | Command | Address |
| --- | --- | --- |
| Edu API | `pnpm edu:dev` | `http://localhost:4000` |
| Edu web | `pnpm --filter @oxinov/edu-web dev` | `http://localhost:3002` |
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

## When Docker Desktop hangs (Windows)

Symptoms:
- `docker` commands never return;
- or Docker Desktop stays on "starting", or shows an error with **Reset to factory defaults**.

Never click that button, and never run `wsl --unregister` or `wsl --uninstall`: each one deletes local data.

1. **Stop Docker and WSL.** Quit Docker Desktop, then run `wsl --shutdown`. If that hangs, run `taskkill /F /IM wslservice.exe` in an Administrator Command Prompt. Windows restarts the service cleanly. Also stop any leftover `Docker Desktop.exe`, `com.docker.backend.exe`, and `wsl.exe` processes.
2. **Clear stale sockets if the start still fails.** A Docker Desktop that was force-closed can leave socket files behind. The start then fails with `rename ... .sock ... .sock.stale: The file cannot be accessed by the system`. Windows cannot delete these files, but you can rename the folder that holds them:
   - `%LOCALAPPDATA%\Docker\run`
   - `%LOCALAPPDATA%\docker-secrets-engine`

   Docker creates fresh folders on the next start. Containers and volumes are not stored there.
3. **Start Docker Desktop.** Wait for **Engine running**, then start the stack again. Containers stop after the engine restarts; `start-local.sh` or `docker compose up -d` brings them back.

## Optional: monitoring

`docker compose --profile monitoring up -d` adds Prometheus (`:9090`), Alertmanager (`:9093`), Grafana (`:3001`), and exporters. See [observability](observability.md).
