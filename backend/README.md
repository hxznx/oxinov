# Backend

Server-side processes live here. `api/` owns HTTP business operations, `worker/` owns retryable background work, and `chat/` owns WebSocket delivery. Backend processes enforce tenant membership and may use shared packages according to the documented boundaries.
