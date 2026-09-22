# Local development setup

1. Install Docker with Compose, Python 3, Node.js LTS, and a package manager once application source is added.
2. Copy `.env.example` to `.env` and replace local placeholder credentials.
3. Run `docker compose up -d postgres redis minio` for infrastructure. `docker compose --profile app up --build` becomes available after `apps/web`, `apps/api`, `apps/worker`, and `apps/chat` are implemented.
4. Run `python scripts/validate_project.py` to check this documentation scaffold.

Docker is not installed in the current workspace environment, so Compose could not be executed here. Application code and migrations are the next implementation phase.
