---
name: oxinov-observability
description: Make Oxinov services observable - structured JSON logs with request IDs, health endpoints, the metrics naming contract, security events, CloudWatch alarms in production, and the local Prometheus, Alertmanager, and Grafana stack. Use when adding a service, a job, or behavior that operators must be able to see, or when adding alerts and dashboards.
---

# Oxinov observability

Sources: [observability](../../../docs/10-devops/observability.md), [logging](../../../docs/08-engineering/logging.md), [SOC](../../../docs/09-security/soc.md), [monitoring/](../../../monitoring/README.md). Decisions: ADR-004, ADR-005, ADR-021.

## What runs where

| Signal | Production today | Local and CI |
| --- | --- | --- |
| Logs | One JSON line per event with a request ID, read with `oxctl logs <service>` | Console |
| Health | `/health/live`, `/health/ready`; Kubernetes probes; post-release smoke test | Same |
| Alarms | CloudWatch: instance and system status, SES bounces and complaints | Alertmanager (empty receiver) |
| Metrics and dashboards | **None yet**; OpenTelemetry arrives with ADR-019 step 5 | Prometheus and Grafana: `docker compose --profile monitoring up -d` |
| Security events | Emitted through `@oxinov/server-kit` against `security/soc/event-schema.json` | Schema tests |

The Prometheus stack does not run in production because it would crowd out the applications on the 4 GiB node.

## Rules for code

- Log with the `server-kit` logger; one event per line with the request ID. Keep personal data, tokens, secrets, and request bodies out of logs.
- Every service has `/health/live` (process up) and `/health/ready` (dependencies reachable).
- Metrics use the `oxinov_` prefix, base units (seconds, bytes), `_total` for counters, and **bounded labels only**: never user IDs, emails, tenant names, or free text as labels.
- Required HTTP metrics: `oxinov_http_requests_total`, `oxinov_http_request_duration_seconds`, `oxinov_active_requests`. Jobs and queues: `oxinov_job_runs_total`, `oxinov_job_duration_seconds`, `oxinov_queue_depth`, `oxinov_queue_oldest_job_age_seconds`. Domain failures have their own counters (for example `oxinov_payment_fulfillment_failures_total`).
- Security-relevant behavior (denials, suspicious input, admin actions) emits a security event from the catalog (`security/soc/EVENT-CATALOG.md`); add the event there first.
- `/metrics` is exposed only on the private network.

## Steps when adding a service or job

1. Health endpoints and probes (oxinov-kubernetes).
2. Structured logs with a request or job ID.
3. The required metrics, and a domain failure counter for anything a user would notice.
4. Security events for security-relevant outcomes.
5. An alert rule under `monitoring/` for the failure an operator must act on, with a runbook link.
6. State in the change how an operator would notice this failing in production **today** (logs, smoke test, CloudWatch), since production metrics are not live.
