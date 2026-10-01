-- Access plans, bank QR payments with manual review, coupons, and store settings
-- (ADR-028; FR-CATALOG-305, FR-CATALOG-307, FR-CATALOG-317, FR-MGMT-1403, FR-MGMT-1408).
-- A bank QR payment is created with a reference, receives the learner's bank transaction ID and
-- screenshot, waits in PENDING_REVIEW, and grants access only when an administrator approves it.

ALTER TYPE "payment_provider" ADD VALUE IF NOT EXISTS 'BANK_QR';
ALTER TYPE "payment_status" ADD VALUE IF NOT EXISTS 'PENDING_REVIEW';
ALTER TYPE "payment_status" ADD VALUE IF NOT EXISTS 'REJECTED';

-- CreateEnum
CREATE TYPE "plan_period" AS ENUM ('MONTH_1', 'MONTH_6', 'YEAR_1', 'LIFETIME');

-- CreateTable
CREATE TABLE "course_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "period" "plan_period" NOT NULL,
    "price_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'NPR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "percent_off" INTEGER,
    "amount_off_minor" INTEGER,
    "course_id" UUID,
    "period" "plan_period",
    "starts_at" TIMESTAMPTZ(3),
    "ends_at" TIMESTAMPTZ(3),
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_settings" (
    "tenant_id" UUID NOT NULL,
    "bank_qr_object_key" VARCHAR(300),
    "bank_qr_content_type" VARCHAR(120),
    "account_name" VARCHAR(120),
    "account_number" VARCHAR(60),
    "bank_name" VARCHAR(120),
    "reference_prefix" VARCHAR(8) NOT NULL DEFAULT 'OXE-',
    "review_time_text" VARCHAR(120) NOT NULL DEFAULT 'Usually within a few hours',
    "help_contact" VARCHAR(120),
    "refund_policy" TEXT NOT NULL DEFAULT '',
    "default_month1_minor" INTEGER NOT NULL DEFAULT 500000,
    "default_month6_minor" INTEGER NOT NULL DEFAULT 1000000,
    "default_year1_minor" INTEGER NOT NULL DEFAULT 1500000,
    "default_lifetime_minor" INTEGER NOT NULL DEFAULT 2000000,
    "updated_by_user_id" UUID,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("tenant_id")
);

-- AlterTable
ALTER TABLE "payments"
    ADD COLUMN "plan_id" UUID,
    ADD COLUMN "plan_period" "plan_period",
    ADD COLUMN "list_price_minor" INTEGER,
    ADD COLUMN "discount_minor" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "coupon_id" UUID,
    ADD COLUMN "bank_transaction_id" VARCHAR(80),
    ADD COLUMN "evidence_object_key" VARCHAR(300),
    ADD COLUMN "evidence_content_type" VARCHAR(120),
    ADD COLUMN "submitted_at" TIMESTAMPTZ(3),
    ADD COLUMN "reviewed_by_user_id" UUID,
    ADD COLUMN "reviewed_at" TIMESTAMPTZ(3),
    ADD COLUMN "review_reason" VARCHAR(500);

-- CreateIndex
CREATE UNIQUE INDEX "course_plans_tenant_id_id_key" ON "course_plans"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "course_plans_tenant_id_course_id_period_key" ON "course_plans"("tenant_id", "course_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_tenant_id_id_key" ON "coupons"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_tenant_id_code_key" ON "coupons"("tenant_id", "code");

-- CreateIndex: one bank transaction pays for one payment per seller (FR-CATALOG-307).
CREATE UNIQUE INDEX "payments_tenant_id_bank_transaction_id_key" ON "payments"("tenant_id", "bank_transaction_id");

-- CreateIndex: the review queue, oldest first.
CREATE INDEX "payments_tenant_id_status_submitted_at_idx" ON "payments"("tenant_id", "status", "submitted_at");

-- AddForeignKey
ALTER TABLE "course_plans" ADD CONSTRAINT "course_plans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_plans" ADD CONSTRAINT "course_plans_tenant_id_course_id_fkey" FOREIGN KEY ("tenant_id", "course_id") REFERENCES "courses"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_tenant_id_course_id_fkey" FOREIGN KEY ("tenant_id", "course_id") REFERENCES "courses"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_plan_id_fkey" FOREIGN KEY ("tenant_id", "plan_id") REFERENCES "course_plans"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_coupon_id_fkey" FOREIGN KEY ("tenant_id", "coupon_id") REFERENCES "coupons"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Rules the database enforces even if the API is wrong. Enum values added above cannot be used in
-- this transaction, so status checks compare text.
ALTER TABLE "course_plans"
    ADD CONSTRAINT "course_plans_price_positive" CHECK ("price_minor" > 0),
    ADD CONSTRAINT "course_plans_currency_format" CHECK ("currency" ~ '^[A-Z]{3}$');
ALTER TABLE "coupons"
    ADD CONSTRAINT "coupons_code_format" CHECK ("code" ~ '^[A-Z0-9][A-Z0-9-]{2,39}$'),
    ADD CONSTRAINT "coupons_one_discount" CHECK (("percent_off" IS NULL) <> ("amount_off_minor" IS NULL)),
    ADD CONSTRAINT "coupons_percent_range" CHECK ("percent_off" IS NULL OR "percent_off" BETWEEN 1 AND 100),
    ADD CONSTRAINT "coupons_amount_positive" CHECK ("amount_off_minor" IS NULL OR "amount_off_minor" > 0),
    ADD CONSTRAINT "coupons_uses" CHECK ("used_count" >= 0 AND ("max_uses" IS NULL OR "max_uses" > 0)),
    ADD CONSTRAINT "coupons_dates" CHECK ("starts_at" IS NULL OR "ends_at" IS NULL OR "starts_at" < "ends_at");
ALTER TABLE "store_settings"
    ADD CONSTRAINT "store_settings_qr_key_in_tenant" CHECK ("bank_qr_object_key" IS NULL OR "bank_qr_object_key" LIKE 'tenants/' || "tenant_id"::text || '/%'),
    ADD CONSTRAINT "store_settings_prices_positive" CHECK ("default_month1_minor" > 0 AND "default_month6_minor" > 0 AND "default_year1_minor" > 0 AND "default_lifetime_minor" > 0);
ALTER TABLE "payments"
    ADD CONSTRAINT "payments_discount_range" CHECK ("discount_minor" >= 0 AND ("list_price_minor" IS NULL OR "discount_minor" <= "list_price_minor")),
    ADD CONSTRAINT "payments_evidence_key_in_tenant" CHECK ("evidence_object_key" IS NULL OR "evidence_object_key" LIKE 'tenants/' || "tenant_id"::text || '/%'),
    ADD CONSTRAINT "payments_review_needs_evidence" CHECK ("status"::text <> 'PENDING_REVIEW' OR ("bank_transaction_id" IS NOT NULL AND "submitted_at" IS NOT NULL)),
    ADD CONSTRAINT "payments_rejection_has_reason" CHECK ("status"::text <> 'REJECTED' OR ("review_reason" IS NOT NULL AND "reviewed_at" IS NOT NULL));

GRANT SELECT, INSERT, UPDATE ON "course_plans", "coupons", "store_settings" TO oxinov_app;

-- Row-level security: everything belongs to its tenant; roles are checked by the API.
ALTER TABLE "course_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "course_plans" FORCE ROW LEVEL SECURITY;
CREATE POLICY "course_plans_tenant_isolation" ON "course_plans" FOR ALL
    USING ("tenant_id" = app_current_tenant_id())
    WITH CHECK ("tenant_id" = app_current_tenant_id());
ALTER TABLE "coupons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "coupons" FORCE ROW LEVEL SECURITY;
CREATE POLICY "coupons_tenant_isolation" ON "coupons" FOR ALL
    USING ("tenant_id" = app_current_tenant_id())
    WITH CHECK ("tenant_id" = app_current_tenant_id());
ALTER TABLE "store_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "store_settings" FORCE ROW LEVEL SECURITY;
CREATE POLICY "store_settings_tenant_isolation" ON "store_settings" FOR ALL
    USING ("tenant_id" = app_current_tenant_id())
    WITH CHECK ("tenant_id" = app_current_tenant_id());
