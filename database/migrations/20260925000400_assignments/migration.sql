-- Assignments (FR-ASSESS-503): course work, each learner's submission with a private draft, and every
-- submitted revision with the teacher's decision. See backend/api/src/assignments/.

-- CreateEnum
CREATE TYPE "assignment_status" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "submission_status" AS ENUM ('DRAFT', 'SUBMITTED', 'REVISION_REQUESTED', 'PASSED', 'FAILED');

-- CreateTable
CREATE TABLE "assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "instructions" TEXT NOT NULL DEFAULT '',
    "status" "assignment_status" NOT NULL DEFAULT 'DRAFT',
    "due_at" TIMESTAMPTZ(3),
    "allow_late" BOOLEAN NOT NULL DEFAULT false,
    "accept_file" BOOLEAN NOT NULL DEFAULT true,
    "accept_url" BOOLEAN NOT NULL DEFAULT false,
    "accept_text" BOOLEAN NOT NULL DEFAULT true,
    "max_file_mb" INTEGER NOT NULL DEFAULT 25,
    "max_points" INTEGER,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "submission_status" NOT NULL DEFAULT 'DRAFT',
    "draft_text" TEXT NOT NULL DEFAULT '',
    "draft_url" VARCHAR(2000),
    "draft_file_key" VARCHAR(400),
    "draft_file_name" VARCHAR(255),
    "draft_content_type" VARCHAR(120),
    "draft_size_bytes" BIGINT,
    "pending_file_key" VARCHAR(400),
    "pending_file_name" VARCHAR(255),
    "pending_type" VARCHAR(120),
    "pending_size_bytes" BIGINT,
    "revision_count" INTEGER NOT NULL DEFAULT 0,
    "last_submitted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_revisions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "revision" INTEGER NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "url" VARCHAR(2000),
    "file_key" VARCHAR(400),
    "file_name" VARCHAR(255),
    "content_type" VARCHAR(120),
    "size_bytes" BIGINT,
    "submitted_at" TIMESTAMPTZ(3) NOT NULL,
    "late" BOOLEAN NOT NULL DEFAULT false,
    "outcome" "submission_status",
    "feedback" TEXT,
    "score" INTEGER,
    "graded_by_user_id" UUID,
    "graded_at" TIMESTAMPTZ(3),

    CONSTRAINT "submission_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assignments_tenant_id_course_id_idx" ON "assignments"("tenant_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "assignments_tenant_id_id_key" ON "assignments"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_submissions_tenant_id_id_key" ON "assignment_submissions"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_submissions_tenant_id_assignment_id_user_id_key" ON "assignment_submissions"("tenant_id", "assignment_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "submission_revisions_tenant_id_id_key" ON "submission_revisions"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "submission_revisions_tenant_id_submission_id_revision_key" ON "submission_revisions"("tenant_id", "submission_id", "revision");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_tenant_id_course_id_fkey" FOREIGN KEY ("tenant_id", "course_id") REFERENCES "courses"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_tenant_id_assignment_id_fkey" FOREIGN KEY ("tenant_id", "assignment_id") REFERENCES "assignments"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_revisions" ADD CONSTRAINT "submission_revisions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_revisions" ADD CONSTRAINT "submission_revisions_tenant_id_submission_id_fkey" FOREIGN KEY ("tenant_id", "submission_id") REFERENCES "assignment_submissions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_revisions" ADD CONSTRAINT "submission_revisions_graded_by_user_id_fkey" FOREIGN KEY ("graded_by_user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Integrity.
ALTER TABLE "assignments"
    ADD CONSTRAINT "assignments_max_file_mb_range" CHECK ("max_file_mb" BETWEEN 1 AND 100),
    ADD CONSTRAINT "assignments_max_points_positive" CHECK ("max_points" IS NULL OR "max_points" > 0),
    ADD CONSTRAINT "assignments_accepts_something" CHECK ("accept_file" OR "accept_url" OR "accept_text");
ALTER TABLE "assignment_submissions"
    ADD CONSTRAINT "assignment_submissions_revision_count" CHECK ("revision_count" >= 0);
ALTER TABLE "submission_revisions"
    ADD CONSTRAINT "submission_revisions_positive" CHECK ("revision" > 0),
    ADD CONSTRAINT "submission_revisions_score" CHECK ("score" IS NULL OR "score" >= 0),
    ADD CONSTRAINT "submission_revisions_outcome" CHECK ("outcome" IS NULL OR "outcome" IN ('PASSED', 'FAILED', 'REVISION_REQUESTED'));

-- True when the caller teaches or administers the active tenant.
CREATE FUNCTION app_is_tenant_staff() RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
        SELECT EXISTS (
            SELECT 1 FROM "tenant_memberships" m
            WHERE m."tenant_id" = app_current_tenant_id()
              AND m."user_id" = app_current_user_id()
              AND m."status" = 'ACTIVE'
              AND m."role" IN ('INSTRUCTOR', 'ADMIN', 'OWNER')
        )
    $$;
GRANT EXECUTE ON FUNCTION app_is_tenant_staff() TO oxinov_app;

GRANT SELECT, INSERT, UPDATE ON "assignments", "assignment_submissions", "submission_revisions" TO oxinov_app;

-- Row-level security. Assignments belong to their tenant. A learner reads and writes only their own
-- submission and revisions; teaching staff of the tenant read them and record grades. Learners can
-- never change a revision after submitting it, so feedback and grades cannot be altered by them.
ALTER TABLE "assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assignments" FORCE ROW LEVEL SECURITY;
CREATE POLICY "assignments_tenant_isolation" ON "assignments" FOR ALL
    USING ("tenant_id" = app_current_tenant_id())
    WITH CHECK ("tenant_id" = app_current_tenant_id());

ALTER TABLE "assignment_submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assignment_submissions" FORCE ROW LEVEL SECURITY;
CREATE POLICY "assignment_submissions_select" ON "assignment_submissions" FOR SELECT
    USING ("tenant_id" = app_current_tenant_id() AND ("user_id" = app_current_user_id() OR app_is_tenant_staff()));
CREATE POLICY "assignment_submissions_insert" ON "assignment_submissions" FOR INSERT
    WITH CHECK ("tenant_id" = app_current_tenant_id() AND "user_id" = app_current_user_id());
CREATE POLICY "assignment_submissions_update" ON "assignment_submissions" FOR UPDATE
    USING ("tenant_id" = app_current_tenant_id() AND ("user_id" = app_current_user_id() OR app_is_tenant_staff()))
    WITH CHECK ("tenant_id" = app_current_tenant_id() AND ("user_id" = app_current_user_id() OR app_is_tenant_staff()));

ALTER TABLE "submission_revisions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "submission_revisions" FORCE ROW LEVEL SECURITY;
CREATE POLICY "submission_revisions_select" ON "submission_revisions" FOR SELECT
    USING ("tenant_id" = app_current_tenant_id() AND ("user_id" = app_current_user_id() OR app_is_tenant_staff()));
CREATE POLICY "submission_revisions_insert" ON "submission_revisions" FOR INSERT
    WITH CHECK ("tenant_id" = app_current_tenant_id() AND "user_id" = app_current_user_id() AND "outcome" IS NULL AND "feedback" IS NULL AND "score" IS NULL);
CREATE POLICY "submission_revisions_grade" ON "submission_revisions" FOR UPDATE
    USING ("tenant_id" = app_current_tenant_id() AND app_is_tenant_staff())
    WITH CHECK ("tenant_id" = app_current_tenant_id() AND app_is_tenant_staff());
