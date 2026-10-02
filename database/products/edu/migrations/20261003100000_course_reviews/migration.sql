-- Ratings and reviews (FR-CATALOG-304). One review per learner and offering; the owner chose
-- "approve first", so a new or edited review is PENDING until an administrator approves it, and only
-- APPROVED reviews are shown or counted. Hiding records who hid it, when, and why; the reason is never
-- shown to other people. Additive only.

-- CreateEnum
CREATE TYPE "review_status" AS ENUM ('PENDING', 'APPROVED', 'HIDDEN');

-- CreateTable
CREATE TABLE "course_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "body" VARCHAR(2000) NOT NULL DEFAULT '',
    "status" "review_status" NOT NULL DEFAULT 'PENDING',
    "moderated_by_user_id" UUID,
    "moderated_at" TIMESTAMPTZ(3),
    "moderation_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "course_reviews_rating_range" CHECK ("rating" BETWEEN 1 AND 5),
    -- A hidden review always carries the reason it was hidden.
    CONSTRAINT "course_reviews_hidden_reason" CHECK ("status" <> 'HIDDEN' OR length(btrim(coalesce("moderation_reason", ''))) > 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "course_reviews_tenant_id_id_key" ON "course_reviews"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "course_reviews_tenant_id_course_id_user_id_key" ON "course_reviews"("tenant_id", "course_id", "user_id");

-- CreateIndex
CREATE INDEX "course_reviews_tenant_id_status_created_at_idx" ON "course_reviews"("tenant_id", "status", "created_at");

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_tenant_id_course_id_fkey" FOREIGN KEY ("tenant_id", "course_id") REFERENCES "courses"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_moderated_by_user_id_fkey" FOREIGN KEY ("moderated_by_user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

GRANT SELECT, INSERT, UPDATE, DELETE ON "course_reviews" TO oxinov_app;

-- Row-level security: every review belongs to its tenant.
ALTER TABLE "course_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "course_reviews" FORCE ROW LEVEL SECURITY;
CREATE POLICY "course_reviews_tenant_isolation" ON "course_reviews" FOR ALL
    USING ("tenant_id" = app_current_tenant_id())
    WITH CHECK ("tenant_id" = app_current_tenant_id());
