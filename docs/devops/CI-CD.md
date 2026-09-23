# CI/CD pipeline

Current workflows validate the documentation scaffold and security conventions. When apps arrive, enable these required gates: lint/format, strict TypeScript, domain and PostgreSQL integration tests, OpenAPI compatibility, migration rehearsal, image build and scan, web/mobile smoke tests, Prometheus rule validation, and Grafana provisioning checks.

Release flow: main branch -> immutable images -> staging migration/deploy -> smoke tests -> synthetic monitoring alert -> approved production promotion -> monitoring. Android is built from the same release branch as a signed `.aab` for internal testing, then promoted through Play tracks after store checks. The checked-in `deploy.yml` is intentionally gated until a cloud target and secrets are configured.
