# Logical data model

| Domain | Main entities | Ownership |
| --- | --- | --- |
| SaaS | Tenant, TenantDomain, TenantConfigVersion, TenantPlan, TenantMembership | Tenant registry and scoped membership |
| Education | Program, Course, CourseVersion, Section, Lesson, Recording | Tenant |
| Learning | Enrollment, Entitlement, LessonProgress, AssignmentSubmission, Certificate | Tenant and learner |
| Exam | Question, ExamBlueprint, ExamAttempt, ExamResult | Tenant |
| Community | DiscussionPost, ChatConversation, ChatMessage, Announcement | Tenant |
| Finance | Payment, Subscription, Refund, Payout, ProviderEvent | Tenant or platform billing ledger |
| Governance | AIJob, AuditEvent | Tenant or platform context |

Every tenant-owned row has an immutable `tenant_id`; cross-tenant foreign keys are rejected. Version published content and exam blueprints so historical results remain interpretable. Add explicit uniqueness and referential constraints before migrations are written.
