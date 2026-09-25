-- Database-level tenant isolation tests (NFR-11, FR-TENANT-1605).
-- Run as the application role against a migrated and seeded database:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/policies/tenant_isolation_test.sql
-- Every check raises an exception on failure. All changes are rolled back.


BEGIN;

-- 1. The request role cannot bypass row-level security.
DO $$
BEGIN
    ASSERT NOT (SELECT rolsuper OR rolbypassrls FROM pg_roles WHERE rolname = current_user),
        'request role must not be superuser or BYPASSRLS';
END $$;

-- 2. Every table carrying tenant_id enforces RLS (provider_events is the documented exception).
DO $$
DECLARE
    missing text;
BEGIN
    SELECT string_agg(c.relname, ', ') INTO missing
    FROM pg_class c
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'tenant_id' AND NOT a.attisdropped
    WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r'
      AND c.relname <> 'provider_events'
      AND NOT (c.relrowsecurity AND c.relforcerowsecurity);
    ASSERT missing IS NULL, format('tables without forced RLS: %s', missing);
END $$;

-- 3. Missing context fails closed.
DO $$
BEGIN
    ASSERT (SELECT count(*) FROM courses) = 0, 'courses visible without tenant context';
    ASSERT (SELECT count(*) FROM tenants) = 0, 'tenants visible without context';
    ASSERT (SELECT count(*) FROM tenant_memberships) = 0, 'memberships visible without context';
    ASSERT (SELECT count(*) FROM user_profiles) = 0, 'profiles visible without context';
    ASSERT (SELECT count(*) FROM questions) = 0, 'questions visible without context';
    BEGIN
        INSERT INTO programs (tenant_id, slug, name, kind)
        VALUES ('aaaaaaaa-0000-4000-8000-000000000001', 'x', 'x', 'OTHER');
        RAISE EXCEPTION 'insert without context was allowed';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END $$;

-- 4. Tenant A sees only tenant A rows, and cannot read B objects by ID.
SELECT set_config('app.tenant_id', 'aaaaaaaa-0000-4000-8000-000000000001', true);
DO $$
BEGIN
    ASSERT (SELECT count(*) FROM courses WHERE tenant_id <> 'aaaaaaaa-0000-4000-8000-000000000001') = 0,
        'foreign tenant courses visible';
    ASSERT (SELECT count(*) FROM courses) = 3, 'tenant A should see its 3 courses';
    ASSERT (SELECT count(*) FROM courses WHERE id = 'bbbbbbbb-0000-4000-8000-000000000201') = 0,
        'tenant B course readable by ID from tenant A';
    ASSERT (SELECT count(*) FROM questions WHERE id = 'bbbbbbbb-0000-4000-8000-000000000601') = 0,
        'tenant B question readable from tenant A';
    ASSERT (SELECT count(*) FROM tenants) = 1, 'only the active tenant should be visible';
END $$;

-- 5. Writes cannot target another tenant.
DO $$
BEGIN
    BEGIN
        INSERT INTO programs (tenant_id, slug, name, kind)
        VALUES ('bbbbbbbb-0000-4000-8000-000000000001', 'intruder', 'Intruder', 'OTHER');
        RAISE EXCEPTION 'insert into another tenant was allowed';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        UPDATE programs SET tenant_id = 'bbbbbbbb-0000-4000-8000-000000000001'
        WHERE id = 'aaaaaaaa-0000-4000-8000-000000000101';
        RAISE EXCEPTION 'moving a row to another tenant was allowed';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    -- Updating or deleting another tenant's row silently affects nothing.
    UPDATE courses SET price_minor = 1 WHERE id = 'bbbbbbbb-0000-4000-8000-000000000201';
    ASSERT NOT FOUND, 'update reached another tenant';
    DELETE FROM lessons WHERE id = 'bbbbbbbb-0000-4000-8000-000000000451';
    ASSERT NOT FOUND, 'delete reached another tenant';
END $$;

-- 6. Composite foreign keys reject cross-tenant references even inside the right tenant.
DO $$
BEGIN
    BEGIN
        INSERT INTO enrollments (tenant_id, user_id, course_id)
        VALUES ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000003',
                'bbbbbbbb-0000-4000-8000-000000000201');
        RAISE EXCEPTION 'cross-tenant foreign key was accepted';
    EXCEPTION WHEN foreign_key_violation THEN NULL;
    END;
END $$;

-- 7. One active enrollment per learner and course.
DO $$
BEGIN
    INSERT INTO enrollments (tenant_id, user_id, course_id)
    VALUES ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000003',
            'aaaaaaaa-0000-4000-8000-000000000201');
    BEGIN
        INSERT INTO enrollments (tenant_id, user_id, course_id)
        VALUES ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000003',
                'aaaaaaaa-0000-4000-8000-000000000201');
        RAISE EXCEPTION 'duplicate active enrollment was accepted';
    EXCEPTION WHEN unique_violation THEN NULL;
    END;
END $$;

-- 8. Audit history is append-only for the application role.
DO $$
BEGIN
    INSERT INTO audit_events (tenant_id, action, target_type)
    VALUES ('aaaaaaaa-0000-4000-8000-000000000001', 'test.event', 'test');
    BEGIN
        DELETE FROM audit_events;
        RAISE EXCEPTION 'audit delete was allowed';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END $$;

-- 9. Profiles: tenant A context shows A's members only.
DO $$
BEGIN
    ASSERT (SELECT count(*) FROM user_profiles WHERE id = '11111111-0000-4000-8000-000000000004') = 0,
        'tenant B owner profile visible in tenant A';
    ASSERT (SELECT count(*) FROM user_profiles) = 4, 'tenant A should see its 4 members';
END $$;

-- 10. Workspace listing: with only user context, Aiko sees both her memberships and tenants;
--     Bikash sees only Sakura; neither sees other people's memberships in Everest.
SELECT set_config('app.tenant_id', '', true),
       set_config('app.user_id', '11111111-0000-4000-8000-000000000003', true);
DO $$
BEGIN
    ASSERT (SELECT count(*) FROM tenant_memberships) = 2, 'Aiko should see exactly her 2 memberships';
    ASSERT (SELECT count(*) FROM tenants) = 2, 'Aiko should see her 2 workspaces';
END $$;
SELECT set_config('app.user_id', '11111111-0000-4000-8000-000000000005', true);
DO $$
BEGIN
    ASSERT (SELECT array_agg(slug) FROM tenants) = ARRAY['sakura']::varchar[], 'Bikash should only see sakura';
    ASSERT (SELECT count(*) FROM tenant_memberships WHERE tenant_id = 'bbbbbbbb-0000-4000-8000-000000000001') = 0,
        'Everest memberships visible to non-member';
END $$;

-- 10b. Join codes (tenant_invites): visible only inside their tenant, or by their exact code while
-- redeeming; they can never grant ownership or be written into another tenant.
SELECT set_config('app.tenant_id', 'aaaaaaaa-0000-4000-8000-000000000001', true),
       set_config('app.user_id', '11111111-0000-4000-8000-000000000001', true),
       set_config('app.invite_code', '', true);
INSERT INTO tenant_invites (tenant_id, code, role, created_by_user_id, expires_at)
VALUES ('aaaaaaaa-0000-4000-8000-000000000001', 'TESTC2DE', 'LEARNER', '11111111-0000-4000-8000-000000000001', now() + interval '1 day');
DO $$
BEGIN
    BEGIN
        INSERT INTO tenant_invites (tenant_id, code, role, created_by_user_id, expires_at)
        VALUES ('aaaaaaaa-0000-4000-8000-000000000001', 'OWNERC2D', 'OWNER', '11111111-0000-4000-8000-000000000001', now() + interval '1 day');
        RAISE EXCEPTION 'an invite granted ownership';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    BEGIN
        INSERT INTO tenant_invites (tenant_id, code, role, created_by_user_id, expires_at)
        VALUES ('bbbbbbbb-0000-4000-8000-000000000001', 'CR2SSTNT', 'LEARNER', '11111111-0000-4000-8000-000000000001', now() + interval '1 day');
        RAISE EXCEPTION 'invite written into another tenant';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END $$;
SELECT set_config('app.tenant_id', 'bbbbbbbb-0000-4000-8000-000000000001', true),
       set_config('app.user_id', '11111111-0000-4000-8000-000000000004', true);
DO $$
BEGIN
    ASSERT (SELECT count(*) FROM tenant_invites WHERE tenant_id = 'aaaaaaaa-0000-4000-8000-000000000001') = 0,
        'Sakura join codes visible from Everest';
    ASSERT (SELECT count(*) FROM tenant_invites) = 0, 'join codes listable across tenants';
END $$;
SELECT set_config('app.tenant_id', '', true),
       set_config('app.user_id', '11111111-0000-4000-8000-000000000005', true);
DO $$
BEGIN
    ASSERT (SELECT count(*) FROM tenant_invites) = 0, 'join codes visible without context';
END $$;
SELECT set_config('app.invite_code', 'WRNGC2DE', true);
DO $$
BEGIN
    ASSERT (SELECT count(*) FROM tenant_invites) = 0, 'a wrong code revealed an invite';
END $$;
SELECT set_config('app.invite_code', 'TESTC2DE', true);
DO $$
BEGIN
    ASSERT (SELECT count(*) FROM tenant_invites) = 1, 'the exact code should reveal exactly its invite';
    BEGIN
        UPDATE tenant_invites SET use_count = 0 WHERE code = 'TESTC2DE';
        ASSERT NOT FOUND, 'a redeemer outside the tenant changed an invite';
    END;
END $$;

-- 10c. Assignment work: a learner sees only their own submission and revisions, cannot write another
-- learner's rows, and cannot grade; teaching staff of the tenant can read and grade.
SELECT set_config('app.invite_code', '', true),
       set_config('app.tenant_id', 'aaaaaaaa-0000-4000-8000-000000000001', true),
       set_config('app.user_id', '11111111-0000-4000-8000-000000000003', true);
INSERT INTO assignments (id, tenant_id, course_id, title, status, created_by_user_id)
VALUES ('cccccccc-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000201',
        'Policy test', 'PUBLISHED', '11111111-0000-4000-8000-000000000002');
INSERT INTO assignment_submissions (id, tenant_id, assignment_id, user_id, status, revision_count)
VALUES ('cccccccc-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000001',
        '11111111-0000-4000-8000-000000000003', 'SUBMITTED', 1);
INSERT INTO submission_revisions (tenant_id, submission_id, user_id, revision, text, submitted_at)
VALUES ('aaaaaaaa-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000003', 1, 'my answer', now());
DO $$
BEGIN
    UPDATE submission_revisions SET outcome = 'PASSED', score = 100 WHERE submission_id = 'cccccccc-0000-4000-8000-000000000002';
    ASSERT NOT FOUND, 'a learner graded their own work';
    BEGIN
        INSERT INTO submission_revisions (tenant_id, submission_id, user_id, revision, text, submitted_at, outcome)
        VALUES ('aaaaaaaa-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000003', 2, 'x', now(), 'PASSED');
        RAISE EXCEPTION 'a learner inserted a pre-graded revision';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END $$;
SELECT set_config('app.user_id', '11111111-0000-4000-8000-000000000005', true);
DO $$
BEGIN
    ASSERT (SELECT count(*) FROM assignment_submissions) = 0, 'another learner saw a submission';
    ASSERT (SELECT count(*) FROM submission_revisions) = 0, 'another learner saw a revision';
    UPDATE assignment_submissions SET draft_text = 'tampered';
    ASSERT NOT FOUND, 'another learner changed a submission';
    BEGIN
        INSERT INTO assignment_submissions (tenant_id, assignment_id, user_id)
        VALUES ('aaaaaaaa-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000003');
        RAISE EXCEPTION 'a learner created a submission for someone else';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END $$;
SELECT set_config('app.user_id', '11111111-0000-4000-8000-000000000002', true);
DO $$
BEGIN
    ASSERT (SELECT count(*) FROM submission_revisions) = 1, 'the instructor should see the submitted revision';
    UPDATE submission_revisions SET outcome = 'PASSED' WHERE submission_id = 'cccccccc-0000-4000-8000-000000000002';
    ASSERT FOUND, 'the instructor could not grade';
END $$;
SELECT set_config('app.tenant_id', 'bbbbbbbb-0000-4000-8000-000000000001', true),
       set_config('app.user_id', '11111111-0000-4000-8000-000000000004', true);
DO $$
BEGIN
    ASSERT (SELECT count(*) FROM submission_revisions) = 0, 'another tenant saw assignment work';
    ASSERT (SELECT count(*) FROM assignments WHERE id = 'cccccccc-0000-4000-8000-000000000001') = 0, 'another tenant saw an assignment';
END $$;

-- 10d. Lesson notes are private to their owner: not even the course's teacher or the owner of the tenant
-- can read or change them.
SELECT set_config('app.tenant_id', 'aaaaaaaa-0000-4000-8000-000000000001', true),
       set_config('app.user_id', '11111111-0000-4000-8000-000000000003', true);
INSERT INTO lesson_notes (tenant_id, user_id, course_id, lesson_lineage_id, lesson_title, body)
VALUES ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000201',
        gen_random_uuid(), 'Policy lesson', 'private thought');
DO $$
BEGIN
    ASSERT (SELECT count(*) FROM lesson_notes) = 1, 'the learner should see their note';
    BEGIN
        INSERT INTO lesson_notes (tenant_id, user_id, course_id, lesson_lineage_id, lesson_title, body)
        VALUES ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000005', 'aaaaaaaa-0000-4000-8000-000000000201',
                gen_random_uuid(), 'x', 'written as someone else');
        RAISE EXCEPTION 'a note was written for another learner';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END $$;
SELECT set_config('app.user_id', '11111111-0000-4000-8000-000000000002', true);
DO $$
BEGIN
    ASSERT (SELECT count(*) FROM lesson_notes) = 0, 'a teacher read a learner note';
    DELETE FROM lesson_notes;
    ASSERT NOT FOUND, 'a teacher deleted a learner note';
END $$;
SELECT set_config('app.user_id', '11111111-0000-4000-8000-000000000001', true);
DO $$
BEGIN
    ASSERT (SELECT count(*) FROM lesson_notes) = 0, 'the tenant owner read a learner note';
END $$;

ROLLBACK;

-- 11. Context is transaction-local: nothing survives on this pooled connection.
DO $$
BEGIN
    ASSERT app_current_tenant_id() IS NULL AND app_current_user_id() IS NULL,
        'tenant context leaked past the transaction';
END $$;


