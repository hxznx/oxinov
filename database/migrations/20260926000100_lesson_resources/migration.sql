-- Lesson resources (FR-COURSE-202): uploaded course documents and links attached to lessons.

-- CreateEnum
CREATE TYPE "resource_kind" AS ENUM ('FILE', 'LINK');

-- CreateTable
CREATE TABLE "resource_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "status" "media_status" NOT NULL DEFAULT 'UPLOADING',
    "object_key" VARCHAR(300) NOT NULL,
    "content_type" VARCHAR(120) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_resources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "kind" "resource_kind" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "resource_file_id" UUID,
    "url" VARCHAR(2000),
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_files_object_key_key" ON "resource_files"("object_key");

-- CreateIndex
CREATE UNIQUE INDEX "resource_files_tenant_id_id_key" ON "resource_files"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "lesson_resources_tenant_id_lesson_id_idx" ON "lesson_resources"("tenant_id", "lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_resources_tenant_id_id_key" ON "lesson_resources"("tenant_id", "id");

-- AddForeignKey
ALTER TABLE "resource_files" ADD CONSTRAINT "resource_files_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_files" ADD CONSTRAINT "resource_files_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_resources" ADD CONSTRAINT "lesson_resources_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_resources" ADD CONSTRAINT "lesson_resources_tenant_id_lesson_id_fkey" FOREIGN KEY ("tenant_id", "lesson_id") REFERENCES "lessons"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_resources" ADD CONSTRAINT "lesson_resources_tenant_id_resource_file_id_fkey" FOREIGN KEY ("tenant_id", "resource_file_id") REFERENCES "resource_files"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "resource_files"
    ADD CONSTRAINT "resource_files_size_positive" CHECK ("size_bytes" > 0),
    ADD CONSTRAINT "resource_files_key_in_tenant" CHECK ("object_key" LIKE 'tenants/' || "tenant_id"::text || '/%');
ALTER TABLE "lesson_resources"
    ADD CONSTRAINT "lesson_resources_shape" CHECK (
        ("kind" = 'FILE' AND "resource_file_id" IS NOT NULL AND "url" IS NULL)
        OR ("kind" = 'LINK' AND "url" IS NOT NULL AND "resource_file_id" IS NULL)
    ),
    ADD CONSTRAINT "lesson_resources_url_scheme" CHECK ("url" IS NULL OR "url" ~ '^https?://');

GRANT SELECT, INSERT, UPDATE ON "resource_files" TO oxinov_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "lesson_resources" TO oxinov_app;

-- Row-level security: both belong to their tenant; the API checks lesson access and authorship.
ALTER TABLE "resource_files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "resource_files" FORCE ROW LEVEL SECURITY;
CREATE POLICY "resource_files_tenant_isolation" ON "resource_files" FOR ALL
    USING ("tenant_id" = app_current_tenant_id())
    WITH CHECK ("tenant_id" = app_current_tenant_id());
ALTER TABLE "lesson_resources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lesson_resources" FORCE ROW LEVEL SECURITY;
CREATE POLICY "lesson_resources_tenant_isolation" ON "lesson_resources" FOR ALL
    USING ("tenant_id" = app_current_tenant_id())
    WITH CHECK ("tenant_id" = app_current_tenant_id());
