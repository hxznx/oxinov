-- Product catalogue reference data (FR-OPS-3302). Every product starts unlaunched; an operator
-- records the release gate and sets `launched` when a product passes it.
INSERT INTO "products" ("key", "name", "address", "launched") VALUES
    ('lms', 'Oxinov Edu', 'edu.oxinov.com', false),
    ('market', 'Oxinov Commodity Market', 'market.oxinov.com', false),
    ('jobs', 'Oxinov Jobs', 'jobs.oxinov.com', false),
    ('services', 'Oxinov Services Market', 'services.oxinov.com', false);
