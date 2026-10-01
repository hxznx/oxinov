-- Local development and test data for the platform database. Never load into staging or production.
-- Deterministic IDs are referenced by policies/owner_isolation_test.sql and backend/platform-api tests.

-- The sign-up policy versions come from migration 20261001090000_signup_policies.

-- Oxinov Edu is launched locally so member access can be exercised; the other products stay unlaunched.
UPDATE products SET launched = true, release_gate_recorded_at = '2026-09-20T00:00:00Z' WHERE key = 'edu';

-- Two active members for isolation tests.
INSERT INTO user_accounts (id, auth_subject, email, email_verified, display_name, country, status, age_confirmed_at, welcomed_at) VALUES
    ('11111111-0000-4000-8000-000000000001', 'dev|member-asha', 'asha@example.test', true, 'Asha', 'NP', 'ACTIVE', '2026-09-20T00:00:00Z', '2026-09-20T00:00:00Z'),
    ('11111111-0000-4000-8000-000000000002', 'dev|member-bibek', 'bibek@example.test', true, 'Bibek', 'NP', 'ACTIVE', '2026-09-20T00:00:00Z', '2026-09-20T00:00:00Z');

INSERT INTO policy_acceptances (user_id, policy_id, policy_version, channel, locale) VALUES
    ('11111111-0000-4000-8000-000000000001', 'terms', 1, 'WEB', 'en'),
    ('11111111-0000-4000-8000-000000000001', 'privacy', 1, 'WEB', 'en'),
    ('11111111-0000-4000-8000-000000000002', 'terms', 1, 'WEB', 'ne-NP'),
    ('11111111-0000-4000-8000-000000000002', 'privacy', 1, 'WEB', 'ne-NP');

INSERT INTO entitlements (user_id, product_key, entitlement_key, source) VALUES
    ('11111111-0000-4000-8000-000000000001', 'edu', 'edu.member', 'MEMBER'),
    ('11111111-0000-4000-8000-000000000002', 'edu', 'edu.member', 'MEMBER');
