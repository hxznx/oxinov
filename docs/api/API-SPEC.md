# API contract

**Updated:** 2026-09-26. The NestJS APIs publish versioned OpenAPI; `pnpm --filter @oxinov/lms-api openapi` writes the Edu contract to `packages/contracts/openapi.json`. Web and mobile clients use the same documented API, and business rules never live only in a frontend. Every tenant route requires an authenticated membership and a resolved tenant context ([auth](AUTH.md)).

Today the APIs have no public host: browsers call the web apps, which call the APIs from the server with the person's token. A public API host (for mobile apps and partners) is added with its own rate limits and scopes when the first client needs it.

## Oxinov Edu API (`backend/products/lms-api`), all under `/v1/tenants/{tenantId}`

| Module | Routes (built) |
| --- | --- |
| Tenants and members | `GET /v1/tenants`, `POST /v1/tenants`, `GET /v1/tenants/{tenantId}`; invites (join codes): `POST/GET invites`, `DELETE invites/{id}`, `GET members`, `POST redeem` |
| Catalogue | `GET courses`, `GET courses/{courseId}`, `GET courses/{courseId}/lessons/{lessonId}` |
| Authoring | `GET authoring/courses`; course draft, sections, lessons, reordering, review, and publishing under `courses/{courseId}/draft` |
| Enrollment | `POST courses/{courseId}/enrollments`, `GET me/enrollments` |
| Media | `POST media/uploads` (presigned upload), `POST media/{id}/complete`, `PUT media/{id}/progress` |
| Quizzes (authoring) | `GET/POST courses/{courseId}/quizzes`, `GET/PATCH quizzes/{id}`, sections and questions, publish, close, copy |
| Exams (taking) | `GET courses/{courseId}/exams`, `POST exams/{examId}/attempts`, `GET exam-attempts/{id}`, `PUT exam-attempts/{id}/answers` (batch autosave), `POST exam-attempts/{id}/submit` |
| Assignments | Manage, publish, close; learner submissions with drafts and revisions; grading with feedback |
| Notes | Lesson notes (create, list, update, delete) and a course notes page |
| Class stream | Announcements, lesson questions and answers, votes, best answer, moderation |
| Operations | `GET /health/live`, `GET /health/ready`, `GET /metrics` (private) |

The exact request and response schemas are in the generated OpenAPI file; do not duplicate them here.

## Platform API (`backend/platform-api`)

Accounts (profile, policy acceptance), the product catalogue, and entitlements for the account portal. See its README and OpenAPI.

## Planned

| Area | Routes |
| --- | --- |
| Payments | `POST .../checkout`; provider-specific signed webhook routes, processed once |
| Chat | Authorized WebSocket events |
| AI | `POST .../ai/proposals`, `POST .../ai/proposals/{id}/confirm` (ADR-014) |
| Certificates | Issue and verify |

## Rules

- Specify schemas, pagination, idempotency keys, scopes, and examples before coding each module; cite FR IDs.
- Changes are backward compatible within a version (add fields, never remove or repurpose); a breaking change needs a new version ([versioning](API-VERSIONING.md)).
- Errors use stable codes ([error handling](ERROR-HANDLING.md)), for example `TRUST_LEVEL_REQUIRED`.
- Lists are paginated; writes that can repeat accept an idempotency key.
