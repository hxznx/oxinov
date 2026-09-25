-- Class stream: course announcements (FR-COMM-702) and lesson Q&A with votes (FR-COMM-701).

-- CreateTable
CREATE TABLE "course_announcements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" TIMESTAMPTZ(3),
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "lesson_lineage_id" UUID NOT NULL,
    "lesson_title" VARCHAR(200) NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "accepted_answer_id" UUID,
    "hidden_at" TIMESTAMPTZ(3),
    "hidden_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" TIMESTAMPTZ(3),
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_answers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "hidden_at" TIMESTAMPTZ(3),
    "hidden_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" TIMESTAMPTZ(3),
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer_votes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "answer_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answer_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_announcements_tenant_id_course_id_created_at_idx" ON "course_announcements"("tenant_id", "course_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "course_announcements_tenant_id_id_key" ON "course_announcements"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "lesson_questions_tenant_id_course_id_lesson_lineage_id_idx" ON "lesson_questions"("tenant_id", "course_id", "lesson_lineage_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_questions_tenant_id_id_key" ON "lesson_questions"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "lesson_answers_tenant_id_question_id_idx" ON "lesson_answers"("tenant_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_answers_tenant_id_id_key" ON "lesson_answers"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "answer_votes_tenant_id_answer_id_user_id_key" ON "answer_votes"("tenant_id", "answer_id", "user_id");

-- AddForeignKey
ALTER TABLE "course_announcements" ADD CONSTRAINT "course_announcements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_announcements" ADD CONSTRAINT "course_announcements_tenant_id_course_id_fkey" FOREIGN KEY ("tenant_id", "course_id") REFERENCES "courses"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_announcements" ADD CONSTRAINT "course_announcements_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_questions" ADD CONSTRAINT "lesson_questions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_questions" ADD CONSTRAINT "lesson_questions_tenant_id_course_id_fkey" FOREIGN KEY ("tenant_id", "course_id") REFERENCES "courses"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_questions" ADD CONSTRAINT "lesson_questions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_answers" ADD CONSTRAINT "lesson_answers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_answers" ADD CONSTRAINT "lesson_answers_tenant_id_question_id_fkey" FOREIGN KEY ("tenant_id", "question_id") REFERENCES "lesson_questions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_answers" ADD CONSTRAINT "lesson_answers_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_votes" ADD CONSTRAINT "answer_votes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_votes" ADD CONSTRAINT "answer_votes_tenant_id_answer_id_fkey" FOREIGN KEY ("tenant_id", "answer_id") REFERENCES "lesson_answers"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_votes" ADD CONSTRAINT "answer_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



ALTER TABLE "course_announcements"
    ADD CONSTRAINT "course_announcements_body_length" CHECK (char_length(btrim("body")) BETWEEN 1 AND 5000);
ALTER TABLE "lesson_questions"
    ADD CONSTRAINT "lesson_questions_body_length" CHECK (char_length(btrim("body")) BETWEEN 1 AND 5000),
    ADD CONSTRAINT "lesson_questions_hidden_reason" CHECK (("hidden_at" IS NULL) = ("hidden_reason" IS NULL));
ALTER TABLE "lesson_answers"
    ADD CONSTRAINT "lesson_answers_body_length" CHECK (char_length(btrim("body")) BETWEEN 1 AND 5000),
    ADD CONSTRAINT "lesson_answers_hidden_reason" CHECK (("hidden_at" IS NULL) = ("hidden_reason" IS NULL));

-- Posts are hidden with a reason, never deleted; only votes are removed (undo).
GRANT SELECT, INSERT, UPDATE, DELETE ON "course_announcements" TO oxinov_app;
GRANT SELECT, INSERT, UPDATE ON "lesson_questions", "lesson_answers" TO oxinov_app;
GRANT SELECT, INSERT, DELETE ON "answer_votes" TO oxinov_app;

-- Row-level security: everyone in the school reads (the API checks course access); only staff
-- post announcements; people write as themselves and edit their own posts; staff moderate.
ALTER TABLE "course_announcements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "course_announcements" FORCE ROW LEVEL SECURITY;
CREATE POLICY "course_announcements_select" ON "course_announcements" FOR SELECT
    USING ("tenant_id" = app_current_tenant_id());
CREATE POLICY "course_announcements_insert" ON "course_announcements" FOR INSERT
    WITH CHECK ("tenant_id" = app_current_tenant_id() AND "author_id" = app_current_user_id() AND app_is_tenant_staff());
CREATE POLICY "course_announcements_update" ON "course_announcements" FOR UPDATE
    USING ("tenant_id" = app_current_tenant_id() AND app_is_tenant_staff())
    WITH CHECK ("tenant_id" = app_current_tenant_id() AND app_is_tenant_staff());
CREATE POLICY "course_announcements_delete" ON "course_announcements" FOR DELETE
    USING ("tenant_id" = app_current_tenant_id() AND app_is_tenant_staff());

ALTER TABLE "lesson_questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lesson_questions" FORCE ROW LEVEL SECURITY;
CREATE POLICY "lesson_questions_select" ON "lesson_questions" FOR SELECT
    USING ("tenant_id" = app_current_tenant_id());
CREATE POLICY "lesson_questions_insert" ON "lesson_questions" FOR INSERT
    WITH CHECK ("tenant_id" = app_current_tenant_id() AND "author_id" = app_current_user_id() AND "hidden_at" IS NULL AND "accepted_answer_id" IS NULL);
CREATE POLICY "lesson_questions_update" ON "lesson_questions" FOR UPDATE
    USING ("tenant_id" = app_current_tenant_id() AND ("author_id" = app_current_user_id() OR app_is_tenant_staff()))
    WITH CHECK ("tenant_id" = app_current_tenant_id() AND ("author_id" = app_current_user_id() OR app_is_tenant_staff()));

ALTER TABLE "lesson_answers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lesson_answers" FORCE ROW LEVEL SECURITY;
CREATE POLICY "lesson_answers_select" ON "lesson_answers" FOR SELECT
    USING ("tenant_id" = app_current_tenant_id());
CREATE POLICY "lesson_answers_insert" ON "lesson_answers" FOR INSERT
    WITH CHECK ("tenant_id" = app_current_tenant_id() AND "author_id" = app_current_user_id() AND "hidden_at" IS NULL);
CREATE POLICY "lesson_answers_update" ON "lesson_answers" FOR UPDATE
    USING ("tenant_id" = app_current_tenant_id() AND ("author_id" = app_current_user_id() OR app_is_tenant_staff()))
    WITH CHECK ("tenant_id" = app_current_tenant_id() AND ("author_id" = app_current_user_id() OR app_is_tenant_staff()));

ALTER TABLE "answer_votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "answer_votes" FORCE ROW LEVEL SECURITY;
CREATE POLICY "answer_votes_select" ON "answer_votes" FOR SELECT
    USING ("tenant_id" = app_current_tenant_id());
CREATE POLICY "answer_votes_insert" ON "answer_votes" FOR INSERT
    WITH CHECK ("tenant_id" = app_current_tenant_id() AND "user_id" = app_current_user_id());
CREATE POLICY "answer_votes_delete" ON "answer_votes" FOR DELETE
    USING ("tenant_id" = app_current_tenant_id() AND "user_id" = app_current_user_id());
