-- Account deletion with a waiting period (FR-PRIV-3202, FR-AUTH-104). The owner chose 14 days: a request
-- can be cancelled until `delete_after`; then the deletion sweep removes the person's Edu data. Payments,
-- enrollments, entitlements, exam attempts, and submissions are kept as records (docs/05-data/data-retention.md)
-- but no longer carry a name, an email, or a sign-in: the profile is anonymised and its sign-in subject is
-- replaced, so signing in again creates a new, empty account. Additive only.
--
-- Row-level security: the sweep sets `app.deleting_user_id`. `app_deleting_user_id()` returns it only while
-- that person has an open request whose waiting period has ended, so the extra deletion policies below can
-- never touch anyone else, nor anyone before their 14 days are over. Policies call it as an uncorrelated
-- subquery, so PostgreSQL evaluates it once per statement rather than once per row.

-- CreateTable
CREATE TABLE "account_deletion_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "requested_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delete_after" TIMESTAMPTZ(3) NOT NULL,
    "cancelled_at" TIMESTAMPTZ(3),
    "completed_at" TIMESTAMPTZ(3),

    CONSTRAINT "account_deletion_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "account_deletion_requests_wait" CHECK ("delete_after" > "requested_at"),
    CONSTRAINT "account_deletion_requests_one_outcome" CHECK ("cancelled_at" IS NULL OR "completed_at" IS NULL)
);

-- One row per person: a new request after a cancellation reuses it.
CREATE UNIQUE INDEX "account_deletion_requests_user_id_key" ON "account_deletion_requests"("user_id");

-- CreateIndex
CREATE INDEX "account_deletion_requests_delete_after_idx" ON "account_deletion_requests"("delete_after");

-- AddForeignKey
ALTER TABLE "account_deletion_requests" ADD CONSTRAINT "account_deletion_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

GRANT SELECT, INSERT, UPDATE ON "account_deletion_requests" TO oxinov_app;

-- A person sees and changes only their own requests. Requests whose waiting period has ended are also
-- visible to the sweep (they hold no personal data beyond the user ID and dates).
ALTER TABLE "account_deletion_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account_deletion_requests" FORCE ROW LEVEL SECURITY;
CREATE POLICY "account_deletion_requests_own" ON "account_deletion_requests" FOR ALL
    USING ("user_id" = app_current_user_id())
    WITH CHECK ("user_id" = app_current_user_id());
CREATE POLICY "account_deletion_requests_due" ON "account_deletion_requests" FOR ALL
    USING ("delete_after" <= now() AND "cancelled_at" IS NULL AND "completed_at" IS NULL)
    WITH CHECK ("delete_after" <= now() AND "cancelled_at" IS NULL);

CREATE FUNCTION app_deleting_user_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
        SELECT r."user_id" FROM "account_deletion_requests" r
        WHERE r."user_id" = nullif(current_setting('app.deleting_user_id', true), '')::uuid
          AND r."delete_after" <= now()
          AND r."cancelled_at" IS NULL
          AND r."completed_at" IS NULL
        LIMIT 1
    $$;
GRANT EXECUTE ON FUNCTION app_deleting_user_id() TO oxinov_app;

-- The person's own learning data, removed by the sweep.
GRANT DELETE ON "notifications", "media_progress", "tenant_memberships" TO oxinov_app;
CREATE POLICY "lesson_notes_account_deletion" ON "lesson_notes" FOR ALL USING ("user_id" = (SELECT app_deleting_user_id()));
CREATE POLICY "notifications_account_deletion" ON "notifications" FOR ALL USING ("user_id" = (SELECT app_deleting_user_id()));
CREATE POLICY "course_reviews_account_deletion" ON "course_reviews" FOR ALL USING ("user_id" = (SELECT app_deleting_user_id()));
CREATE POLICY "answer_votes_account_deletion" ON "answer_votes" FOR ALL USING ("user_id" = (SELECT app_deleting_user_id()));
CREATE POLICY "media_progress_account_deletion" ON "media_progress" FOR ALL USING ("user_id" = (SELECT app_deleting_user_id()));
CREATE POLICY "lesson_completions_account_deletion" ON "lesson_completions" FOR ALL USING ("user_id" = (SELECT app_deleting_user_id()));
CREATE POLICY "tenant_memberships_account_deletion" ON "tenant_memberships" FOR ALL USING ("user_id" = (SELECT app_deleting_user_id()));
-- Certificates are revoked and lose the holder's name; the public verification page then says revoked.
CREATE POLICY "certificates_account_deletion" ON "certificates" FOR ALL
    USING ("user_id" = (SELECT app_deleting_user_id()))
    WITH CHECK ("user_id" = (SELECT app_deleting_user_id()));
-- The profile loses its name, email, and sign-in subject.
CREATE POLICY "user_profiles_account_deletion" ON "user_profiles" FOR ALL
    USING ("id" = (SELECT app_deleting_user_id()))
    WITH CHECK ("id" = (SELECT app_deleting_user_id()) AND "auth_subject" = 'deleted|' || "id"::text AND "email" IS NULL AND "display_name" IS NULL);
