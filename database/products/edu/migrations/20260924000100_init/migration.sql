-- Oxinov LMS initial schema. Mirrors database/prisma/schema.prisma.
-- Tenant-owned tables use composite (tenant_id, id) keys so foreign keys cannot cross tenants.

-- CreateEnum
CREATE TYPE "tenant_status" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELED');
CREATE TYPE "tenant_role" AS ENUM ('OWNER', 'ADMIN', 'INSTRUCTOR', 'LEARNER');
CREATE TYPE "membership_status" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "program_kind" AS ENUM ('JLPT', 'SSW', 'LANGUAGE', 'IT', 'OTHER');
CREATE TYPE "course_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "course_version_status" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'SUPERSEDED');
CREATE TYPE "lesson_kind" AS ENUM ('VIDEO', 'AUDIO', 'TEXT');
CREATE TYPE "enrollment_status" AS ENUM ('ACTIVE', 'REVOKED');
CREATE TYPE "entitlement_source" AS ENUM ('FREE', 'PURCHASE', 'SUBSCRIPTION', 'ADMIN_GRANT');
CREATE TYPE "payment_provider" AS ENUM ('STRIPE', 'GOOGLE_PLAY', 'APP_STORE');
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');
CREATE TYPE "question_type" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK');
CREATE TYPE "question_status" AS ENUM ('ACTIVE', 'RETIRED');
CREATE TYPE "blueprint_kind" AS ENUM ('PRACTICE', 'MOCK');
CREATE TYPE "blueprint_status" AS ENUM ('DRAFT', 'APPROVED', 'RETIRED');
CREATE TYPE "answer_release" AS ENUM ('AFTER_SUBMIT', 'NEVER');
CREATE TYPE "attempt_status" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(63) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "status" "tenant_status" NOT NULL DEFAULT 'TRIAL',
    "default_locale" VARCHAR(16) NOT NULL DEFAULT 'en',
    "time_zone" VARCHAR(64) NOT NULL DEFAULT 'UTC',
    "primary_color" VARCHAR(7),
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "auth_subject" VARCHAR(255) NOT NULL,
    "email" VARCHAR(320),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "display_name" VARCHAR(120),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tenant_memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "tenant_role" NOT NULL,
    "status" "membership_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_memberships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "programs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "kind" "program_kind" NOT NULL,
    "language" VARCHAR(16),
    "level" VARCHAR(40),
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "courses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "program_id" UUID,
    "slug" VARCHAR(120) NOT NULL,
    "status" "course_status" NOT NULL DEFAULT 'DRAFT',
    "published_version_id" UUID,
    "price_minor" INTEGER NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "course_version_status" NOT NULL DEFAULT 'DRAFT',
    "title" VARCHAR(200) NOT NULL,
    "summary" VARCHAR(500) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "language" VARCHAR(16) NOT NULL,
    "outcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "published_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "course_version_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lessons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "kind" "lesson_kind" NOT NULL,
    "position" INTEGER NOT NULL,
    "body_markdown" TEXT NOT NULL DEFAULT '',
    "is_preview" BOOLEAN NOT NULL DEFAULT false,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "duration_sec" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "enrollments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "status" "enrollment_status" NOT NULL DEFAULT 'ACTIVE',
    "enrolled_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(3),

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "entitlements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "source" "entitlement_source" NOT NULL,
    "payment_id" UUID,
    "starts_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),
    "revoke_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "provider" "payment_provider" NOT NULL,
    "provider_payment_id" VARCHAR(255) NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "provider_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider" "payment_provider" NOT NULL,
    "provider_event_id" VARCHAR(255) NOT NULL,
    "event_type" VARCHAR(120) NOT NULL,
    "tenant_id" UUID,
    "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(3),

    CONSTRAINT "provider_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "section_key" VARCHAR(40) NOT NULL,
    "topic" VARCHAR(80),
    "difficulty" SMALLINT NOT NULL DEFAULT 1,
    "type" "question_type" NOT NULL,
    "status" "question_status" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "prompt" TEXT NOT NULL,
    "passage" TEXT,
    "choices" JSONB NOT NULL DEFAULT '[]',
    "answer_key" JSONB NOT NULL,
    "explanation" TEXT,
    "marks" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exam_blueprints" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "kind" "blueprint_kind" NOT NULL,
    "status" "blueprint_status" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "time_limit_sec" INTEGER NOT NULL,
    "pass_percent" SMALLINT NOT NULL,
    "max_attempts" INTEGER,
    "answer_release" "answer_release" NOT NULL DEFAULT 'AFTER_SUBMIT',
    "shuffle_questions" BOOLEAN NOT NULL DEFAULT true,
    "approved_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_blueprints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exam_blueprint_sections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "blueprint_id" UUID NOT NULL,
    "section_key" VARCHAR(40) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "position" INTEGER NOT NULL,
    "question_count" INTEGER NOT NULL,

    CONSTRAINT "exam_blueprint_sections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exam_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "blueprint_id" UUID NOT NULL,
    "blueprint_version" INTEGER NOT NULL,
    "user_id" UUID NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "status" "attempt_status" NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline_at" TIMESTAMPTZ(3) NOT NULL,
    "submitted_at" TIMESTAMPTZ(3),

    CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exam_attempt_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "section_key" VARCHAR(40) NOT NULL,
    "position" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "answer_key" JSONB NOT NULL,
    "explanation" TEXT,
    "response" JSONB,
    "answered_at" TIMESTAMPTZ(3),
    "is_correct" BOOLEAN,
    "marks_awarded" INTEGER,

    CONSTRAINT "exam_attempt_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exam_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "score" INTEGER NOT NULL,
    "max_score" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "section_breakdown" JSONB NOT NULL,
    "reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" VARCHAR(120) NOT NULL,
    "target_type" VARCHAR(80) NOT NULL,
    "target_id" UUID,
    "reason" VARCHAR(500),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
CREATE UNIQUE INDEX "user_profiles_auth_subject_key" ON "user_profiles"("auth_subject");
CREATE INDEX "tenant_memberships_user_id_idx" ON "tenant_memberships"("user_id");
CREATE UNIQUE INDEX "tenant_memberships_tenant_id_id_key" ON "tenant_memberships"("tenant_id", "id");
CREATE UNIQUE INDEX "tenant_memberships_tenant_id_user_id_key" ON "tenant_memberships"("tenant_id", "user_id");
CREATE UNIQUE INDEX "programs_tenant_id_id_key" ON "programs"("tenant_id", "id");
CREATE UNIQUE INDEX "programs_tenant_id_slug_key" ON "programs"("tenant_id", "slug");
CREATE INDEX "courses_tenant_id_status_idx" ON "courses"("tenant_id", "status");
CREATE UNIQUE INDEX "courses_tenant_id_id_key" ON "courses"("tenant_id", "id");
CREATE UNIQUE INDEX "courses_tenant_id_slug_key" ON "courses"("tenant_id", "slug");
CREATE UNIQUE INDEX "courses_tenant_id_published_version_id_key" ON "courses"("tenant_id", "published_version_id");
CREATE UNIQUE INDEX "course_versions_tenant_id_id_key" ON "course_versions"("tenant_id", "id");
CREATE UNIQUE INDEX "course_versions_tenant_id_course_id_version_key" ON "course_versions"("tenant_id", "course_id", "version");
CREATE UNIQUE INDEX "sections_tenant_id_id_key" ON "sections"("tenant_id", "id");
CREATE UNIQUE INDEX "sections_tenant_id_course_version_id_position_key" ON "sections"("tenant_id", "course_version_id", "position");
CREATE UNIQUE INDEX "lessons_tenant_id_id_key" ON "lessons"("tenant_id", "id");
CREATE UNIQUE INDEX "lessons_tenant_id_section_id_position_key" ON "lessons"("tenant_id", "section_id", "position");
CREATE INDEX "enrollments_tenant_id_user_id_idx" ON "enrollments"("tenant_id", "user_id");
CREATE UNIQUE INDEX "enrollments_tenant_id_id_key" ON "enrollments"("tenant_id", "id");
CREATE INDEX "entitlements_tenant_id_user_id_course_id_idx" ON "entitlements"("tenant_id", "user_id", "course_id");
CREATE UNIQUE INDEX "entitlements_tenant_id_id_key" ON "entitlements"("tenant_id", "id");
CREATE UNIQUE INDEX "entitlements_tenant_id_payment_id_key" ON "entitlements"("tenant_id", "payment_id");
CREATE UNIQUE INDEX "payments_tenant_id_id_key" ON "payments"("tenant_id", "id");
CREATE UNIQUE INDEX "payments_provider_provider_payment_id_key" ON "payments"("provider", "provider_payment_id");
CREATE UNIQUE INDEX "provider_events_provider_provider_event_id_key" ON "provider_events"("provider", "provider_event_id");
CREATE INDEX "questions_tenant_id_program_id_section_key_status_idx" ON "questions"("tenant_id", "program_id", "section_key", "status");
CREATE UNIQUE INDEX "questions_tenant_id_id_key" ON "questions"("tenant_id", "id");
CREATE INDEX "exam_blueprints_tenant_id_course_id_idx" ON "exam_blueprints"("tenant_id", "course_id");
CREATE UNIQUE INDEX "exam_blueprints_tenant_id_id_key" ON "exam_blueprints"("tenant_id", "id");
CREATE UNIQUE INDEX "exam_blueprint_sections_tenant_id_id_key" ON "exam_blueprint_sections"("tenant_id", "id");
CREATE UNIQUE INDEX "exam_blueprint_sections_tenant_id_blueprint_id_section_key_key" ON "exam_blueprint_sections"("tenant_id", "blueprint_id", "section_key");
CREATE UNIQUE INDEX "exam_attempts_tenant_id_id_key" ON "exam_attempts"("tenant_id", "id");
CREATE UNIQUE INDEX "exam_attempts_tenant_id_blueprint_id_user_id_attempt_number_key" ON "exam_attempts"("tenant_id", "blueprint_id", "user_id", "attempt_number");
CREATE UNIQUE INDEX "exam_attempt_items_tenant_id_id_key" ON "exam_attempt_items"("tenant_id", "id");
CREATE UNIQUE INDEX "exam_attempt_items_tenant_id_attempt_id_position_key" ON "exam_attempt_items"("tenant_id", "attempt_id", "position");
CREATE UNIQUE INDEX "exam_results_tenant_id_id_key" ON "exam_results"("tenant_id", "id");
CREATE UNIQUE INDEX "exam_results_tenant_id_attempt_id_revision_key" ON "exam_results"("tenant_id", "attempt_id", "revision");
CREATE INDEX "audit_events_tenant_id_created_at_idx" ON "audit_events"("tenant_id", "created_at");

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "programs" ADD CONSTRAINT "programs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "courses" ADD CONSTRAINT "courses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "courses" ADD CONSTRAINT "courses_tenant_id_program_id_fkey" FOREIGN KEY ("tenant_id", "program_id") REFERENCES "programs"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "courses" ADD CONSTRAINT "courses_tenant_id_published_version_id_fkey" FOREIGN KEY ("tenant_id", "published_version_id") REFERENCES "course_versions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "courses" ADD CONSTRAINT "courses_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "course_versions" ADD CONSTRAINT "course_versions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "course_versions" ADD CONSTRAINT "course_versions_tenant_id_course_id_fkey" FOREIGN KEY ("tenant_id", "course_id") REFERENCES "courses"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sections" ADD CONSTRAINT "sections_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sections" ADD CONSTRAINT "sections_tenant_id_course_version_id_fkey" FOREIGN KEY ("tenant_id", "course_version_id") REFERENCES "course_versions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_tenant_id_section_id_fkey" FOREIGN KEY ("tenant_id", "section_id") REFERENCES "sections"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_tenant_id_course_id_fkey" FOREIGN KEY ("tenant_id", "course_id") REFERENCES "courses"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_tenant_id_course_id_fkey" FOREIGN KEY ("tenant_id", "course_id") REFERENCES "courses"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_tenant_id_enrollment_id_fkey" FOREIGN KEY ("tenant_id", "enrollment_id") REFERENCES "enrollments"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_tenant_id_payment_id_fkey" FOREIGN KEY ("tenant_id", "payment_id") REFERENCES "payments"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_course_id_fkey" FOREIGN KEY ("tenant_id", "course_id") REFERENCES "courses"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_tenant_id_program_id_fkey" FOREIGN KEY ("tenant_id", "program_id") REFERENCES "programs"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exam_blueprints" ADD CONSTRAINT "exam_blueprints_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exam_blueprints" ADD CONSTRAINT "exam_blueprints_tenant_id_program_id_fkey" FOREIGN KEY ("tenant_id", "program_id") REFERENCES "programs"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exam_blueprints" ADD CONSTRAINT "exam_blueprints_tenant_id_course_id_fkey" FOREIGN KEY ("tenant_id", "course_id") REFERENCES "courses"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exam_blueprint_sections" ADD CONSTRAINT "exam_blueprint_sections_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exam_blueprint_sections" ADD CONSTRAINT "exam_blueprint_sections_tenant_id_blueprint_id_fkey" FOREIGN KEY ("tenant_id", "blueprint_id") REFERENCES "exam_blueprints"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_tenant_id_blueprint_id_fkey" FOREIGN KEY ("tenant_id", "blueprint_id") REFERENCES "exam_blueprints"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exam_attempt_items" ADD CONSTRAINT "exam_attempt_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exam_attempt_items" ADD CONSTRAINT "exam_attempt_items_tenant_id_attempt_id_fkey" FOREIGN KEY ("tenant_id", "attempt_id") REFERENCES "exam_attempts"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exam_attempt_items" ADD CONSTRAINT "exam_attempt_items_tenant_id_question_id_fkey" FOREIGN KEY ("tenant_id", "question_id") REFERENCES "questions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_tenant_id_attempt_id_fkey" FOREIGN KEY ("tenant_id", "attempt_id") REFERENCES "exam_attempts"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
