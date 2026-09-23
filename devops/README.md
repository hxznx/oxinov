# DevOps

Deployment and infrastructure automation lives here:

- `docker/` contains application image definitions.
- `kubernetes/` contains future cluster manifests.
- `terraform/` contains future cloud infrastructure definitions.
- `ansible/` contains future host configuration.

The root `docker-compose.yml` remains the convenient local orchestration entry point. GitHub Actions workflow files stay in `.github/workflows/` because GitHub only executes workflows from that location; their behavior is documented under `docs/devops/`.
