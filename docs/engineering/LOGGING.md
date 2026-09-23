# Logging conventions

Emit structured JSON with timestamp, level, service, environment, request/correlation ID, tenant ID when authorized, event name, and safe error code. Separate audit events from diagnostic logs. Never log passwords, tokens, payment credentials, private notes, full exam answers, or raw AI prompts containing personal data.

Trace a payment webhook through fulfillment and entitlement. Trace tenant creation and AI approvals through their jobs. Security-relevant activity also emits the versioned event contract in `security/soc/event-schema.json`; diagnostic logs are not automatically security events. Define log retention and access in [privacy](../security/PRIVACY.md), [observability](../devops/OBSERVABILITY.md), and [SOC design](../security/SOC.md).
