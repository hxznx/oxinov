# API contract

**Updated:** 2026-10-01. The NestJS APIs publish versioned OpenAPI; `pnpm --filter @oxinov/edu-api openapi` writes the Edu contract to `packages/contracts/openapi.json`. Web and mobile clients use the same documented API, and business rules never live only in a frontend. Every tenant route requires an authenticated membership and a resolved tenant context ([auth](api-auth.md)).

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

Today the APIs have no public host: browsers call the web apps, which call the APIs from the server with the person's token. A public API host (for mobile apps and partners) is added with its own rate limits and scopes when the first client needs it.

## Oxinov Edu API (`backend/products/edu-api`), all under `/v1/tenants/{tenantId}`

| Module | Routes (built) |
| --- | --- |
| Tenants and members | `GET /v1/tenants`, `POST /v1/tenants`, `GET /v1/tenants/{tenantId}`; invites (join codes): `POST/GET invites`, `DELETE invites/{id}`, `GET members`, `POST redeem` |
| Catalogue | `GET courses`, `GET courses/{courseId}`, `GET courses/{courseId}/lessons/{lessonId}` |
| Authoring | `GET authoring/courses`; course draft, sections, lessons, reordering, review, and publishing under `courses/{courseId}/draft` |
| Enrollment | `POST courses/{courseId}/enrollments`, `GET me/enrollments` |
| Media | `POST media/uploads` (presigned upload), `POST media/{id}/complete`, `PUT media/{id}/progress`, `GET media/library` (FR-COURSE-210; teachers and above: every YouTube, Google Drive, and upload item in published or draft versions with the lessons that use it; teachers see only their own offerings and uploads) |
| Quizzes (authoring) | `GET/POST courses/{courseId}/quizzes`, `GET/PATCH quizzes/{id}`, sections and questions, publish, close, copy |
| Exams (taking) | `GET courses/{courseId}/exams`, `POST exams/{examId}/attempts`, `GET exam-attempts/{id}`, `PUT exam-attempts/{id}/answers` (batch autosave), `POST exam-attempts/{id}/submit` |
| Assignments | Manage, publish, close; learner submissions with drafts and revisions; grading with feedback |
| Notes | Lesson notes (create, list, update, delete) and a course notes page |
| Class stream | Announcements, lesson questions and answers, votes, best answer, moderation |
| Store (ADR-028) | Learner: `GET me/subscriptions` (own access per course: plan, price paid, status, end date or lifetime), `GET me/bank-payments` (own, newest first), `GET courses/{courseId}/plans` (plans on sale, bank details, access, open payment), `POST courses/{courseId}/checkout/bank-qr`, `GET me/bank-payments/{id}`, `POST me/bank-payments/{id}/evidence-upload`, `POST me/bank-payments/{id}/submit` (`bankTransactionId`, optional `paidAmount` in NPR and `referenceIncluded`). Administrator: `GET store/payments`, `GET store/payments/{id}`, `POST store/payments/{id}/approve`, `POST store/payments/{id}/reject`; owner: `GET/PUT courses/{courseId}/plans(/manage)`, `GET/PATCH store/settings`, `POST store/settings/qr-upload`, `POST store/settings/qr-complete`, `GET/POST store/coupons`, `PATCH store/coupons/{id}`; administrator: `PUT courses/{courseId}/listing` (kind and store category). Public, outside the tenant path: `GET /v1/store` (adds `upcomingLive`: the next three live classes of published offerings, times and titles only) and `GET /v1/store/offerings/{slug}` (no sign-in; titles, syllabus outline, plans, and checkout policy only), and `POST /v1/store/join` (signed in; becomes a learner of the seller workspace, 201 or 200) |
| Notifications (FR-COMM-704) | `GET me/notifications` (own, newest 50, unread count), `POST me/notifications/read-all` and `POST me/notifications/{id}/read` (204; another person's is 404), `POST notices` (administrators; in-app notice to every active member except the sender, or with `courseId` only to that offering's enrolled learners; `linkPath` must be a path inside Edu; `email: true` in the store workspace also emails it within the daily allowance and returns `emailedNow` and `emailWaiting`), `GET notices/email-allowance` (administrators; `limit`, `used`, `remaining`, `emailAvailable`). Payment review items carry `checks` with `level` `ok`, `warn`, or `block` (FR-MGMT-1405); approving a payment with a `block` check returns 409. |
| Messages (FR-CHAT-1301, FR-AI-1705) | Learner: `GET me/support` (own thread; clears the unread marker), `GET me/support/unread`, `POST me/support` (`body` 1 to 4,000 characters; 409 after 20 in an hour). Administrators: `GET support/threads`, `GET support/threads/{id}` (marks read), `POST support/threads/{id}/messages` (notifies the learner). Outside the tenant path, signed in: `POST /v1/oxi/ask` (`question`; returns `reply`, up to three `picks` from the store's published offerings, and `handoff`). |
| Reviews (FR-CATALOG-304) | `GET/PUT/DELETE courses/{courseId}/review` (own review; `canReview` only after having had access; a save returns it to `PENDING`), administrators: `GET store/reviews?status=PENDING|APPROVED|HIDDEN`, `POST store/reviews/{id}/approve`, `POST store/reviews/{id}/hide` (required private `reason`), both 204. The public offering adds `rating` (average, count, stars) and the newest 10 approved `reviews`; store cards add `ratingAverage` and `ratingCount`. |
| Free access (FR-MGMT-1404) | `GET store/grants` (newest 50), `POST store/grants` (`email` of a member, `courseId`, `length` DAYS_7 to LIFETIME, required `reason`), `POST store/grants/{id}/revoke` (required `reason`); administrators only. |
| Team (FR-MGMT-1406) | `PATCH members/{userId}` (`role` and or `status`; owners for administrators and owners, administrators for learners and teachers; never yourself; an active owner always remains) and `GET audit-events` (administrators; newest 100 with the actor's name). |
| Account (FR-AUTH-104) | `GET /v1/me` (outside the tenant path; the caller's own display name, email, member-since date, and unread notifications across workspaces); `GET /v1/me/export` (FR-PRIV-3201: the caller's Edu data across workspaces); `GET/POST/DELETE /v1/me/deletion` (FR-PRIV-3202: status; schedule in 14 days with `confirm: "DELETE"`, 409 for a workspace owner or a wrong word; cancel, 404 when nothing is scheduled). |
| Fast course building (FR-COURSE-209) | `POST courses/{courseId}/draft/sections/{sectionId}/lessons/bulk` (`text`: one link per line with an optional title, up to 100; `driveKind` DOCUMENT or VIDEO; 200 with `draft`, `created`, and `refused` lines with reasons), `POST courses/{courseId}/duplicate` (optional `title`; 201 with the new draft course's `courseId`, `slug`, and `title`). Instructors for their own courses, administrators for any. |
| Live classes and external lessons (ADR-028) | `GET courses/{courseId}/live-sessions` (members; `joinUrl` only for authors, free classes, or learners with access), `POST courses/{courseId}/live-sessions` and `PATCH live-sessions/{id}` (instructors and administrators; `cancelled: true` cancels). Lesson authoring accepts `externalUrl` (YouTube or Google Drive; `null` removes) and the `DOCUMENT` kind; the learner lesson response adds `external` (`source`, view-only `embedUrl`) and `watermark` after the access check. |
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
- Changes are backward compatible within a version (add fields, never remove or repurpose); a breaking change needs a new version ([versioning](api-versioning.md)).
- Errors use stable codes ([error handling](api-errors.md)), for example `TRUST_LEVEL_REQUIRED`.
- Lists are paginated; writes that can repeat accept an idempotency key.
