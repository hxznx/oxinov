-- Email allowance (FR-COMM-705). Reminders and notices may use only a configured share of the provider's
-- daily allowance, so sign-in codes and payment emails always go out. A notification that should also be
-- emailed is marked `email_wanted`; `emailed_at` records the send. When today's share is used up the email
-- waits and the hourly sweep sends it the next day. Additive only.

ALTER TABLE "notifications"
    ADD COLUMN "email_wanted" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "emailed_at" TIMESTAMPTZ(3);

-- CreateIndex
CREATE INDEX "notifications_tenant_id_email_wanted_emailed_at_idx" ON "notifications"("tenant_id", "email_wanted", "emailed_at");

-- One counter per UTC day for the shared share. It holds no personal or workspace data, so it has no
-- tenant and no row-level security; the application role may only read and count.
CREATE TABLE "email_daily_usage" (
    "day" DATE NOT NULL,
    "category" VARCHAR(20) NOT NULL,
    "sent" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "email_daily_usage_pkey" PRIMARY KEY ("day", "category"),
    CONSTRAINT "email_daily_usage_sent_non_negative" CHECK ("sent" >= 0)
);

GRANT SELECT, INSERT, UPDATE ON "email_daily_usage" TO oxinov_app;
