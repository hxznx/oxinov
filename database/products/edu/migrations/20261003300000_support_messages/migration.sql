-- Support messages (FR-CHAT-1301, learner-to-support; FR-AUTH-104 Messages; FR-AI-1705 "Talk to a human").
-- One private thread per learner and workspace. The learner reads and writes only their own thread; the
-- workspace's administrators and owner read every thread and reply. OXI, the rule-based course advisor,
-- stores nothing; a question handed to a human is written here as the learner's message. Each side's
-- `*_read_at` gives the unread markers. Additive only.

-- CreateEnum
CREATE TYPE "message_sender" AS ENUM ('LEARNER', 'STAFF');

-- CreateTable
CREATE TABLE "support_threads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "last_message_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "learner_read_at" TIMESTAMPTZ(3),
    "staff_read_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "thread_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "sender" "message_sender" NOT NULL,
    "body" VARCHAR(4000) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "support_messages_body_present" CHECK (length(btrim("body")) > 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "support_threads_tenant_id_id_key" ON "support_threads"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "support_threads_tenant_id_user_id_key" ON "support_threads"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "support_threads_tenant_id_last_message_at_idx" ON "support_threads"("tenant_id", "last_message_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "support_messages_tenant_id_id_key" ON "support_messages"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "support_messages_tenant_id_thread_id_created_at_idx" ON "support_messages"("tenant_id", "thread_id", "created_at");

-- AddForeignKey
ALTER TABLE "support_threads" ADD CONSTRAINT "support_threads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_threads" ADD CONSTRAINT "support_threads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_tenant_id_thread_id_fkey" FOREIGN KEY ("tenant_id", "thread_id") REFERENCES "support_threads"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- True when the caller administers the active tenant (administrator or owner).
CREATE FUNCTION app_is_tenant_admin() RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
        SELECT EXISTS (
            SELECT 1 FROM "tenant_memberships" m
            WHERE m."tenant_id" = app_current_tenant_id()
              AND m."user_id" = app_current_user_id()
              AND m."status" = 'ACTIVE'
              AND m."role" IN ('ADMIN', 'OWNER')
        )
    $$;
GRANT EXECUTE ON FUNCTION app_is_tenant_admin() TO oxinov_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON "support_threads", "support_messages" TO oxinov_app;

-- Row-level security: a learner sees only their own thread and its messages; administrators of the
-- workspace see all of them. Deleting an account removes the person's threads (FR-PRIV-3202).
ALTER TABLE "support_threads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "support_threads" FORCE ROW LEVEL SECURITY;
CREATE POLICY "support_threads_access" ON "support_threads" FOR ALL
    USING ("tenant_id" = app_current_tenant_id() AND ("user_id" = app_current_user_id() OR (SELECT app_is_tenant_admin())))
    WITH CHECK ("tenant_id" = app_current_tenant_id() AND ("user_id" = app_current_user_id() OR (SELECT app_is_tenant_admin())));
CREATE POLICY "support_threads_account_deletion" ON "support_threads" FOR ALL USING ("user_id" = (SELECT app_deleting_user_id()));

-- Messages follow their thread: visible exactly when the thread is.
ALTER TABLE "support_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "support_messages" FORCE ROW LEVEL SECURITY;
CREATE POLICY "support_messages_access" ON "support_messages" FOR ALL
    USING ("tenant_id" = app_current_tenant_id() AND EXISTS (SELECT 1 FROM "support_threads" t WHERE t."tenant_id" = "support_messages"."tenant_id" AND t."id" = "support_messages"."thread_id"))
    WITH CHECK ("tenant_id" = app_current_tenant_id() AND EXISTS (SELECT 1 FROM "support_threads" t WHERE t."tenant_id" = "support_messages"."tenant_id" AND t."id" = "support_messages"."thread_id"));
CREATE POLICY "support_messages_account_deletion" ON "support_messages" FOR ALL
    USING (EXISTS (SELECT 1 FROM "support_threads" t WHERE t."id" = "support_messages"."thread_id" AND t."user_id" = (SELECT app_deleting_user_id())));
