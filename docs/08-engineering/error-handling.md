# Application error handling

Domain failures use typed errors (`NotEntitled`, `AttemptExpired`, `TenantForbidden`, `PaymentPending`) mapped to stable API codes. Retry only transient external failures, with bounded backoff and idempotency keys. Send exhausted background jobs to an operator-visible failure queue.

UI shows a recoverable state and request ID without technical secrets. Preserve drafts and exam answers across temporary connectivity loss. See the [API error contract](../06-api/api-errors.md).
