-- Externally hosted lessons and live classes (ADR-028 points 5 to 8; FR-COURSE-206, FR-COURSE-207,
-- FR-COURSE-208, FR-PLAYER-405).
-- A lesson can show an unlisted YouTube video or a Google Drive file instead of an Oxinov-hosted file;
-- only the provider and the video or file ID are stored, and the API returns them only after the same
-- access check as Oxinov media. DOCUMENT lessons show a Drive PDF, slide deck, or document. Live
-- classes are links (Google Meet, Microsoft Teams, Zoom) with a time, free or for subscribers.
-- Additive only. The new DOCUMENT value is not used in this migration (it cannot be used before commit).

ALTER TYPE "lesson_kind" ADD VALUE IF NOT EXISTS 'DOCUMENT';

-- CreateEnum
CREATE TYPE "content_source" AS ENUM ('YOUTUBE', 'GOOGLE_DRIVE');

-- CreateEnum
CREATE TYPE "item_visibility" AS ENUM ('FREE', 'SUBSCRIBERS');

-- AlterTable
ALTER TABLE "lessons"
    ADD COLUMN "external_source" "content_source",
    ADD COLUMN "external_id" VARCHAR(128);

ALTER TABLE "lessons"
    ADD CONSTRAINT "lessons_external_pair" CHECK (("external_source" IS NULL) = ("external_id" IS NULL)),
    ADD CONSTRAINT "lessons_external_id_format" CHECK ("external_id" IS NULL OR "external_id" ~ '^[A-Za-z0-9_-]{6,128}$'),
    ADD CONSTRAINT "lessons_one_media_source" CHECK ("media_asset_id" IS NULL OR "external_source" IS NULL);

-- CreateTable
CREATE TABLE "live_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "duration_min" INTEGER NOT NULL,
    "join_url" VARCHAR(500) NOT NULL,
    "visibility" "item_visibility" NOT NULL DEFAULT 'SUBSCRIBERS',
    "cancelled_at" TIMESTAMPTZ(3),
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "live_sessions_duration_range" CHECK ("duration_min" BETWEEN 5 AND 600),
    CONSTRAINT "live_sessions_join_url_https" CHECK ("join_url" ~ '^https://'),
    CONSTRAINT "live_sessions_title_present" CHECK (length(btrim("title")) > 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "live_sessions_tenant_id_id_key" ON "live_sessions"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "live_sessions_tenant_id_course_id_starts_at_idx" ON "live_sessions"("tenant_id", "course_id", "starts_at");

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_tenant_id_course_id_fkey" FOREIGN KEY ("tenant_id", "course_id") REFERENCES "courses"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Live classes are cancelled, never deleted, so learners see what changed.
GRANT SELECT, INSERT, UPDATE ON "live_sessions" TO oxinov_app;

-- Row-level security: every live class belongs to its tenant; roles are checked by the API.
ALTER TABLE "live_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "live_sessions" FORCE ROW LEVEL SECURITY;
CREATE POLICY "live_sessions_tenant_isolation" ON "live_sessions" FOR ALL
    USING ("tenant_id" = app_current_tenant_id())
    WITH CHECK ("tenant_id" = app_current_tenant_id());
