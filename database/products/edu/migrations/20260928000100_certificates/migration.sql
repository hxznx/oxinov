-- Lesson completion and course certificates (FR-PLAYER-402, FR-CERT-601, FR-CERT-602).

-- Text lessons are completed by the learner's confirmation. Completion follows the lesson lineage, so it
-- survives republished course versions. (Video and audio completion is media_progress.completed_at.)
CREATE TABLE "lesson_completions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "lesson_lineage_id" UUID NOT NULL,
    "completed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_completions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "lesson_completions_tenant_id_id_key" ON "lesson_completions"("tenant_id", "id");
CREATE UNIQUE INDEX "lesson_completions_tenant_id_user_id_lesson_lineage_id_key" ON "lesson_completions"("tenant_id", "user_id", "lesson_lineage_id");
CREATE INDEX "lesson_completions_tenant_id_user_id_course_id_idx" ON "lesson_completions"("tenant_id", "user_id", "course_id");
ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_tenant_id_course_id_fkey" FOREIGN KEY ("tenant_id", "course_id") REFERENCES "courses"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- One certificate per learner and course. `code` is the unguessable public ID used in /verify/{code}; the
-- name, course, and teacher are copied at issue so later edits do not rewrite an issued certificate.
CREATE TABLE "certificates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "code" VARCHAR(16) NOT NULL,
    "holder_name" VARCHAR(120) NOT NULL,
    "course_title" VARCHAR(200) NOT NULL,
    "instructor_name" VARCHAR(120),
    "issued_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(3),
    "revoke_reason" VARCHAR(500),
    "revoked_by_user_id" UUID,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "certificates_tenant_id_id_key" ON "certificates"("tenant_id", "id");
CREATE UNIQUE INDEX "certificates_code_key" ON "certificates"("code");
CREATE UNIQUE INDEX "certificates_tenant_id_user_id_course_id_key" ON "certificates"("tenant_id", "user_id", "course_id");
CREATE INDEX "certificates_tenant_id_course_id_idx" ON "certificates"("tenant_id", "course_id");
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_revoked_by_user_id_fkey" FOREIGN KEY ("revoked_by_user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_tenant_id_course_id_fkey" FOREIGN KEY ("tenant_id", "course_id") REFERENCES "courses"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "certificates"
    ADD CONSTRAINT "certificates_code_format" CHECK ("code" ~ '^[A-HJKMNP-Z2-9]{16}$'),
    ADD CONSTRAINT "certificates_revocation" CHECK (("revoked_at" IS NULL) = ("revoke_reason" IS NULL));

-- What /verify/{code} may show, and nothing else (FR-CERT-602): no account, email, or tenant IDs. It has no
-- row-level security because verification has no signed-in person or tenant; it is written only in the same
-- transaction as the certificate it mirrors, and read only by exact code.
CREATE TABLE "certificate_verifications" (
    "code" VARCHAR(16) NOT NULL,
    "holder_name" VARCHAR(120) NOT NULL,
    "course_title" VARCHAR(200) NOT NULL,
    "school_name" VARCHAR(120) NOT NULL,
    "issued_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),

    CONSTRAINT "certificate_verifications_pkey" PRIMARY KEY ("code")
);
ALTER TABLE "certificate_verifications" ADD CONSTRAINT "certificate_verifications_code_fkey" FOREIGN KEY ("code") REFERENCES "certificates"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

GRANT SELECT, INSERT, DELETE ON "lesson_completions" TO oxinov_app;
GRANT SELECT, INSERT, UPDATE ON "certificates", "certificate_verifications" TO oxinov_app;

-- Completions: the learner records their own; the school's teaching staff may read them for progress.
ALTER TABLE "lesson_completions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lesson_completions" FORCE ROW LEVEL SECURITY;
CREATE POLICY "lesson_completions_select" ON "lesson_completions" FOR SELECT
    USING ("tenant_id" = app_current_tenant_id() AND ("user_id" = app_current_user_id() OR app_is_tenant_staff()));
CREATE POLICY "lesson_completions_insert" ON "lesson_completions" FOR INSERT
    WITH CHECK ("tenant_id" = app_current_tenant_id() AND "user_id" = app_current_user_id());
CREATE POLICY "lesson_completions_delete" ON "lesson_completions" FOR DELETE
    USING ("tenant_id" = app_current_tenant_id() AND "user_id" = app_current_user_id());

-- Certificates: issued to the learner themself; readable by the holder and the school's staff; only staff
-- change them (revocation, which the API limits to administrators).
ALTER TABLE "certificates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "certificates" FORCE ROW LEVEL SECURITY;
CREATE POLICY "certificates_select" ON "certificates" FOR SELECT
    USING ("tenant_id" = app_current_tenant_id() AND ("user_id" = app_current_user_id() OR app_is_tenant_staff()));
CREATE POLICY "certificates_insert" ON "certificates" FOR INSERT
    WITH CHECK ("tenant_id" = app_current_tenant_id() AND "user_id" = app_current_user_id());
CREATE POLICY "certificates_update" ON "certificates" FOR UPDATE
    USING ("tenant_id" = app_current_tenant_id() AND app_is_tenant_staff())
    WITH CHECK ("tenant_id" = app_current_tenant_id() AND app_is_tenant_staff());
