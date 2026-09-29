# Keycloak administration

This folder keeps local Keycloak administrator configuration separate from application configuration. It implements the operational boundary for FR-ID-2209 without committing credentials.

## Local setup

```bash
cp devops/keycloak/admin/.env.example devops/keycloak/admin/.env
# Replace every change-me value.
bash devops/keycloak/admin/start-local.sh
```

Open `http://localhost:8080/admin`, sign in with the administrator name and password from `.env`, and enroll the authenticator-app code requested on first sign-in.

Use the `oxinov` realm's **Users** area to find, enable, disable, or sign out customer accounts. Do not set customer passwords: Oxinov customers sign in with Google or an email one-time code (FR-ID-2204). Use the `master` realm only for Keycloak administration.

## Secret handling

- `admin/.env` is ignored by Git; only `.env.example` is committed.
- Use a unique administrator password and a different random automation secret of at least 24 characters.
- Never put MFA seeds, recovery codes, access tokens, or real customer data in this folder.
- Production credentials remain in AWS Systems Manager Parameter Store. Access the production console only through `devops/scripts/oxctl keycloak-admin`; it is not public.
- The local Keycloak and the production tunnel both use `localhost:8080`. Stop the local container (`docker stop oxinov-lms-keycloak-1`) before opening the production console, or your sign-in goes to the local copy with its own password.
- Realm automation uses `KEYCLOAK_AUTOMATION_SECRET`. A person uses `KEYCLOAK_ADMIN_USER`, `KEYCLOAK_ADMIN_PASSWORD`, and MFA.

Disabling accounts, ending sessions, or changing roles affects users immediately. Production changes require the owner's approval and must be recorded through the normal operational process.
