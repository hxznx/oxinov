# Local development setup

1. Install Docker with Compose, Python 3, Node.js LTS, and a package manager once application source is added.
2. Copy `.env.example` to `.env` and replace local placeholder credentials.
3. Run `docker compose up -d postgres redis minio` for infrastructure. `docker compose --profile app up --build` becomes available after `frontend/web`, `backend/api`, `backend/worker`, and `backend/chat` are implemented.
4. Run `docker compose --profile monitoring up -d` to add PostgreSQL/Redis exporters, Prometheus, Alertmanager, and Grafana. Grafana is at `http://localhost:3001`; Prometheus is at `http://localhost:9090`; Alertmanager is at `http://localhost:9093`. Use the Grafana credentials from `.env`.
5. Run `python scripts/validate_project.py` to check this documentation scaffold.

6. For the API, follow [backend/api/README.md](../../backend/api/README.md): install dependencies, apply migrations with `npm run db:migrate`, load demo data with `npm run db:seed`, and start it with `npm run dev`. A fresh Postgres volume creates the `oxinov_app` login from `APP_DB_PASSWORD`; for an existing volume, run the `ALTER ROLE` command in that README once.
