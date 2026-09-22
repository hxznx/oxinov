# Observability

Collect structured logs, service metrics, traces, and audit events. Alert on API error rate, p95 latency, PostgreSQL health and storage, failed backups, queue lag, payment fulfillment, exam submission failures, video processing, and chat delivery. Dashboards must support tenant-safe filtering without exposing other tenants.

Each request and background job carries a correlation ID and permitted tenant ID. Define pager ownership and thresholds with the production load profile.
