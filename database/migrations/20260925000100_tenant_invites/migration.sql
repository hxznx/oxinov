-- Workspace join codes (FR-AUTH-102, FR-TENANT): an administrator shares a short code, like a class
-- code; redeeming it creates a membership with the invite's role. See backend/api/src/tenants/invites.service.ts.

-- CreateTable
CREATE TABLE "tenant_invites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "code" VARCHAR(16) NOT NULL,
    "role" "tenant_role" NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "max_uses" INTEGER,
    "use_count" INTEGER NOT NULL DEFAULT 0,
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_invites_code_key" ON "tenant_invites"("code");

-- CreateIndex
CREATE INDEX "tenant_invites_tenant_id_created_at_idx" ON "tenant_invites"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_invites_tenant_id_id_key" ON "tenant_invites"("tenant_id", "id");

-- AddForeignKey
ALTER TABLE "tenant_invites" ADD CONSTRAINT "tenant_invites_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_invites" ADD CONSTRAINT "tenant_invites_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Integrity: 8-character codes without look-alike characters (no 0, O, 1, I, L); invites never grant
-- ownership; counters stay within their limit.
ALTER TABLE "tenant_invites"
    ADD CONSTRAINT "tenant_invites_code_format" CHECK ("code" ~ '^[A-HJKMNP-Z2-9]{8}$'),
    ADD CONSTRAINT "tenant_invites_role_not_owner" CHECK ("role" <> 'OWNER'),
    ADD CONSTRAINT "tenant_invites_max_uses_positive" CHECK ("max_uses" IS NULL OR "max_uses" > 0),
    ADD CONSTRAINT "tenant_invites_use_count_valid" CHECK ("use_count" >= 0 AND ("max_uses" IS NULL OR "use_count" <= "max_uses"));

GRANT SELECT, INSERT, UPDATE ON "tenant_invites" TO oxinov_app;

-- Row-level security. Administrators work inside their tenant. A person redeeming a code is not yet a
-- member, so the application sets app.invite_code and may read only the invite with exactly that code;
-- it then switches app.tenant_id to that invite's tenant to record the membership. Invites can never
-- be listed across tenants.
ALTER TABLE "tenant_invites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_invites" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_invites_select" ON "tenant_invites" FOR SELECT
    USING (
        "tenant_id" = app_current_tenant_id()
        OR "code" = nullif(current_setting('app.invite_code', true), '')
    );
CREATE POLICY "tenant_invites_insert" ON "tenant_invites" FOR INSERT
    WITH CHECK ("tenant_id" = app_current_tenant_id() AND "created_by_user_id" = app_current_user_id());
CREATE POLICY "tenant_invites_update" ON "tenant_invites" FOR UPDATE
    USING ("tenant_id" = app_current_tenant_id())
    WITH CHECK ("tenant_id" = app_current_tenant_id());
