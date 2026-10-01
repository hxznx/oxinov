-- Policy versions accepted on the welcome screen (FR-ID-2205, FR-POLICY-2401). They are reference
-- data that every environment needs: without a sign-up policy the welcome form sends an empty
-- acceptance list, which the platform API refuses, so no new account can finish sign-up. The pages
-- are published by the company site (frontend/company-web). Existing versions are left untouched;
-- later versions are added by their own migrations.
INSERT INTO "policies" ("id", "version", "title", "url", "material", "required_for_signup", "effective_at") VALUES
    ('terms', 1, 'Oxinov Terms of Service', 'https://oxinov.com/legal/terms/', true, true, '2026-09-01T00:00:00Z'),
    ('privacy', 1, 'Oxinov Privacy Policy', 'https://oxinov.com/legal/privacy/', true, true, '2026-09-01T00:00:00Z'),
    ('acceptable-use', 1, 'Acceptable Use and Community Policy', 'https://oxinov.com/legal/acceptable-use/', true, false, '2026-09-01T00:00:00Z')
ON CONFLICT ("id", "version") DO NOTHING;
