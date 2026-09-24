-- Oxinov Platform control plane: initial schema generated from database/platform/prisma/schema.prisma.
-- Owner isolation, the application role, and constraints Prisma cannot express are in 20260924100200.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "account_status" AS ENUM ('PENDING_WELCOME', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "trust_level" AS ENUM ('T1', 'T2', 'T3', 'T4');

-- CreateEnum
CREATE TYPE "acceptance_channel" AS ENUM ('WEB', 'ANDROID', 'IOS');

-- CreateEnum
CREATE TYPE "entitlement_source" AS ENUM ('MEMBER', 'PLAN', 'GRANT');

-- CreateTable
CREATE TABLE "user_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "auth_subject" VARCHAR(255) NOT NULL,
    "email" VARCHAR(320),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "display_name" VARCHAR(120),
    "country" CHAR(2),
    "status" "account_status" NOT NULL DEFAULT 'PENDING_WELCOME',
    "trust_level" "trust_level" NOT NULL DEFAULT 'T1',
    "age_confirmed_at" TIMESTAMPTZ(3),
    "welcomed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policies" (
    "id" VARCHAR(40) NOT NULL,
    "version" INTEGER NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "material" BOOLEAN NOT NULL DEFAULT true,
    "required_for_signup" BOOLEAN NOT NULL DEFAULT false,
    "effective_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id","version")
);

-- CreateTable
CREATE TABLE "policy_acceptances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "policy_id" VARCHAR(40) NOT NULL,
    "policy_version" INTEGER NOT NULL,
    "accepted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" "acceptance_channel" NOT NULL,
    "locale" VARCHAR(16) NOT NULL,

    CONSTRAINT "policy_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "key" VARCHAR(20) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "address" VARCHAR(120) NOT NULL,
    "launched" BOOLEAN NOT NULL DEFAULT false,
    "release_gate_recorded_at" TIMESTAMPTZ(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "entitlements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "product_key" VARCHAR(20) NOT NULL,
    "entitlement_key" VARCHAR(80) NOT NULL,
    "source" "entitlement_source" NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_user_id" UUID,
    "action" VARCHAR(120) NOT NULL,
    "target_type" VARCHAR(80) NOT NULL,
    "target_id" VARCHAR(120),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_accounts_auth_subject_key" ON "user_accounts"("auth_subject");

-- CreateIndex
CREATE UNIQUE INDEX "policy_acceptances_user_id_policy_id_policy_version_key" ON "policy_acceptances"("user_id", "policy_id", "policy_version");

-- CreateIndex
CREATE INDEX "entitlements_user_id_idx" ON "entitlements"("user_id");

-- CreateIndex
CREATE INDEX "audit_events_actor_user_id_created_at_idx" ON "audit_events"("actor_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "policy_acceptances" ADD CONSTRAINT "policy_acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_acceptances" ADD CONSTRAINT "policy_acceptances_policy_id_policy_version_fkey" FOREIGN KEY ("policy_id", "policy_version") REFERENCES "policies"("id", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_product_key_fkey" FOREIGN KEY ("product_key") REFERENCES "products"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

