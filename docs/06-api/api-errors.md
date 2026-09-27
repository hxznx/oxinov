# API error contract

Return a stable JSON envelope: `{"error":{"code":"RESOURCE_NOT_FOUND","message":"...","requestId":"..."}}`. Use 400 for validation, 401 for unauthenticated, 403 for forbidden, 404 for missing or non-disclosable cross-tenant resources, 409 for conflicts, and 429 for rate limits. When an action needs a higher trust level or an unaccepted policy, return 403 with `TRUST_LEVEL_REQUIRED` or `POLICY_ACCEPTANCE_REQUIRED` and the required level or policy ID so clients can show the next step (see [identity and access](../04-architecture/identity-and-access.md)).

Do not expose stack traces, secrets, another tenant's identifiers, or payment details. Include a request ID for support; log the underlying cause server-side with tenant context. Idempotent retries return the original outcome when safe.
