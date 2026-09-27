-- Tenant isolation: constraints Prisma cannot express, the least-privilege application role,
-- and PostgreSQL row-level security (FR-TENANT-1605, NFR-11). See database/policies/README.md.
--
-- Request paths connect as "oxinov_app" and set tenant context per transaction:
--   SELECT set_config('app.tenant_id', '<uuid>', true);   -- active workspace
--   SELECT set_config('app.user_id', '<uuid>', true);     -- resolved user profile
--   SELECT set_config('app.auth_subject', '<sub>', true); -- identity-provider subject
-- The third argument (true) makes each setting transaction-local, so pooled connections cannot
-- leak context. Missing context matches no rows: every policy fails closed.

-- ---------------------------------------------------------------------------
-- Integrity rules not expressible in the Prisma schema
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX "enrollments_one_active_per_learner_course"
    ON "enrollments" ("tenant_id", "user_id", "course_id") WHERE "status" = 'ACTIVE';

CREATE UNIQUE INDEX "exam_attempts_one_in_progress_per_learner"
    ON "exam_attempts" ("tenant_id", "blueprint_id", "user_id") WHERE "status" = 'IN_PROGRESS';

ALTER TABLE "tenants"
    ADD CONSTRAINT "tenants_slug_format" CHECK ("slug" ~ '^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])$'),
    ADD CONSTRAINT "tenants_primary_color_format" CHECK ("primary_color" IS NULL OR "primary_color" ~ '^#[0-9A-Fa-f]{6}$');
ALTER TABLE "courses"
    ADD CONSTRAINT "courses_price_non_negative" CHECK ("price_minor" >= 0),
    ADD CONSTRAINT "courses_currency_format" CHECK ("currency" ~ '^[A-Z]{3}$');
ALTER TABLE "payments"
    ADD CONSTRAINT "payments_amount_non_negative" CHECK ("amount_minor" >= 0),
    ADD CONSTRAINT "payments_currency_format" CHECK ("currency" ~ '^[A-Z]{3}$');
ALTER TABLE "entitlements"
    ADD CONSTRAINT "entitlements_purchase_has_payment" CHECK ("source" <> 'PURCHASE' OR "payment_id" IS NOT NULL);
ALTER TABLE "exam_blueprints"
    ADD CONSTRAINT "exam_blueprints_pass_percent_range" CHECK ("pass_percent" BETWEEN 0 AND 100),
    ADD CONSTRAINT "exam_blueprints_time_limit_positive" CHECK ("time_limit_sec" > 0),
    ADD CONSTRAINT "exam_blueprints_max_attempts_positive" CHECK ("max_attempts" IS NULL OR "max_attempts" > 0);
ALTER TABLE "exam_blueprint_sections"
    ADD CONSTRAINT "exam_blueprint_sections_count_positive" CHECK ("question_count" > 0);
ALTER TABLE "questions"
    ADD CONSTRAINT "questions_marks_positive" CHECK ("marks" > 0),
    ADD CONSTRAINT "questions_choices_is_array" CHECK (jsonb_typeof("choices") = 'array'),
    ADD CONSTRAINT "questions_answer_key_is_array" CHECK (jsonb_typeof("answer_key") = 'array');

-- ---------------------------------------------------------------------------
-- Tenant context helpers
-- ---------------------------------------------------------------------------

CREATE FUNCTION app_current_tenant_id() RETURNS uuid
    LANGUAGE sql STABLE PARALLEL SAFE
    AS $$ SELECT nullif(current_setting('app.tenant_id', true), '')::uuid $$;

CREATE FUNCTION app_current_user_id() RETURNS uuid
    LANGUAGE sql STABLE PARALLEL SAFE
    AS $$ SELECT nullif(current_setting('app.user_id', true), '')::uuid $$;

CREATE FUNCTION app_current_auth_subject() RETURNS text
    LANGUAGE sql STABLE PARALLEL SAFE
    AS $$ SELECT nullif(current_setting('app.auth_subject', true), '') $$;

-- ---------------------------------------------------------------------------
-- Application role: no superuser, no BYPASSRLS, no DDL. Login and password are granted
-- outside migrations (see database/policies/README.md) so no credential is stored in Git.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'oxinov_app') THEN
        CREATE ROLE oxinov_app NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
    END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO oxinov_app;
GRANT EXECUTE ON FUNCTION app_current_tenant_id(), app_current_user_id(), app_current_auth_subject() TO oxinov_app;

GRANT SELECT, INSERT, UPDATE ON "tenants", "user_profiles", "provider_events" TO oxinov_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON
    "tenant_memberships", "programs", "courses", "course_versions", "sections", "lessons",
    "enrollments", "entitlements", "payments", "questions", "exam_blueprints",
    "exam_blueprint_sections", "exam_attempts", "exam_attempt_items", "exam_results"
    TO oxinov_app;
-- Audit history is append-only for the application.
GRANT SELECT, INSERT ON "audit_events" TO oxinov_app;

-- ---------------------------------------------------------------------------
-- Row-level security. FORCE applies policies to the table owner too (unless superuser).
-- ---------------------------------------------------------------------------

-- Tenant registry: visible in the active tenant or through the caller's own active membership.
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenants" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenants_select" ON "tenants" FOR SELECT
    USING (
        "id" = app_current_tenant_id()
        OR EXISTS (
            SELECT 1 FROM "tenant_memberships" m
            WHERE m."tenant_id" = "tenants"."id"
              AND m."user_id" = app_current_user_id()
              AND m."status" = 'ACTIVE'
        )
    );
-- Creation happens with app.tenant_id already set to the new ID, so RETURNING is visible.
CREATE POLICY "tenants_insert" ON "tenants" FOR INSERT
    WITH CHECK ("id" = app_current_tenant_id() AND "created_by_user_id" = app_current_user_id());
CREATE POLICY "tenants_update" ON "tenants" FOR UPDATE
    USING ("id" = app_current_tenant_id())
    WITH CHECK ("id" = app_current_tenant_id());

-- Global identity: a user sees themself, and members of the active tenant.
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_profiles" FORCE ROW LEVEL SECURITY;
CREATE POLICY "user_profiles_select" ON "user_profiles" FOR SELECT
    USING (
        "id" = app_current_user_id()
        OR "auth_subject" = app_current_auth_subject()
        OR EXISTS (
            SELECT 1 FROM "tenant_memberships" m
            WHERE m."user_id" = "user_profiles"."id"
              AND m."tenant_id" = app_current_tenant_id()
        )
    );
CREATE POLICY "user_profiles_insert" ON "user_profiles" FOR INSERT
    WITH CHECK ("auth_subject" = app_current_auth_subject());
CREATE POLICY "user_profiles_update" ON "user_profiles" FOR UPDATE
    USING ("auth_subject" = app_current_auth_subject())
    WITH CHECK ("auth_subject" = app_current_auth_subject());

-- Memberships: tenant-scoped writes; a user may also read their own memberships in any tenant
-- (to list workspaces). Membership rows reveal only tenant ID, role, and status.
ALTER TABLE "tenant_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_memberships" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_memberships_select" ON "tenant_memberships" FOR SELECT
    USING ("tenant_id" = app_current_tenant_id() OR "user_id" = app_current_user_id());
CREATE POLICY "tenant_memberships_insert" ON "tenant_memberships" FOR INSERT
    WITH CHECK ("tenant_id" = app_current_tenant_id());
CREATE POLICY "tenant_memberships_update" ON "tenant_memberships" FOR UPDATE
    USING ("tenant_id" = app_current_tenant_id())
    WITH CHECK ("tenant_id" = app_current_tenant_id());
CREATE POLICY "tenant_memberships_delete" ON "tenant_memberships" FOR DELETE
    USING ("tenant_id" = app_current_tenant_id());

-- Every other tenant-owned table: strictly the active tenant.
DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'programs', 'courses', 'course_versions', 'sections', 'lessons', 'enrollments',
        'entitlements', 'payments', 'questions', 'exam_blueprints', 'exam_blueprint_sections',
        'exam_attempts', 'exam_attempt_items', 'exam_results', 'audit_events'
    ]
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
        EXECUTE format(
            'CREATE POLICY %I ON %I FOR ALL USING ("tenant_id" = app_current_tenant_id()) '
            'WITH CHECK ("tenant_id" = app_current_tenant_id())',
            t || '_tenant_isolation', t
        );
    END LOOP;
END
$$;

-- provider_events is a global webhook ledger with no tenant-readable content; it is written
-- only by signature-verified webhook handlers and deliberately has no RLS.
