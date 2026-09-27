-- Deterministic synthetic development and test data. No customer data, credentials, or copied
-- official exam content: all questions are original practice items and every mock exam is
-- labeled unofficial (NFR-09, FR-EXAM-1204).
--
-- Two tenants exist so tenant isolation can be exercised locally:
--   sakura  (Sakura Japanese School)  - JLPT N5 content, free and paid courses, exams
--   everest (Everest Skills Academy)  - small IT course
-- Aiko is a learner in both tenants, which demonstrates workspace switching.
--
-- Identity subjects use the "dev|" prefix and only work with the development token issuer.
-- Apply after migrations with the migration (owner) role:
--   psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 -f database/products/edu/seeds/dev_seed.sql
-- Context is set before each block so the script also works where FORCE RLS applies to the owner.

BEGIN;

-- ---------------------------------------------------------------------------
-- Users (global identity)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    u record;
BEGIN
    FOR u IN SELECT * FROM (VALUES
        ('11111111-0000-4000-8000-000000000001'::uuid, 'dev|sakura-owner',      'owner@sakura.example',      'Haruka Sato'),
        ('11111111-0000-4000-8000-000000000002'::uuid, 'dev|sakura-instructor', 'instructor@sakura.example', 'Kenji Mori'),
        ('11111111-0000-4000-8000-000000000003'::uuid, 'dev|learner-aiko',      'aiko@learner.example',      'Aiko Rai'),
        ('11111111-0000-4000-8000-000000000004'::uuid, 'dev|everest-owner',     'owner@everest.example',     'Sunil Thapa'),
        ('11111111-0000-4000-8000-000000000005'::uuid, 'dev|learner-bikash',    'bikash@learner.example',    'Bikash Gurung')
    ) AS v(id, subject, email, name)
    LOOP
        PERFORM set_config('app.auth_subject', u.subject, true);
        INSERT INTO user_profiles (id, auth_subject, email, email_verified, display_name)
        VALUES (u.id, u.subject, u.email, true, u.name);
    END LOOP;
    PERFORM set_config('app.auth_subject', '', true);
END
$$;

-- ---------------------------------------------------------------------------
-- Tenant: Sakura Japanese School
-- ---------------------------------------------------------------------------
SELECT set_config('app.tenant_id', 'aaaaaaaa-0000-4000-8000-000000000001', true),
       set_config('app.user_id', '11111111-0000-4000-8000-000000000001', true);

INSERT INTO tenants (id, slug, name, status, default_locale, time_zone, primary_color, created_by_user_id)
VALUES ('aaaaaaaa-0000-4000-8000-000000000001', 'sakura', 'Sakura Japanese School', 'ACTIVE',
        'en', 'Asia/Tokyo', '#C2185B', '11111111-0000-4000-8000-000000000001');

INSERT INTO tenant_memberships (tenant_id, user_id, role) VALUES
    ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001', 'OWNER'),
    ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000002', 'INSTRUCTOR'),
    ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000003', 'LEARNER'),
    ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000005', 'LEARNER');

INSERT INTO programs (id, tenant_id, slug, name, kind, language, level, position) VALUES
    ('aaaaaaaa-0000-4000-8000-000000000101', 'aaaaaaaa-0000-4000-8000-000000000001', 'jlpt-n5', 'Japanese JLPT N5', 'JLPT', 'ja', 'N5', 1),
    ('aaaaaaaa-0000-4000-8000-000000000102', 'aaaaaaaa-0000-4000-8000-000000000001', 'jlpt-n4', 'Japanese JLPT N4', 'JLPT', 'ja', 'N4', 2);

-- Courses are inserted before their versions; published_version_id is set afterwards.
INSERT INTO courses (id, tenant_id, program_id, slug, status, price_minor, currency, created_by_user_id) VALUES
    ('aaaaaaaa-0000-4000-8000-000000000201', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000101',
     'hiragana-first-words', 'PUBLISHED', 0, 'JPY', '11111111-0000-4000-8000-000000000002'),
    ('aaaaaaaa-0000-4000-8000-000000000202', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000101',
     'jlpt-n5-complete', 'PUBLISHED', 4900, 'JPY', '11111111-0000-4000-8000-000000000002'),
    ('aaaaaaaa-0000-4000-8000-000000000203', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000102',
     'jlpt-n4-grammar', 'DRAFT', 5900, 'JPY', '11111111-0000-4000-8000-000000000002');

INSERT INTO course_versions (id, tenant_id, course_id, version, status, title, summary, description, language, outcomes, published_at) VALUES
    ('aaaaaaaa-0000-4000-8000-000000000301', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000201', 1, 'PUBLISHED',
     'Hiragana and First Words', 'Read all 46 basic hiragana and use your first twenty everyday words.',
     'A free starter course for complete beginners. Each chapter ends with a short practice set.',
     'en', ARRAY['Read basic hiragana', 'Greet people politely', 'Recognise twenty everyday words'], now()),
    ('aaaaaaaa-0000-4000-8000-000000000302', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000202', 1, 'PUBLISHED',
     'JLPT N5 Complete Preparation', 'Vocabulary, grammar, and a timed practice mock exam for the N5 level.',
     'Structured N5 preparation with chapter lessons and an unofficial timed mock exam. Mock scores are platform practice scores, not official JLPT results.',
     'en', ARRAY['Use core N5 particles', 'Recognise N5 kanji readings', 'Complete a timed practice mock'], now()),
    ('aaaaaaaa-0000-4000-8000-000000000303', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000203', 1, 'DRAFT',
     'JLPT N4 Grammar (draft)', 'Work in progress: N4 grammar patterns.', '', 'en', ARRAY[]::text[], NULL);

UPDATE courses SET published_version_id = 'aaaaaaaa-0000-4000-8000-000000000301' WHERE id = 'aaaaaaaa-0000-4000-8000-000000000201';
UPDATE courses SET published_version_id = 'aaaaaaaa-0000-4000-8000-000000000302' WHERE id = 'aaaaaaaa-0000-4000-8000-000000000202';

INSERT INTO sections (id, tenant_id, course_version_id, title, position) VALUES
    ('aaaaaaaa-0000-4000-8000-000000000401', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000301', 'Chapter 1: Hiragana', 1),
    ('aaaaaaaa-0000-4000-8000-000000000402', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000301', 'Chapter 2: Greetings', 2),
    ('aaaaaaaa-0000-4000-8000-000000000403', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000302', 'Chapter 1: Particles は, を, へ', 1),
    ('aaaaaaaa-0000-4000-8000-000000000404', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000302', 'Chapter 2: Verbs in polite form', 2),
    ('aaaaaaaa-0000-4000-8000-000000000405', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000303', 'Chapter 1: Conditional forms', 1);

INSERT INTO lessons (id, tenant_id, section_id, title, kind, position, body_markdown, is_preview, duration_sec) VALUES
    ('aaaaaaaa-0000-4000-8000-000000000451', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000401',
     'The vowels あ い う え お', 'TEXT', 1,
     E'# The five vowels\n\nJapanese has five vowel sounds: **あ** (a), **い** (i), **う** (u), **え** (e), **お** (o).\n\nEvery other hiragana is a consonant followed by one of these vowels.', true, NULL),
    ('aaaaaaaa-0000-4000-8000-000000000452', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000401',
     'The か row', 'TEXT', 2,
     E'# The か row\n\nか (ka), き (ki), く (ku), け (ke), こ (ko).\n\nPractice word: **かき** (persimmon).', false, NULL),
    ('aaaaaaaa-0000-4000-8000-000000000453', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000402',
     'Everyday greetings', 'TEXT', 1,
     E'# Everyday greetings\n\n| Japanese | Meaning |\n| --- | --- |\n| おはよう ございます | Good morning |\n| こんにちは | Hello |\n| ありがとう | Thank you |', false, NULL),
    ('aaaaaaaa-0000-4000-8000-000000000454', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000403',
     'Topic marker は', 'TEXT', 1,
     E'# Topic marker は\n\nWritten は but pronounced *wa*. It marks the topic: **わたしは がくせいです。** (I am a student.)', true, NULL),
    ('aaaaaaaa-0000-4000-8000-000000000455', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000403',
     'Object marker を and direction へ', 'TEXT', 2,
     E'# を and へ\n\n**みずを のみます。** (I drink water.)\n\n**がっこうへ いきます。** (I go to school.)', false, NULL),
    ('aaaaaaaa-0000-4000-8000-000000000456', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000404',
     'ます and ました', 'TEXT', 1,
     E'# Polite present and past\n\n**たべます** (eat) → **たべました** (ate).\n\n**みます** (watch) → **みました** (watched).', false, NULL),
    ('aaaaaaaa-0000-4000-8000-000000000457', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000405',
     'ば and たら (draft)', 'TEXT', 1, E'Draft lesson.', false, NULL);

-- Original N5-style practice questions. answer_key holds choice IDs, or accepted text for FILL_BLANK.
INSERT INTO questions (id, tenant_id, program_id, section_key, topic, type, prompt, choices, answer_key, explanation) VALUES
    ('aaaaaaaa-0000-4000-8000-000000000601', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000101', 'vocabulary', 'kanji-reading', 'SINGLE_CHOICE',
     'How is 「水」 read?', '[{"id":"a","text":"みず"},{"id":"b","text":"ひ"},{"id":"c","text":"き"},{"id":"d","text":"つち"}]', '["a"]', '水 (みず) means water.'),
    ('aaaaaaaa-0000-4000-8000-000000000602', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000101', 'vocabulary', 'kanji-reading', 'SINGLE_CHOICE',
     'How is 「山」 read?', '[{"id":"a","text":"かわ"},{"id":"b","text":"やま"},{"id":"c","text":"た"},{"id":"d","text":"いし"}]', '["b"]', '山 (やま) means mountain.'),
    ('aaaaaaaa-0000-4000-8000-000000000603', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000101', 'vocabulary', 'kanji-reading', 'SINGLE_CHOICE',
     'How is 「先生」 read?', '[{"id":"a","text":"せんせい"},{"id":"b","text":"がくせい"},{"id":"c","text":"せんしゅ"},{"id":"d","text":"せいと"}]', '["a"]', '先生 (せんせい) means teacher.'),
    ('aaaaaaaa-0000-4000-8000-000000000604', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000101', 'vocabulary', 'meaning', 'SINGLE_CHOICE',
     'What does 「ありがとう」 mean?', '[{"id":"a","text":"Good morning"},{"id":"b","text":"Thank you"},{"id":"c","text":"Excuse me"},{"id":"d","text":"Goodbye"}]', '["b"]', NULL),
    ('aaaaaaaa-0000-4000-8000-000000000605', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000101', 'vocabulary', 'meaning', 'SINGLE_CHOICE',
     'What does 「本」 mean?', '[{"id":"a","text":"book"},{"id":"b","text":"tree"},{"id":"c","text":"person"},{"id":"d","text":"day"}]', '["a"]', NULL),
    ('aaaaaaaa-0000-4000-8000-000000000606', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000101', 'vocabulary', 'meaning', 'SINGLE_CHOICE',
     'Which day is 「月曜日」?', '[{"id":"a","text":"Sunday"},{"id":"b","text":"Monday"},{"id":"c","text":"Tuesday"},{"id":"d","text":"Friday"}]', '["b"]', NULL),
    ('aaaaaaaa-0000-4000-8000-000000000607', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000101', 'vocabulary', 'meaning', 'FILL_BLANK',
     'Type the English meaning of 「ねこ」.', '[]', '["cat"]', 'ねこ means cat.'),
    ('aaaaaaaa-0000-4000-8000-000000000611', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000101', 'grammar', 'particles', 'SINGLE_CHOICE',
     'わたし（　）がくせいです。', '[{"id":"a","text":"を"},{"id":"b","text":"は"},{"id":"c","text":"に"},{"id":"d","text":"で"}]', '["b"]', 'は marks the topic of the sentence.'),
    ('aaaaaaaa-0000-4000-8000-000000000612', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000101', 'grammar', 'particles', 'SINGLE_CHOICE',
     'がっこう（　）いきます。', '[{"id":"a","text":"へ"},{"id":"b","text":"を"},{"id":"c","text":"が"},{"id":"d","text":"の"}]', '["a"]', 'へ marks the direction of movement.'),
    ('aaaaaaaa-0000-4000-8000-000000000613', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000101', 'grammar', 'particles', 'SINGLE_CHOICE',
     'みず（　）のみます。', '[{"id":"a","text":"を"},{"id":"b","text":"に"},{"id":"c","text":"へ"},{"id":"d","text":"で"}]', '["a"]', 'を marks the direct object.'),
    ('aaaaaaaa-0000-4000-8000-000000000614', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000101', 'grammar', 'particles', 'SINGLE_CHOICE',
     'これは わたし（　）ほんです。', '[{"id":"a","text":"の"},{"id":"b","text":"を"},{"id":"c","text":"に"},{"id":"d","text":"が"}]', '["a"]', 'の shows possession.'),
    ('aaaaaaaa-0000-4000-8000-000000000615', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000101', 'grammar', 'verb-forms', 'SINGLE_CHOICE',
     'きのう えいがを（　）。', '[{"id":"a","text":"みます"},{"id":"b","text":"みました"},{"id":"c","text":"みる"},{"id":"d","text":"みて"}]', '["b"]', 'きのう (yesterday) needs the past form みました.'),
    ('aaaaaaaa-0000-4000-8000-000000000616', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000101', 'grammar', 'particles', 'MULTIPLE_CHOICE',
     'Select every particle that can complete: がっこう（　）いきます。', '[{"id":"a","text":"へ"},{"id":"b","text":"に"},{"id":"c","text":"を"},{"id":"d","text":"が"}]', '["a","b"]', 'Both へ and に can mark a destination.');

-- Blueprints: a practice set in the free course and an unofficial mock in the paid course.
INSERT INTO exam_blueprints (id, tenant_id, program_id, course_id, title, kind, status, version, time_limit_sec, pass_percent, max_attempts, answer_release, shuffle_questions, approved_at) VALUES
    ('aaaaaaaa-0000-4000-8000-000000000501', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000101', 'aaaaaaaa-0000-4000-8000-000000000201',
     'Chapter practice: first words', 'PRACTICE', 'APPROVED', 1, 600, 60, NULL, 'AFTER_SUBMIT', false, now()),
    ('aaaaaaaa-0000-4000-8000-000000000502', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000101', 'aaaaaaaa-0000-4000-8000-000000000202',
     'N5 practice mock exam (unofficial)', 'MOCK', 'APPROVED', 1, 1800, 60, 3, 'AFTER_SUBMIT', true, now()),
    ('aaaaaaaa-0000-4000-8000-000000000503', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000101', 'aaaaaaaa-0000-4000-8000-000000000202',
     'N5 listening mock (draft)', 'MOCK', 'DRAFT', 1, 1200, 60, NULL, 'AFTER_SUBMIT', true, NULL);

INSERT INTO exam_blueprint_sections (tenant_id, blueprint_id, section_key, title, position, question_count) VALUES
    ('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000501', 'vocabulary', 'Vocabulary', 1, 3),
    ('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000502', 'vocabulary', 'Vocabulary (文字・語彙)', 1, 5),
    ('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000502', 'grammar', 'Grammar (文法)', 2, 5),
    ('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000503', 'listening', 'Listening', 1, 5);

-- ---------------------------------------------------------------------------
-- Tenant: Everest Skills Academy
-- ---------------------------------------------------------------------------
SELECT set_config('app.tenant_id', 'bbbbbbbb-0000-4000-8000-000000000001', true),
       set_config('app.user_id', '11111111-0000-4000-8000-000000000004', true);

INSERT INTO tenants (id, slug, name, status, default_locale, time_zone, primary_color, created_by_user_id)
VALUES ('bbbbbbbb-0000-4000-8000-000000000001', 'everest', 'Everest Skills Academy', 'ACTIVE',
        'en', 'Asia/Kathmandu', '#1565C0', '11111111-0000-4000-8000-000000000004');

INSERT INTO tenant_memberships (tenant_id, user_id, role) VALUES
    ('bbbbbbbb-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000004', 'OWNER'),
    ('bbbbbbbb-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000003', 'LEARNER');

INSERT INTO programs (id, tenant_id, slug, name, kind, language, level, position) VALUES
    ('bbbbbbbb-0000-4000-8000-000000000101', 'bbbbbbbb-0000-4000-8000-000000000001', 'networking', 'Networking', 'IT', NULL, 'Beginner', 1);

INSERT INTO courses (id, tenant_id, program_id, slug, status, price_minor, currency, created_by_user_id) VALUES
    ('bbbbbbbb-0000-4000-8000-000000000201', 'bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000101',
     'networking-fundamentals', 'PUBLISHED', 0, 'NPR', '11111111-0000-4000-8000-000000000004');

INSERT INTO course_versions (id, tenant_id, course_id, version, status, title, summary, language, outcomes, published_at) VALUES
    ('bbbbbbbb-0000-4000-8000-000000000301', 'bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000201', 1, 'PUBLISHED',
     'Networking Fundamentals', 'IP addresses, subnets, and how packets find their way.', 'en',
     ARRAY['Explain IPv4 addressing', 'Calculate a subnet'], now());

UPDATE courses SET published_version_id = 'bbbbbbbb-0000-4000-8000-000000000301' WHERE id = 'bbbbbbbb-0000-4000-8000-000000000201';

INSERT INTO sections (id, tenant_id, course_version_id, title, position) VALUES
    ('bbbbbbbb-0000-4000-8000-000000000401', 'bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000301', 'Chapter 1: Addresses', 1);

INSERT INTO lessons (id, tenant_id, section_id, title, kind, position, body_markdown, is_preview) VALUES
    ('bbbbbbbb-0000-4000-8000-000000000451', 'bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000401',
     'What is an IP address?', 'TEXT', 1, E'# IP addresses\n\nAn IPv4 address is 32 bits, written as four numbers such as 192.168.1.10.', true);

INSERT INTO questions (id, tenant_id, program_id, section_key, topic, type, prompt, choices, answer_key) VALUES
    ('bbbbbbbb-0000-4000-8000-000000000601', 'bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000101', 'addressing', 'ipv4', 'SINGLE_CHOICE',
     'How many bits are in an IPv4 address?', '[{"id":"a","text":"16"},{"id":"b","text":"32"},{"id":"c","text":"64"},{"id":"d","text":"128"}]', '["b"]');

INSERT INTO exam_blueprints (id, tenant_id, program_id, course_id, title, kind, status, time_limit_sec, pass_percent, approved_at) VALUES
    ('bbbbbbbb-0000-4000-8000-000000000501', 'bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000101', 'bbbbbbbb-0000-4000-8000-000000000201',
     'Addressing quiz', 'PRACTICE', 'APPROVED', 300, 50, now());

INSERT INTO exam_blueprint_sections (tenant_id, blueprint_id, section_key, title, position, question_count) VALUES
    ('bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000501', 'addressing', 'Addressing', 1, 1);

COMMIT;
