-- Paid courses through Khalti and eSewa (FR-CATALOG-303, FR-PAY-2701, FR-PAY-2702, ADR-023).
-- A payment is verified with the provider on the server before anything is granted; the provider
-- transaction is recorded once in provider_events, and one payment grants at most one entitlement.
ALTER TYPE "payment_provider" ADD VALUE IF NOT EXISTS 'KHALTI';
ALTER TYPE "payment_provider" ADD VALUE IF NOT EXISTS 'ESEWA';

ALTER TABLE "payments"
    ADD COLUMN "provider_transaction_id" VARCHAR(255),
    ADD COLUMN "verified_at" TIMESTAMPTZ(3),
    ADD COLUMN "failure_reason" VARCHAR(500);

-- A payment is only marked as succeeded after server-side verification.
ALTER TABLE "payments"
    ADD CONSTRAINT "payments_succeeded_is_verified" CHECK ("status" <> 'SUCCEEDED' OR "verified_at" IS NOT NULL);

-- The learner's own payment history, newest first.
CREATE INDEX "payments_tenant_user_course_idx" ON "payments" ("tenant_id", "user_id", "course_id", "created_at" DESC);
