# API contract

The NestJS backend publishes versioned OpenAPI. Web and mobile clients use the same documented API; business rules do not live only in the frontend. All tenant endpoints require an authenticated membership and resolved tenant context.

| Area | Planned routes |
| --- | --- |
| Tenants | `GET /v1/tenants`, `POST /v1/tenants`, `GET/PATCH /v1/tenants/{tenantId}` |
| Catalog | `GET /v1/tenants/{tenantId}/courses`, `GET /v1/tenants/{tenantId}/courses/{courseId}` |
| Learning | `POST /v1/.../enrollments`, `PUT /v1/.../lessons/{lessonId}/progress` |
| Exams | `POST /v1/.../exam-attempts`, `PUT /v1/.../exam-attempts/{id}/answers`, `POST /v1/.../submit` |
| Chat | `GET/POST /v1/.../conversations`; authorized WebSocket events |
| Payments | `POST /v1/.../checkout`; provider-specific signed webhook routes |
| AI | `POST /v1/.../ai/proposals`, `POST /v1/.../ai/proposals/{id}/confirm` |

Implemented in `backend/products/lms-api` (see its README): tenants (list, create, get), catalog (list, get, create draft, lesson content), free-course enrollment and `GET /v1/tenants/{tenantId}/me/enrollments`, and exams (`GET .../courses/{courseId}/exams`, `POST .../exams/{examId}/attempts`, `GET .../exam-attempts/{id}`, `PUT .../exam-attempts/{id}/answers` taking a batch, `POST .../exam-attempts/{id}/submit`). `pnpm --filter @oxinov/lms-api openapi` writes the generated contract to `packages/contracts/openapi.json`. Other routes are design candidates. Specify request/response schemas, pagination, idempotency keys, scopes, and examples before coding each module. [Auth](AUTH.md), [errors](ERROR-HANDLING.md), and [versioning](API-VERSIONING.md) are normative.
