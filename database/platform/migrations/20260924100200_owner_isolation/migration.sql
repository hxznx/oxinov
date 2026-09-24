-- Owner isolation for the platform control plane (FR-ID-2206, FR-POLICY-2402, FR-PLAN-2602).
-- The platform API connects as "oxinov_platform_app" and sets context per transaction:
--   SELECT set_config('app.user_id', '<uuid>', true);      -- resolved Oxinov account
--   SELECT set_config('app.auth_subject', '<sub>', true);  -- identity-provider subject (sign-in only)
-- Settings are transaction-local, so pooled connections cannot leak them. Missing context matches
-- no rows: every policy fails closed.

-- ---------------------------------------------------------------------------
-- Integrity rules not expressible in the Prisma schema
-- ---------------------------------------------------------------------------

ALTER TABLE "user_accounts"
    ADD CONSTRAINT "user_accounts_country_format" CHECK ("country" IS NULL OR "country" ~ '^[A-Z]{2}$'),
    ADD CONSTRAINT "user_accounts_email_lowercase" CHECK ("email" IS NULL OR "email" = lower("email")),
    ADD CONSTRAINT "user_accounts_active_is_welcomed" CHECK ("status" <> 'ACTIVE' OR ("welcomed_at" IS NOT NULL AND "age_confirmed_at" IS NOT NULL));
ALTER TABLE "policies"
    ADD CONSTRAINT "policies_version_positive" CHECK ("version" > 0);
-- A product can be launched only after its release gate is recorded (FR-OPS-3302).
ALTER TABLE "products"
    ADD CONSTRAINT "products_launch_requires_release_gate" CHECK (NOT "launched" OR "release_gate_recorded_at" IS NOT NULL);
-- One active entitlement per person and key.
CREATE UNIQUE INDEX "entitlements_one_active_per_user_key"
    ON "entitlements" ("user_id", "entitlement_key") WHERE "revoked_at" IS NULL;

-- ---------------------------------------------------------------------------
-- Context helpers
-- ---------------------------------------------------------------------------

CREATE FUNCTION app_current_user_id() RETURNS uuid
    LANGUAGE sql STABLE PARALLEL SAFE
    AS $$ SELECT nullif(current_setting('app.user_id', true), '')::uuid $$;

CREATE FUNCTION app_current_auth_subject() RETURNS text
    LANGUAGE sql STABLE PARALLEL SAFE
    AS $$ SELECT nullif(current_setting('app.auth_subject', true), '') $$;

-- ---------------------------------------------------------------------------
-- Application role: no superuser, no BYPASSRLS, no DDL. Login and password are granted outside
-- migrations (database/platform/policies/local-app-role.sh locally; secret-managed elsewhere).
-- ---------------------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'oxinov_platform_app') THEN
        CREATE ROLE oxinov_platform_app NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
    END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO oxinov_platform_app;
GRANT EXECUTE ON FUNCTION app_current_user_id(), app_current_auth_subject() TO oxinov_platform_app;

-- Catalogues are read-only for requests; operators and migrations change them.
GRANT SELECT ON "products", "policies" TO oxinov_platform_app;
GRANT SELECT, INSERT, UPDATE ON "user_accounts" TO oxinov_platform_app;
-- Acceptance records and audit history are append-only (FR-POLICY-2402).
GRANT SELECT, INSERT ON "policy_acceptances", "audit_events" TO oxinov_platform_app;
-- Requests may create member entitlements only; plans and revocations belong to billing workers.
GRANT SELECT, INSERT ON "entitlements" TO oxinov_platform_app;

-- ---------------------------------------------------------------------------
-- Row-level security. FORCE applies policies to the table owner too (unless superuser).
-- ---------------------------------------------------------------------------

ALTER TABLE "user_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_accounts" FORCE ROW LEVEL SECURITY;
CREATE POLICY "user_accounts_select" ON "user_accounts" FOR SELECT
    USING ("id" = app_current_user_id() OR "auth_subject" = app_current_auth_subject());
CREATE POLICY "user_accounts_insert" ON "user_accounts" FOR INSERT
    WITH CHECK ("auth_subject" = app_current_auth_subject());
CREATE POLICY "user_accounts_update" ON "user_accounts" FOR UPDATE
    USING ("id" = app_current_user_id() OR "auth_subject" = app_current_auth_subject())
    WITH CHECK ("id" = app_current_user_id() OR "auth_subject" = app_current_auth_subject());

ALTER TABLE "policy_acceptances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "policy_acceptances" FORCE ROW LEVEL SECURITY;
CREATE POLICY "policy_acceptances_owner" ON "policy_acceptances" FOR ALL
    USING ("user_id" = app_current_user_id())
    WITH CHECK ("user_id" = app_current_user_id());

ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_events" FORCE ROW LEVEL SECURITY;
CREATE POLICY "audit_events_owner" ON "audit_events" FOR ALL
    USING ("actor_user_id" = app_current_user_id())
    WITH CHECK ("actor_user_id" = app_current_user_id());

ALTER TABLE "entitlements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "entitlements" FORCE ROW LEVEL SECURITY;
CREATE POLICY "entitlements_select_own" ON "entitlements" FOR SELECT
    USING ("user_id" = app_current_user_id());
-- Defense in depth: a request can grant only free member access, only to itself, only for a
-- launched product. A bug in the API still cannot hand out paid plans or unlaunched products.
CREATE POLICY "entitlements_insert_member" ON "entitlements" FOR INSERT
    WITH CHECK (
        "user_id" = app_current_user_id()
        AND "source" = 'MEMBER'
        AND EXISTS (SELECT 1 FROM "products" p WHERE p."key" = "entitlements"."product_key" AND p."launched")
    );
