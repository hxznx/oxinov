-- Video and audio lessons (FR-COURSE-202/205, FR-PLAYER-401/402): uploaded media assets, the lesson link,
-- and per-learner playback progress. See backend/api/src/media/.

-- CreateEnum
CREATE TYPE "media_kind" AS ENUM ('VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "media_status" AS ENUM ('UPLOADING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "media_asset_id" UUID;

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "kind" "media_kind" NOT NULL,
    "status" "media_status" NOT NULL DEFAULT 'UPLOADING',
    "object_key" VARCHAR(300) NOT NULL,
    "content_type" VARCHAR(100) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "duration_sec" INTEGER,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ready_at" TIMESTAMPTZ(3),

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "media_asset_id" UUID NOT NULL,
    "position_sec" INTEGER NOT NULL DEFAULT 0,
    "watched_sec" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMPTZ(3),
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_object_key_key" ON "media_assets"("object_key");

-- CreateIndex
CREATE INDEX "media_assets_tenant_id_created_at_idx" ON "media_assets"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_tenant_id_id_key" ON "media_assets"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "media_progress_tenant_id_user_id_media_asset_id_key" ON "media_progress"("tenant_id", "user_id", "media_asset_id");

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_tenant_id_media_asset_id_fkey" FOREIGN KEY ("tenant_id", "media_asset_id") REFERENCES "media_assets"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_progress" ADD CONSTRAINT "media_progress_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_progress" ADD CONSTRAINT "media_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_progress" ADD CONSTRAINT "media_progress_tenant_id_media_asset_id_fkey" FOREIGN KEY ("tenant_id", "media_asset_id") REFERENCES "media_assets"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Integrity: sensible sizes and durations; object keys always live under their tenant's prefix;
-- progress never goes negative.
ALTER TABLE "media_assets"
    ADD CONSTRAINT "media_assets_size_positive" CHECK ("size_bytes" > 0),
    ADD CONSTRAINT "media_assets_duration_positive" CHECK ("duration_sec" IS NULL OR "duration_sec" > 0),
    ADD CONSTRAINT "media_assets_key_in_tenant" CHECK ("object_key" LIKE 'tenants/' || "tenant_id"::text || '/%');
ALTER TABLE "media_progress"
    ADD CONSTRAINT "media_progress_non_negative" CHECK ("position_sec" >= 0 AND "watched_sec" >= 0);

GRANT SELECT, INSERT, UPDATE ON "media_assets", "media_progress" TO oxinov_app;

-- Row-level security: media belongs to its tenant; progress is visible only to its learner.
ALTER TABLE "media_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "media_assets" FORCE ROW LEVEL SECURITY;
CREATE POLICY "media_assets_tenant_isolation" ON "media_assets" FOR ALL
    USING ("tenant_id" = app_current_tenant_id())
    WITH CHECK ("tenant_id" = app_current_tenant_id());

ALTER TABLE "media_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "media_progress" FORCE ROW LEVEL SECURITY;
CREATE POLICY "media_progress_own_rows" ON "media_progress" FOR ALL
    USING ("tenant_id" = app_current_tenant_id() AND "user_id" = app_current_user_id())
    WITH CHECK ("tenant_id" = app_current_tenant_id() AND "user_id" = app_current_user_id());
