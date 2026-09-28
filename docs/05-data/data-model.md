# Logical data model

**Updated:** 2026-09-26 from the Prisma schemas (`database/products/edu/prisma/schema.prisma`, `database/platform/prisma/schema.prisma`). Each plane has its own database; no product reads another's (ADR-008).

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

## Platform database (`database/platform`)

| Domain | Entities | Ownership |
| --- | --- | --- |
| Account | UserAccount | Owner (one Oxinov account per person, linked to the Keycloak subject) |
| Policies | Policy, PolicyAcceptance | Platform; acceptance per account and version |
| Products | Product, Entitlement | Platform catalogue; entitlement per account and product |
| Governance | AuditEvent | Platform |

Isolation: owner-scoped rows with row-level security (`20260924100200_owner_isolation`).

## Oxinov Edu database (`database/products/edu`)

| Domain | Entities (built) | Planned |
| --- | --- | --- |
| Tenancy | Tenant, TenantMembership, TenantInvite (join codes), UserProfile | TenantDomain, TenantConfigVersion, TenantPlan |
| Courses | Program, Course, CourseVersion, Section, Lesson | Course review history |
| Media and resources | MediaAsset, MediaProgress, ResourceFile, LessonResource | Transcoding renditions (ADR-021) |
| Learning | Enrollment, Entitlement, LessonNote | LessonProgress for text lessons, Certificate |
| Assessment | Question, ExamBlueprint, ExamBlueprintSection, ExamAttempt, ExamAttemptItem, ExamResult, Assignment, AssignmentSubmission, SubmissionRevision | Result revisions |
| Community | CourseAnnouncement, LessonQuestion, LessonAnswer, AnswerVote | ChatConversation, ChatMessage |
| Finance | Payment, ProviderEvent | Subscription, Refund, Payout (with the payment provider decision) |
| Governance | AuditEvent | AIJob |

## Rules

- Every tenant-owned row carries an immutable `tenant_id`; composite foreign keys include it so a row can never point into another tenant. Row-level security enforces it for the request role (`20260924000200_tenant_isolation`, tested by `policies/tenant_isolation_test.sql`).
- Published content and exam blueprints are versioned so past results stay interpretable.
- Money is integer minor units plus an ISO currency; timestamps are UTC.
- A provider event ID is unique and processed once.
- Schema changes are forward-only migrations that stay compatible with the previous release (expand, then contract; [rollback](../10-devops/rollback.md)).

See [database design](database-design.md), [ERD](../02-products/edu/edu-erd.md), and [migration strategy](migration-strategy.md).
