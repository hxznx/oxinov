# API versioning

Start at `/v1`. Add fields without breaking existing clients. Breaking request/response changes require a new version, migration window, mobile compatibility plan, and deprecation notice. Backend deployments must support the currently released mobile app until its upgrade window ends.

Store versioned exam and content records separately from API versions. Publish the OpenAPI schema in CI and fail contract tests on unapproved breaking changes.
