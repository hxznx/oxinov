-- In-app notifications and renewal reminders (FR-COMM-704, FR-AUTH-104; ADR-028 point 9).
-- Each notification belongs to one learner in one workspace. `dedupe_key` makes a notification happen at
-- most once (for example one 7-day renewal reminder per course and end date), so a repeated or concurrent
-- reminder sweep can never notify or email twice. Additive only.

-- CreateEnum
CREATE TYPE "notification_kind" AS ENUM ('PAYMENT_APPROVED', 'PAYMENT_REJECTED', 'RENEWAL_DUE', 'ACCESS_ENDED', 'NOTICE');

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "kind" "notification_kind" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" VARCHAR(2000) NOT NULL DEFAULT '',
    "link_path" VARCHAR(500),
    "dedupe_key" VARCHAR(200),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMPTZ(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
    -- Links stay inside the Edu web app: a path, never another site.
    CONSTRAINT "notifications_link_path_local" CHECK ("link_path" IS NULL OR "link_path" ~ '^/[^/\\]'),
    CONSTRAINT "notifications_title_present" CHECK (length(btrim("title")) > 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "notifications_tenant_id_id_key" ON "notifications"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_tenant_id_user_id_dedupe_key_key" ON "notifications"("tenant_id", "user_id", "dedupe_key");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_user_id_created_at_idx" ON "notifications"("tenant_id", "user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

GRANT SELECT, INSERT, UPDATE ON "notifications" TO oxinov_app;

-- Row-level security: every notification belongs to its tenant; the API returns only the caller's own.
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" FORCE ROW LEVEL SECURITY;
CREATE POLICY "notifications_tenant_isolation" ON "notifications" FOR ALL
    USING ("tenant_id" = app_current_tenant_id())
    WITH CHECK ("tenant_id" = app_current_tenant_id());
