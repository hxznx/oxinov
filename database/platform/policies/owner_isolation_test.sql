-- Database-level owner isolation tests for the platform database (FR-ID-2206, FR-POLICY-2402, FR-PLAN-2602).
-- Run as oxinov_platform_app against a migrated and seeded database:
--   pnpm --filter @oxinov/platform-api db:test-policies
-- Every check raises an exception on failure. All changes are rolled back.

BEGIN;

-- 1. The request role cannot bypass row-level security.
DO $$
BEGIN
    ASSERT NOT (SELECT rolsuper OR rolbypassrls FROM pg_roles WHERE rolname = current_user),
        'request role must not be superuser or BYPASSRLS';
END $$;

-- 2. Every person-owned table enforces forced RLS.
DO $$
DECLARE
    missing text;
BEGIN
    SELECT string_agg(c.relname, ', ') INTO missing
    FROM pg_class c
    WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r'
      AND c.relname IN ('user_accounts', 'policy_acceptances', 'entitlements', 'audit_events')
      AND NOT (c.relrowsecurity AND c.relforcerowsecurity);
    ASSERT missing IS NULL, format('tables without forced RLS: %s', missing);
END $$;

-- 3. Missing context fails closed; catalogues stay readable.
DO $$
BEGIN
    ASSERT (SELECT count(*) FROM user_accounts) = 0, 'accounts visible without context';
    ASSERT (SELECT count(*) FROM entitlements) = 0, 'entitlements visible without context';
    ASSERT (SELECT count(*) FROM policy_acceptances) = 0, 'acceptances visible without context';
    ASSERT (SELECT count(*) FROM products) = 4, 'product catalogue must be readable';
END $$;

-- 4. A person sees only their own rows.
SELECT set_config('app.user_id', '11111111-0000-4000-8000-000000000001', true);
DO $$
BEGIN
    ASSERT (SELECT count(*) FROM user_accounts) = 1, 'should see exactly one account';
    ASSERT (SELECT email FROM user_accounts) = 'asha@example.test', 'saw the wrong account';
    ASSERT (SELECT count(*) FROM entitlements WHERE user_id = '11111111-0000-4000-8000-000000000002') = 0,
        'saw entitlements of another person';
    ASSERT (SELECT count(*) FROM policy_acceptances WHERE user_id = '11111111-0000-4000-8000-000000000002') = 0,
        'saw acceptances of another person';
END $$;

-- 5. A request can grant only free member access, only to itself, only for launched products.
DO $$
BEGIN
    BEGIN
        INSERT INTO entitlements (user_id, product_key, entitlement_key, source)
        VALUES ('11111111-0000-4000-8000-000000000002', 'lms', 'lms.extra', 'MEMBER');
        RAISE EXCEPTION 'granted an entitlement to another person';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        INSERT INTO entitlements (user_id, product_key, entitlement_key, source)
        VALUES ('11111111-0000-4000-8000-000000000001', 'lms', 'lms.ai_tutor', 'PLAN');
        RAISE EXCEPTION 'self-granted a plan entitlement';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        INSERT INTO entitlements (user_id, product_key, entitlement_key, source)
        VALUES ('11111111-0000-4000-8000-000000000001', 'market', 'market.member', 'MEMBER');
        RAISE EXCEPTION 'granted access to an unlaunched product';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END $$;

-- 6. Acceptance records and audit history are append-only; catalogues are read-only.
DO $$
BEGIN
    BEGIN
        UPDATE policy_acceptances SET policy_version = 2;
        RAISE EXCEPTION 'updated an acceptance record';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        DELETE FROM policy_acceptances;
        RAISE EXCEPTION 'deleted an acceptance record';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        DELETE FROM audit_events;
        RAISE EXCEPTION 'deleted audit history';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        UPDATE products SET launched = true WHERE key = 'market';
        RAISE EXCEPTION 'launched a product from a request';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        INSERT INTO policies (id, version, title, url, effective_at) VALUES ('x', 1, 'x', 'x', now());
        RAISE EXCEPTION 'published a policy from a request';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END $$;

-- 7. A person cannot edit another account.
DO $$
BEGIN
    UPDATE user_accounts SET display_name = 'x' WHERE id = '11111111-0000-4000-8000-000000000002';
    ASSERT NOT FOUND, 'updated the account of another person';
END $$;

ROLLBACK;
