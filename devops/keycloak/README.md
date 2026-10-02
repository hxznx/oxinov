# Oxinov identity server (`id.oxinov.com`)

Keycloak implements the one Oxinov account (ADR-011) with the sign-in design in ADR-016: Continue with Google, or an email address followed by a six-digit email code. There is no customer password anywhere.

## Files

| File | Purpose |
| --- | --- |
| `Dockerfile` | Keycloak 26.7.5 pinned by digest, plus `email-otp-authenticator` v1.5.0 fetched by exact release URL and SHA-256 |
| `configure-realm.sh` | Idempotent local setup of the `oxinov` realm: flows, token lifetimes, SMTP, and the account portal client |
| `init-db.sh` | Local Docker init: creates the `keycloak` database and role on a fresh PostgreSQL volume |
| `admin/` | Separate local administrator environment and operator instructions; real credentials stay untracked |
| `themes/oxinov/` | Oxinov sign-in pages and emails for the `oxinov` realm (see [Sign-in pages](#sign-in-pages-and-emails)) |

## Supply chain

The email-code extension (`for-keycloak/email-otp-authenticator`, Unlicense) was checked on 2026-09-24:

- SHA-256 `deb04851…d3d42a` matches the digest GitHub publishes for the release asset; the Docker build refuses any other file.
- Its Sigstore bundle verifies (`cosign verify-blob`) against a certificate issued to the project's own GitHub Actions workflow.
- The extension release is built for Keycloak 26.7.3; the image runs 26.7.5 in the same minor version (upgraded from 26.7.4 on 2026-10-02 with the same extension file and checksum). Upgrade Keycloak and the extension together across minor versions, and repeat both checks. Keycloak 26.8 waits for an extension build for 26.8.
- **Code review (ADR-016), 2026-09-30:** the source at tag `v1.5.0` (commit `bdf32589`) was reviewed, mainly `EmailOTPFormAuthenticator.java`, the flow the realm uses.
  - **Sound:**
    - Codes come from `SecureRandom` and are compared in constant time (`MessageDigest.isEqual`).
    - A code is kept only in the server-side authentication session, removed once used, and expires after `code-lifetime`. A correct but expired code gets a fresh one.
    - A wrong code is a `failureChallenge` with `INVALID_CREDENTIALS`, so Keycloak's brute-force lockout counts it.
    - A locked or disabled account is refused before any check.
    - The code is never logged. Email addresses are masked where shown.
  - **Unused:** device trust (a signed cookie) and IP trust (a salted hash) are both off (`device-trust-enabled=false`, `ip-trust-enabled=false`), so their code paths do not run. The extension still creates its two trust tables in the Keycloak database.
  - **Gap found and closed:** "Send a new code" and every new sign-in attempt send an email with no limit. The in-cluster `mail-relay` now caps mail at 5 messages per address per 15 minutes and 60 a minute overall (`backend/workers/mail-relay`, `MAIL_LIMIT_*`). Keycloak then shows "We could not send the email just now…", and nothing reaches SES.
  - **Minor, accepted:** the unknown-email message tells people an account does not exist. Keycloak's own registration also reveals this ("already uses this email"), and the product needs it for "create an account".
  - **Re-review** the extension when it is upgraded.

## Run locally

```bash
cp devops/keycloak/admin/.env.example devops/keycloak/admin/.env
# Replace every change-me value, then:
bash devops/keycloak/admin/start-local.sh
```

- Sign-in page: `http://localhost:8080/realms/oxinov/account`
- Local inbox with every sign-in code and confirmation email (Mailpit): `http://localhost:8025`
- Admin console: `http://localhost:8080/admin` with `KEYCLOAK_ADMIN_USER` and `KEYCLOAK_ADMIN_PASSWORD` from `admin/.env`, plus a code from an authenticator app (the first sign-in shows a QR code to scan). The separate `KEYCLOAK_AUTOMATION_SECRET` lets realm configuration use its service account instead of a person's session.
- User management: use the **Users** area in the admin console. Customer accounts remain in the `oxinov` realm; staff administration stays in `master` until the planned separate staff realm is implemented (FR-ID-2209).

## What the realm enforces

| Setting | Value | Requirement |
| --- | --- | --- |
| Browser flow `oxinov-browser` | Cookie, or Identity Provider Redirector, or Username Form then Email OTP Form (six digits, 10 minutes, single use, IP and device trust off) | FR-ID-2202, FR-ID-2204 |
| First broker login `oxinov-first-broker` | Review missing profile fields, create the user if unique, otherwise link only after an emailed confirmation | FR-ID-2206 |
| Staff sign-in (master realm) `oxinov-staff-browser` | Password **and** a six-digit authenticator-app code (TOTP, 30 seconds); the first console sign-in requires setting the app up; brute-force lockout after 5 failures | FR-ID-2209 |
| `oxinov-automation` client (master realm) | Confidential service account with the master `admin` role, secret `KEYCLOAK_AUTOMATION_SECRET` (Parameter Store in production); `configure-realm.sh` signs in with it, so an administrator's second factor never blocks a deploy | FR-ID-2209 |
| Access tokens | 10 minutes; refresh tokens rotate and cannot be reused | FR-ID-2208 |
| Sessions | 30 days idle, 90 days maximum | Identity and access design |
| Brute-force detection | On, lockout after 5 failures | Threat model |
| Audit events (both realms) | Security-relevant sign-in events (sign-in, registration, sign-out, email verification, identity provider, errors) kept 365 days; admin changes recorded without request bodies; routine token refreshes not recorded | Data retention (audit logs at least one year) |
| Redirects | Each web client accepts exactly `<app URL>/auth/callback` after sign-in and `<app URL>/` after sign-out | Threat model (open redirect, code theft) |
| Admin realm name | `master` shows "Ox Inov Pvt. Ltd. Administration" | Brand system |
| Pages and emails | `loginTheme` and `emailTheme` `oxinov`, English only; the `master` realm keeps Keycloak's own pages | Brand system, ADR-020 |
| Email confirmation links | Work once, for 30 minutes (`actionTokenGeneratedByUserLifespan.verify-email` and `.update-email` 1800; Keycloak's default is 5) | FR-ID-2202 |
| Account page | `accountTheme` `oxinov` (Oxinov logo and colors on Keycloak's page). Kept for signed-in devices and "sign out" (FR-ID-2208) and for changing the email; the portal links to both | FR-ID-2208 |
| Customer sign-in methods | Authenticator app, security keys, and recovery codes are off (`CONFIGURE_TOTP`, `webauthn-register*`, `CONFIGURE_RECOVERY_AUTHN_CODES`), so the account page offers nothing that sign-in does not use | FR-ID-2204 |
| Changing email | `UPDATE_EMAIL` on and `editUsernameAllowed=true`: the new address gets a confirmation link and applies only once opened. Direct edits through the account API are ignored (tested 2026-09-30). The platform and Edu APIs pick up the new email from the next token | FR-ID-2206 |
| Automation account | `oxinov-automation` holds only `oxinov-realm` roles (view and manage realm, clients, events, and identity providers), with no `admin` role and no rights in `master` | Least privilege |
| Sign-in metrics | `KC_EVENT_METRICS_USER_ENABLED` (a build-time option in the `Dockerfile`; setting it at runtime stops `start --optimized`) publishes `keycloak_user_events_total` (event, error, client, realm; no personal data) for the `oxinov-identity` alerts | FR-ID-2208 |
| Continue with Google | Added by the script when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set (Parameter Store in production), with `trustEmail` and the `oxinov-first-broker` linking flow | FR-ID-2201 |
| `oxinov-platform-web` client | Confidential, authorization code with PKCE S256, access tokens for audience `oxinov-platform-api` only | FR-ID-2207 |
| `oxinov-edu-web` client | Same settings for Oxinov Edu (`EDU_WEB_URL`, default `http://localhost:3002`), access tokens for audience `oxinov-lms-api` only; shares the realm session, so a signed-in person is not asked again | FR-ID-2207 |

**Sign-in smoke test:** `node devops/keycloak/signin-smoke.mjs` drives the real flow without a browser. It checks the branded page, an unknown email, the emailed code (read from Mailpit), a wrong code, and the right code, then the redirect back to the portal. With `CLIENT_SECRET`, it also checks the token's audience, lifetime, and verified email. It runs at the end of `admin/start-local.sh`, and it refuses to run against anything but localhost.

Verified end to end on 2026-09-24: email-only sign-in page, code delivered to Mailpit, token with audience `oxinov-platform-api` and a 600-second lifetime, single sign-on on a second authorization, and the platform API accepting the token for `/v1/me`, the welcome step, and entitlements.

## Sign-in pages and emails

`themes/oxinov/` replaces Keycloak's look for customers. The Dockerfile copies it into the image, and local Compose mounts it, so an edit shows on the next page load.

- **Login theme** (`login/`): built on Keycloak's unstyled `base` theme, so no PatternFly or third-party styles load. Pages:
  - `template.ftl`: the shared layout, with logo, card, "Trouble signing in?", and footer.
  - `login-username.ftl`: the email step.
  - `login-email-otp.ftl`: the six-digit code. It replaces the extension's template and keeps its field and button names.
  - `login-verify-email.ftl`, `error.ftl`, and `logout-confirm.ftl`.

  Account creation (`register.ftl`) and every other page use Keycloak's own markup with Oxinov classes from `theme.properties`, styled by `resources/css/oxinov.css`.
- **Emails** (`email/`): the sign-in code and the email confirmation. They use inline styles in the Daylight colors, because email apps ignore stylesheets.
- **Wording:** in `messages/messages_en.properties`, in plain English. Customers have no password (FR-ID-2204), so there is no "forgot password". "Trouble signing in?" links to `oxinov.com/help/sign-in/`, and any fact that page states must match `configure-realm.sh`.
- **Brand files:** `resources/css/tokens.css` and the two symbol SVGs are exact copies from `packages/design-system`, and `scripts/validate_project.py` fails when they drift. After a design-system change, copy them again.
- **Changing the theme:** a theme change rebuilds the Keycloak image (`services.yaml` inputs). It changes what every customer sees at sign-in, so rehearse it locally with `admin/start-local.sh`. If the theme were missing, Keycloak would fall back to its default look rather than fail.

## Not yet configured

- Google identity provider: the script is ready. It needs the owner's OAuth client from Google Cloud (see the [production runbook](../kubernetes/README.md#sign-in-administration-keycloak)).
- Refusing Google accounts with unverified emails at Keycloak (today the platform API refuses them at the welcome step with `EMAIL_NOT_VERIFIED`).
- Apple sign-in and the separate `oxinov-staff` realm.

Production hostname, TLS, and proxy settings are set in the chart: `KC_HOSTNAME=https://id.oxinov.com`, `KC_HOSTNAME_ADMIN`, and `KC_PROXY_HEADERS=xforwarded`, with TLS terminated by Traefik; `/admin` and `/realms/master` are closed on the public host.

## Assistant skills

Coding assistants working here follow [oxinov-ingress-tls](../../.claude/skills/oxinov-ingress-tls/SKILL.md), [oxinov-keycloak](../../.claude/skills/oxinov-keycloak/SKILL.md), [oxinov-authentication-sessions](../../.claude/skills/oxinov-authentication-sessions/SKILL.md), [oxinov-platform-integration](../../.claude/skills/oxinov-platform-integration/SKILL.md), [oxinov-security](../../.claude/skills/oxinov-security/SKILL.md), [oxinov-kubernetes](../../.claude/skills/oxinov-kubernetes/SKILL.md), [oxinov-server](../../.claude/skills/oxinov-server/SKILL.md). All rules and skills: [AI knowledge](../../docs/14-ai-knowledge/README.md).
