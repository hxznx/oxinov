# Observability

## Baseline stack

| Component | Purpose | Local service |
| --- | --- | --- |
| Prometheus | Scrapes metrics, stores a 15-day/2 GB local history, and evaluates alert rules | `prometheus:9090` |
| Grafana | Displays provisioned dashboards using Prometheus as its default data source | `grafana:3000` |
| Alertmanager | Groups and routes Prometheus alerts | `alertmanager:9093` |
| PostgreSQL exporter | Publishes database health and activity metrics | `postgres-exporter:9187` |
| Redis exporter | Publishes cache, queue-support, memory, and connection metrics | `redis-exporter:9121` |

Configuration lives under `monitoring/`. Keep data sources, dashboards, and alert rules in version control. The local Alertmanager receiver is intentionally empty; staging and production require a real notification receiver and secret injection.

## Local operation

1. Copy `.env.example` to `.env`, replace every `change-me` value, and install/start Docker.
2. Run `docker compose --profile monitoring up -d`.
3. Open Grafana at `http://localhost:3001`, Prometheus at `http://localhost:9090`, and Alertmanager at `http://localhost:9093`.
4. In Prometheus, check **Status > Targets**. Prometheus, PostgreSQL, and Redis should be up.
5. In Grafana, open **Oxinov Platform > Oxinov Platform Overview**.

The application scrape targets are added when `backend/products/lms-api`, `backend/products/lms-worker`, `backend/products/lms-chat`, and `frontend/products/lms-web` expose `/metrics`; adding them earlier would generate false target-down alerts in the documentation-only scaffold.

## Application instrumentation contract

Each server process exposes `/metrics` only to the private container or cluster network. Health and readiness endpoints remain separate. Use the `oxinov_` prefix for product metrics, base units such as seconds and bytes, counters with `_total`, and bounded labels.

Required HTTP metrics:

- `oxinov_http_requests_total{service,method,route,status_code}`
- `oxinov_http_request_duration_seconds_bucket{service,method,route,status_code}`
- `oxinov_active_requests{service}`

Required domain and worker metrics:

- `oxinov_job_runs_total{job_type,outcome}` and `oxinov_job_duration_seconds_bucket{job_type,outcome}`
- `oxinov_queue_depth{queue}` and `oxinov_queue_oldest_job_age_seconds{queue}`
- `oxinov_payment_fulfillment_failures_total{provider,reason_code}`
- `oxinov_exam_submission_failures_total{reason_code}`
- `oxinov_video_processing_jobs_total{provider,outcome}`
- `oxinov_chat_deliveries_total{outcome}`
- `oxinov_backup_last_success_timestamp_seconds{database}`
- `oxinov_certificate_issuance_total{outcome}`

Use normalized route templates such as `/v1/courses/:courseId`, never raw URLs. Do not use tenant IDs, user IDs, email addresses, course IDs, request IDs, error messages, or other unbounded/personal values as metric labels. Correlation IDs and authorized tenant context belong in structured logs and traces, not metric labels.

## Dashboards

The starter platform dashboard shows scrape health, request throughput, API p95 latency, PostgreSQL exporter state, and Redis exporter state. Add these dashboards as implementation progresses:

1. **API and web:** traffic, error ratio, p50/p95/p99 latency, saturation, and deployment version.
2. **Workers and queues:** depth, oldest job age, throughput, retries, dead letters, and job duration.
3. **Learning:** lesson progress failures, exam submissions, grading time, and certificate issuance.
4. **Commerce:** verified webhooks, fulfillment failures, refunds, subscription events, and provider latency. Never expose payment details.
5. **Media and chat:** upload/transcode outcomes, playback errors, connection count, delivery failures, and fanout delay.
6. **Data:** PostgreSQL connections, locks, transaction rate, storage growth, Redis memory, evictions, and rejected connections.
7. **Recovery:** backup age, restore-test outcome, and recovery drill duration.

Tenant-wide product analytics belong in the authorized application analytics layer. Operational dashboards must avoid tenant identifiers unless a separately reviewed, access-controlled metric design proves bounded cardinality and privacy.

Security-event analysis belongs in the separate SOC pipeline described in `docs/security/SOC.md`. Grafana and Prometheus remain responsible for operational health; they may show aggregate security-control health but do not store investigation evidence or replace the SIEM.

## Alerts and service objectives

The checked-in rules cover scrape failures, PostgreSQL/Redis exporter availability, API server error ratio above 5%, API p95 latency above one second, payment fulfillment failures, and exam submission failures. Before production, add alerts for queue lag, stalled video jobs, certificate failures, storage pressure, failed backups, and expiring TLS certificates.

Every production alert needs:

- a severity, owner, runbook URL, and clear user impact;
- a duration that avoids paging on short harmless spikes;
- a staging test proving the notification route works;
- a review after incidents to adjust noisy or missing signals.

Track the proposed 99.9% availability and one-second API p95 target from `docs/requirements/NFR.md`. Finalize service-level indicators and the error-budget policy after launch traffic and regions are approved.

## Logs, traces, and production operation

Emit structured JSON logs with service, environment, deployment version, safe error code, correlation ID, and authorized tenant context. Add OpenTelemetry traces when application services exist, propagate trace context through HTTP, WebSocket, and worker jobs, and connect traces to Grafana through a selected backend. Select a centralized log backend before staging.

The Compose monitoring profile is suitable for local development and an initial single-host evaluation. Production requires authenticated Grafana access, TLS, private scrape paths, least-privilege exporter database credentials, encrypted receiver secrets, durable or managed metric storage, retention/cost limits, backups for dashboard configuration, and monitoring of the monitoring stack itself.

## Verification

- Validate JSON dashboards during CI.
- Run `promtool check config` and `promtool check rules` using the pinned Prometheus image.
- Start the monitoring profile and verify all expected targets are up.
- Trigger a synthetic staging alert and verify Alertmanager routing and recovery notification.
- Confirm no metric series or dashboard exposes personal data or unrestricted tenant information.

References: [Prometheus configuration](https://prometheus.io/docs/prometheus/latest/configuration/configuration/), [metric and label naming](https://prometheus.io/docs/practices/naming/), [Alertmanager overview](https://prometheus.io/docs/alerting/latest/overview/), and [Grafana provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/).
