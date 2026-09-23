# Payment webhook abuse runbook

## Trigger

Invalid webhook signatures, replay attempts, unusual provider-event volume, or entitlements inconsistent with verified payment state.

## Triage and containment

1. Preserve provider event IDs, signature-validation outcomes, safe request metadata, correlation IDs, and entitlement audit records. Never store payment credentials or full payloads unless the approved provider evidence process requires them.
2. Confirm provider delivery through the provider dashboard or API using an authorized account.
3. Block or rate-limit the abusive source only through approved controls; preserve legitimate provider delivery ranges and retry behavior.
4. Stop fulfillment if signature verification or idempotency is unreliable. Do not revoke valid learner access without transaction reconciliation.

## Recovery

Reconcile provider events against payments and entitlements, rotate a compromised webhook secret, replay verified unprocessed events idempotently, and add regression tests and detection tuning.
