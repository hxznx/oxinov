-- Personal lesson notes (FR-PLAYER-403) and a stable lesson lineage across course versions, so notes stay
-- with a lesson when its course is republished.

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "lineage_id" UUID NOT NULL DEFAULT gen_random_uuid();

-- CreateTable
CREATE TABLE "lesson_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "lesson_lineage_id" UUID NOT NULL,
    "lesson_title" VARCHAR(200) NOT NULL,
    "timestamp_sec" INTEGER,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lesson_notes_tenant_id_user_id_course_id_lesson_lineage_id_idx" ON "lesson_notes"("tenant_id", "user_id", "course_id", "lesson_lineage_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_notes_tenant_id_id_key" ON "lesson_notes"("tenant_id", "id");

-- AddForeignKey
ALTER TABLE "lesson_notes" ADD CONSTRAINT "lesson_notes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_notes" ADD CONSTRAINT "lesson_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_notes" ADD CONSTRAINT "lesson_notes_tenant_id_course_id_fkey" FOREIGN KEY ("tenant_id", "course_id") REFERENCES "courses"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Existing lessons each start their own lineage. Open draft copies descend from the published lesson at
-- the same chapter position, lesson position, and title.
UPDATE "lessons" AS copy
SET "lineage_id" = original."lineage_id"
FROM "sections" AS copy_section,
     "course_versions" AS copy_version,
     "courses" AS course,
     "sections" AS original_section,
     "lessons" AS original
WHERE copy."section_id" = copy_section."id"
  AND copy_section."course_version_id" = copy_version."id"
  AND course."id" = copy_version."course_id"
  AND copy_version."id" <> course."published_version_id"
  AND original_section."course_version_id" = course."published_version_id"
  AND original_section."position" = copy_section."position"
  AND original."section_id" = original_section."id"
  AND original."position" = copy."position"
  AND original."title" = copy."title";

ALTER TABLE "lesson_notes"
    ADD CONSTRAINT "lesson_notes_body_length" CHECK (char_length("body") BETWEEN 1 AND 5000),
    ADD CONSTRAINT "lesson_notes_timestamp" CHECK ("timestamp_sec" IS NULL OR "timestamp_sec" >= 0);

GRANT SELECT, INSERT, UPDATE, DELETE ON "lesson_notes" TO oxinov_app;

-- Row-level security: a note is visible to its owner only, never to teachers or administrators.
ALTER TABLE "lesson_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lesson_notes" FORCE ROW LEVEL SECURITY;
CREATE POLICY "lesson_notes_owner_only" ON "lesson_notes" FOR ALL
    USING ("tenant_id" = app_current_tenant_id() AND "user_id" = app_current_user_id())
    WITH CHECK ("tenant_id" = app_current_tenant_id() AND "user_id" = app_current_user_id());
