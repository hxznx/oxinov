# Local development setup

1. Install Docker with Compose, Python 3, Node.js 22, and pnpm 12.6.0.
2. Copy `.env.example` to `.env` and replace local placeholder credentials.
3. Run `docker compose up -d postgres redis object-storage` for infrastructure. The LMS API container is
   buildable now; the full `app` profile remains unavailable until the LMS frontend, worker, and
   chat runtimes are implemented.
4. Run `docker compose --profile monitoring up -d` to add PostgreSQL/Redis exporters, Prometheus, Alertmanager, and Grafana. Grafana is at `http://localhost:3001`; Prometheus is at `http://localhost:9090`; Alertmanager is at `http://localhost:9093`. Use the Grafana credentials from `.env`.
5. Run `python scripts/validate_project.py` to check this documentation scaffold.

6. Run `pnpm install --frozen-lockfile` at the repository root. Follow [backend/api/README.md](../../backend/api/README.md): apply migrations with `pnpm lms:migrate`, load demo data with `pnpm lms:seed`, and start it with `pnpm lms:dev`. A fresh Postgres volume creates the `oxinov_app` login from `APP_DB_PASSWORD`; for an existing volume, run the `ALTER ROLE` command in that README once.

## Lesson media (video and audio)

Local object storage is SeaweedFS (`object-storage` in `docker-compose.yml`, S3 API on `127.0.0.1:9000`). Set `OBJECT_STORAGE_ACCESS_KEY` and `OBJECT_STORAGE_SECRET_KEY` in `.env`, copy them into `backend/api/.env` as `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` with `MEDIA_BUCKET` and `MEDIA_S3_ENDPOINT`, then create the bucket and its CORS rule once:

```bash
pnpm --filter @oxinov/lms-api media:bucket
```

Media integration tests run when `TEST_MEDIA_S3_ENDPOINT` is set (CI starts SeaweedFS for them).
