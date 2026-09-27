-- Oxinov Edu's product key becomes `edu` (ADR-027). The foreign key from entitlements to
-- products is ON UPDATE CASCADE, so the first statement also moves every entitlement row to
-- the new product key. Member access is stored as `<product>.member` (FR-PLAN-2603), so the
-- entitlement keys are renamed too; otherwise each person would receive a second `edu.member`
-- row beside a stale `lms.member`. Both statements are no-ops if the key was already renamed.
UPDATE "products" SET "key" = 'edu' WHERE "key" = 'lms';

UPDATE "entitlements"
SET "entitlement_key" = 'edu.' || substr("entitlement_key", 5)
WHERE "product_key" = 'edu' AND "entitlement_key" LIKE 'lms.%';
