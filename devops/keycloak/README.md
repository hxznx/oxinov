# Oxinov identity server (`id.oxinov.com`)

Keycloak implements the one Oxinov account (ADR-011) with the sign-in design in ADR-016: Continue with Google, or an email address followed by a six-digit email code. There is no customer password anywhere.

## Files

| File | Purpose |
| --- | --- |
| `Dockerfile` | Keycloak 26.7.3 pinned by digest, plus `email-otp-authenticator` v1.5.0 fetched by exact release URL and SHA-256 |
| `configure-realm.sh` | Idempotent local setup of the `oxinov` realm: flows, token lifetimes, SMTP, and the account portal client |
| `init-db.sh` | Local Docker init: creates the `keycloak` database and role on a fresh PostgreSQL volume |

## Supply chain

The email-code extension (`for-keycloak/email-otp-authenticator`, Unlicense) was checked on 2026-09-24:

- SHA-256 `deb04851…d3d42a` matches the digest GitHub publishes for the release asset; the Docker build refuses any other file.
- Its Sigstore bundle verifies (`cosign verify-blob`) against a certificate issued to the project's own GitHub Actions workflow.
- Keycloak stays on 26.7.3, the version the extension is built for. Upgrade Keycloak and the extension together, and repeat both checks.
- A code review of the extension is required before production (ADR-016).

## Run locally

```bash
docker compose --profile identity up -d --wait
bash devops/keycloak/configure-realm.sh
```

- Sign-in page: `http://localhost:8080/realms/oxinov/account`
- Local inbox with every sign-in code and confirmation email (Mailpit): `http://localhost:8025`
- Admin console: `http://localhost:8080/admin` with `KEYCLOAK_ADMIN_USER` and `KEYCLOAK_ADMIN_PASSWORD` from `.env`

## What the realm enforces

| Setting | Value | Requirement |
| --- | --- | --- |
| Browser flow `oxinov-browser` | Cookie, or Identity Provider Redirector, or Username Form then Email OTP Form (six digits, 10 minutes, single use, IP and device trust off) | FR-ID-2202, FR-ID-2204 |
| First broker login `oxinov-first-broker` | Review missing profile fields, create the user if unique, otherwise link only after an emailed confirmation | FR-ID-2206 |
| Access tokens | 10 minutes; refresh tokens rotate and cannot be reused | FR-ID-2208 |
| Sessions | 30 days idle, 90 days maximum | Identity and access design |
| Brute-force detection | On, lockout after 5 failures | Threat model |
| `oxinov-platform-web` client | Confidential, authorization code with PKCE S256, access tokens for audience `oxinov-platform-api` only | FR-ID-2207 |
| `oxinov-edu-web` client | Same settings for Oxinov Edu (`EDU_WEB_URL`, default `http://localhost:3002`), access tokens for audience `oxinov-lms-api` only; shares the realm session, so a signed-in person is not asked again | FR-ID-2207 |

Verified end to end on 2026-09-24: email-only sign-in page, code delivered to Mailpit, token with audience `oxinov-platform-api` and a 600-second lifetime, single sign-on on a second authorization, and the platform API accepting the token for `/v1/me`, the welcome step, and entitlements.

## Not yet configured

- Google identity provider: needs an OAuth client from Google Cloud (owner action), then `Trust Email` on and the `oxinov-first-broker` flow.
- Refusing Google accounts with unverified emails at Keycloak (today the platform API refuses them at the welcome step with `EMAIL_NOT_VERIFIED`).
- Oxinov cyberpunk login theme, Apple sign-in, the separate `oxinov-staff` realm, and production hostname, TLS, and proxy settings.
