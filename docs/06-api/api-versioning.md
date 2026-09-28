# API versioning

This document outlines the API versioning strategy, breaking change policy, and deprecation lifecycle for all Oxinov APIs.

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

## 1. Versioning strategy

- **URI Versioning**: Start all APIs at `/v1` (e.g., `api.oxinov.com/v1/users`).
- **Additive Changes**: Add new fields, endpoints, or optional query parameters without breaking existing clients. Additive changes do *not* require a new version.
- **Breaking Changes**: Breaking request or response changes require a new version (e.g., `/v2`).

## 2. Breaking change policy

A change is considered breaking if it requires clients to update their code to continue functioning correctly.

**Examples of breaking changes:**
- Removing or renaming an existing field or endpoint.
- Changing the data type of an existing field.
- Adding a new required parameter to an existing request.
- Changing the expected format of an existing parameter.

**Examples of non-breaking (additive) changes:**
- Adding a new optional field to a request or response.
- Adding a new endpoint.
- Adding a new enum value (clients must be built to handle unknown enum values gracefully).

## 3. Deprecation and mobile compatibility

When a breaking change necessitates a new version:

1. **Migration Window**: A migration window must be defined and communicated to all consumers.
2. **Mobile Compatibility Plan**: Backend deployments must support the currently released mobile app versions until their respective upgrade windows end.
3. **Deprecation Notice**: The old version must be marked as deprecated in the OpenAPI schema, and consumers must be notified.

## 4. Implementation rules

- **OpenAPI Schema**: Publish the OpenAPI schema in CI. Contract tests will automatically fail on unapproved breaking changes to the active version.
- **Content Versioning**: Store versioned exam and educational content records separately from API versions. Content versions reflect the curriculum changes, while API versions reflect the system contract.
