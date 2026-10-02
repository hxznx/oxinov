-- Payment match checks (FR-MGMT-1405). With the receipt the learner now says how much they paid and whether
-- they wrote the payment reference in the bank remarks, and the API records a SHA-256 fingerprint of the
-- receipt file, so the reviewer sees a different amount or a receipt already sent for another payment.
-- All three are nullable: payments sent before this change have none. Additive only.

ALTER TABLE "payments"
    ADD COLUMN "paid_amount_minor" INTEGER,
    ADD COLUMN "reference_included" BOOLEAN,
    ADD COLUMN "evidence_sha256" CHAR(64),
    ADD CONSTRAINT "payments_paid_amount_positive" CHECK ("paid_amount_minor" IS NULL OR "paid_amount_minor" > 0),
    ADD CONSTRAINT "payments_evidence_sha256_hex" CHECK ("evidence_sha256" IS NULL OR "evidence_sha256" ~ '^[0-9a-f]{64}$');

-- CreateIndex
CREATE INDEX "payments_tenant_id_evidence_sha256_idx" ON "payments"("tenant_id", "evidence_sha256");
