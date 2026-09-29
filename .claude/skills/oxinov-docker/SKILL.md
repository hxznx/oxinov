---
name: oxinov-docker
description: Work with Oxinov containers - the shared multi-target Dockerfile, image hardening and pinning, local builds, and the local Docker Compose stack (PostgreSQL, object storage, Keycloak, Mailpit, monitoring). Use when changing devops/docker, docker-compose.yml, or an image target, or when running services locally.
---

# Oxinov Docker

Plan larger or cross-cutting infrastructure changes first with the oxinov-devops-architecture skill (tool ownership, today's production against the reference architecture, and the production safety rules).

Rules: [DevOps rules](../../../docs/14-ai-knowledge/devops-rules.md). Sources: [devops/docker](../../../devops/docker/README.md), [developer setup](../../../docs/10-devops/dev-setup.md).

## Images

One Dockerfile, `devops/docker/Dockerfile`, builds every image from the repository root, one target per service. The target for each service is in `services.yaml` (`build.target`).

| Target | Service |
| --- | --- |
| `backend` | Edu API (`backend/products/edu-api`) |
| `platform-api`, `platform-web`, `edu-web` | Platform API, account portal, Edu web |
| `migrate` | Migration job run as the Helm pre-upgrade hook |
| `mail-relay` | Keycloak email relay to SES |
| `backup` | Nightly `pg_dumpall` job (pinned `postgres` image by digest) |
| `worker`, `chat` | Templates; no application yet |

Every runtime image: pinned base image, production dependencies only, numeric non-root user `1000:1000`, a `HEALTHCHECK` on `/health/live` for APIs, and no secrets or `.env` files (`.dockerignore` excludes them).

## Steps for an image change

1. Change the target in `devops/docker/Dockerfile`; keep each target copying only its own source and approved shared packages.
2. If you add a target or change which files an image is built from, update the service's `build` and `inputs` in `services.yaml`, then `python scripts/service_catalog.py` and `--check`.
3. Build and start it locally:

   ```bash
   docker build -f devops/docker/Dockerfile --target backend -t oxinov/edu-api:local .
   docker run --rm -p 4000:4000 --env-file backend/products/edu-api/.env oxinov/edu-api:local
   ```

4. Run `bash devops/scripts/check-delivery.sh`. CI also scans the image with Trivy; HIGH and CRITICAL findings with fixes fail it.

A change to the lockfile, root `package.json`, `tsconfig.json`, or the Dockerfile rebuilds every Node image on the next push.

## Local Compose stack

`docker-compose.yml`, project name from `COMPOSE_PROJECT_NAME` (still `oxinov-lms` until the ADR-027 cutover, so every checkout shares the same containers and volume).

| Command | Starts |
| --- | --- |
| `docker compose up -d postgres` | PostgreSQL only (enough for the APIs and tests) |
| `docker compose up -d object-storage` | S3-compatible storage for media |
| `docker compose --profile identity up -d --wait` | Keycloak and Mailpit for sign-in |
| `docker compose --profile monitoring up -d` | Prometheus, Alertmanager, Grafana, exporters |

Copy `.env.example` to `.env` first; Compose stops with a clear message when a required value is missing.

## Shared-machine rules

Other sessions use the same Docker. Name your own containers, remove them when you finish, and coordinate before resetting a volume. Never `docker system prune` or remove containers you did not create.
