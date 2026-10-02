# API error contract

This reference defines the standard API error responses, HTTP status codes, and the structured JSON envelope used across all Oxinov APIs.

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

## 1. Error envelope

Every API error returns a stable JSON envelope. Do not expose stack traces, secrets, another tenant's identifiers, or payment details.

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "A human-readable explanation of the error.",
    "requestId": "req_12345abcde"
  }
}
```

- **`code`**: A stable string from the [Standard error codes](#2-standard-error-codes) table. Clients match on this, not the message.
- **`message`**: A plain English description for developers. Do not show this directly to users unless it is a validation error explicitly marked safe for UI.
- **`requestId`**: The correlation ID for tracing the error in server logs.

## 2. Standard error codes

| HTTP status | Error code | When to use |
| --- | --- | --- |
| `400` | `VALIDATION_FAILED` | The request payload was invalid (e.g., missing fields, wrong types). |
| `401` | `UNAUTHENTICATED` | The client provided no token, an expired token, or an invalid token. |
| `403` | `FORBIDDEN` | The authenticated user lacks permission for this action. |
| `403` | `TRUST_LEVEL_REQUIRED` | The action needs a higher trust level (T0–T4). See [identity and access](../04-architecture/identity-and-access.md). |
| `403` | `POLICY_ACCEPTANCE_REQUIRED` | The user must accept a new policy before proceeding. |
| `404` | `RESOURCE_NOT_FOUND` | The resource does not exist, or exists in another tenant (cross-tenant accesses return 404, not 403, to avoid data leakage). |
| `409` | `CONFLICT` | The request conflicts with the current state (e.g., creating a user that already exists). |
| `422` | `CONTENT_LINK_INVALID` | A lesson link is not an unlisted YouTube video or a Google Drive file, or does not fit the lesson kind (Edu, ADR-028 point 5); or a live class link is not https. The message says which and is safe to show. |
| `422` | `COUPON_INVALID` | A coupon code is unknown, expired, used up, or not for this course or plan (Edu store, FR-CATALOG-317). The message says which and is safe to show. |
| `429` | `RATE_LIMIT_EXCEEDED` | The client has sent too many requests in a given timeframe. |
| `500` | `INTERNAL_ERROR` | An unexpected server failure. Log the underlying cause server-side with tenant context. |

## 3. Implementation rules

- **Idempotency**: Idempotent retries return the original outcome when safe (e.g., deleting an already deleted resource returns `200 OK`).
- **Tenant isolation**: An unknown or forbidden resource in another tenant answers `404 Not Found` (never `403 Forbidden`).
- **Next steps**: When returning `TRUST_LEVEL_REQUIRED` or `POLICY_ACCEPTANCE_REQUIRED`, include the required level or policy ID in the response metadata so clients can prompt the user.
