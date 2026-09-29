---
name: oxinov-keycloak
description: Design, configure, integrate, operate, and troubleshoot Oxinov identity on Keycloak - the trust model, the oxinov and master realms, clients and their trust levels, OIDC flows with PKCE, tokens and validation, audiences, roles versus scopes versus tenant roles, sessions, passwordless email-code and Google sign-in, staff MFA, service accounts, redirect URIs and origins, the email-code extension, hostname and proxy settings, deployment on k3s, secrets, events and monitoring, backup, upgrades, and security checklists. Use for any change to sign-in, the realm script, Keycloak clients, token handling, or identity infrastructure.
---

# Oxinov identity on Keycloak

Act as a senior identity and access management architect for Ox Inov Pvt. Ltd. Keycloak is critical security infrastructure and the central trust system connecting people, web apps, APIs, services, and identity providers; it is not "a login page that returns a JWT".

Reason in this order: identity → authentication → session → token → authorization → application → API → resource.

Related skills: oxinov-authentication-sessions (token validation and web sessions in code), oxinov-access-control (API authorization), oxinov-platform-integration (adding a product client), oxinov-multi-tenancy, oxinov-secrets-and-crypto, oxinov-kubernetes, oxinov-devops-architecture. Sources: [Keycloak README](../../../devops/keycloak/README.md), [identity and access](../../../docs/04-architecture/identity-and-access.md), [API authentication](../../../docs/06-api/api-auth.md), [Platform FRD](../../../docs/03-requirements/frd/platform-frd.md) (ID 2201-2299, TRUST 2301-2399), [secure development standard](../../../docs/09-security/secure-development-standard.md). Decisions: ADR-011 (one account, simple sign-in, progressive trust), ADR-016 (Keycloak implementation), ADR-027 (audience rename). Code: `devops/keycloak/` (`Dockerfile`, `configure-realm.sh`, `init-db.sh`, `admin/`), chart `devops/kubernetes/helm/oxinov`.

**A sign-in change is a production change.** A push that changes `devops/keycloak/configure-realm.sh` re-applies the production realm (its hash is stored in the `oxinov-realm` ConfigMap) and changes sign-in for everyone. Rehearse with `bash devops/kubernetes/scripts/rehearse-local.sh`, state the user-visible effect, and push only when the owner asks (AGENTS.md section 3). Before any version-sensitive setting, command, or upgrade, check the current official Keycloak documentation for the version in the `Dockerfile`.

**When uncertain, prioritize:** authentication correctness, authorization correctness, least privilege, token security, tenant and resource isolation, standards compliance, simplicity, auditability, reliability, maintainability, performance, customization.

## 1. The Oxinov identity model

```text
Person ─▶ edu.oxinov.com / app.oxinov.com (web app server = backend-for-frontend)
            │ authorization code + PKCE (confidential client)
            ▼
         id.oxinov.com ── realm "oxinov": customers (no passwords)
            │ access token (10 min, audience = that product's API) · refresh token (rotating) · ID token
            ▼
         web app server keeps tokens in a sealed HttpOnly cookie, calls its product API with the access token
            ▼
         product API: server-kit verifies signature (JWKS), issuer, audience, RS256/ES256, expiry
            ▼
         product authorization: tenant membership, role, entitlement, trust level, policy → row-level security
```

| Concept | Oxinov answer |
| --- | --- |
| Realms | `oxinov` for every customer; `master` only for Keycloak administration (staff). A separate `oxinov-staff` realm is planned. Do not create a realm per product or per tenant |
| Clients | One confidential web client per product web app (`oxinov-platform-web`, `oxinov-edu-web`); the `oxinov-automation` service account in `master` for configuration. Mobile apps will be public clients with PKCE (oxinov-mobile) |
| Audiences | One per product API (`oxinov-platform-api`; Edu still `oxinov-lms-api` until the [ADR-027 cutover](../../../docs/10-devops/runbooks/edu-rename-cutover.md) part B), added by an audience mapper. A token for one product is refused by another (FR-ID-2207) |
| Identity key | The OIDC `sub`, stored by each product (for example `user_profiles.auth_subject`); never the email |
| Authorization | **Not in Keycloak roles.** Workspace roles (`LEARNER` to `OWNER`), entitlements, trust levels, and policy acceptance live in the product and platform databases and are enforced by the APIs. Keycloak proves who the person is |
| Keycloak's job vs the databases' | Keycloak: identity, credentials, sessions, sign-in flows. Products: profiles, memberships, business data. Keycloak is never a business database; add user attributes only when sign-in needs them |

## 2. Sign-in flows (configured by `configure-realm.sh`)

| Flow | Behaviour | Requirement |
| --- | --- | --- |
| `oxinov-browser` (customers) | Existing session cookie, or identity-provider redirect, or email address then a six-digit email code (10 minutes, single use, IP and device trust off). No password form | FR-ID-2202, FR-ID-2204 |
| `oxinov-registration` | Keycloak's registration without the password step; email is the username; email verification required | ADR-016 |
| `oxinov-first-broker` (Google) | Review missing profile fields; create the user if unique, otherwise link to an existing account **only after an emailed confirmation**, never by matching the email string | FR-ID-2206 |
| `oxinov-staff-browser` (`master`) | Password **and** an authenticator-app code (TOTP, 6 digits, 30 seconds), set up on first sign-in | FR-ID-2209 |

Realm settings: `verifyEmail=true`, duplicate emails refused, password reset and the update-password required action off (there are no customer passwords), remember-me on, brute-force protection with lockout after 5 failures (in both realms), access tokens 600 seconds, SSO idle 30 days and maximum 90 days, `revokeRefreshToken=true` with no reuse.

Not yet configured: the Google identity provider (needs the owner's Google OAuth client), refusing unverified Google emails at Keycloak (the platform API refuses them today with `EMAIL_NOT_VERIFIED`), Apple sign-in (iOS), the branded login theme, and the separate staff realm.

Email codes are sent through SMTP to the in-cluster `mail-relay`, which sends through Amazon SES. SES is still in the sandbox until AWS approves production access, so codes reach only verified addresses.

## 3. Clients, flows, and tokens

- Interactive sign-in uses the **authorization code flow with PKCE (S256)**. Implicit flow and direct access (password) grants are disabled; never enable them.
- Web clients are **confidential**, because the Next.js server holds the secret and the tokens (backend-for-frontend). Browser JavaScript never sees a client secret or token (`@oxinov/web-auth`: sealed AES-256-GCM `HttpOnly`, `Secure`, `SameSite=Lax` cookies, state, nonce, and PKCE verifier in a 10-minute sealed transaction).
- A future SPA or mobile app is a **public** client with PKCE and no secret.
- Machine-to-machine uses the client credentials flow with one service account per service and only the roles it needs. Today the only one is `oxinov-automation`.
- Access tokens go to APIs; the ID token only proves sign-in to the web app (nonce checked); never send an ID token to an API. Refresh tokens stay on the web server and rotate.
- APIs validate with standard libraries (`jose` in `server-kit`): JWKS from discovery (so key rotation works), exact issuer, the product's audience, algorithms fixed to RS256 or ES256, expiry. Decode is not validate.
- Keep tokens small: only the claims consumers need; no personal data beyond what the product must show.
- Disabling a user stops new tokens, but an issued access token stays valid until it expires (up to 10 minutes); the short lifetime is the control.
- Offline access and token exchange are not used; enable them only with a written need.

## 4. Redirects, origins, logout

- Redirect URIs are exactly `<app URL>/auth/callback`, post-logout redirects exactly `<app URL>/`, and web origins the exact app origin (`configure-realm.sh`). Never use `*`, a path wildcard, or another origin.
- The web apps accept only same-site relative `returnTo` paths (`safeReturnTo`).
- Sign-out revokes the refresh token, clears the cookie, and ends the Keycloak session through the end-session endpoint; the other product's app then asks the realm session again. Back-channel logout is not configured.
- CORS is not authorization; APIs never rely on it.

## 5. Deployment (k3s, `id.oxinov.com`)

| Item | Today |
| --- | --- |
| Image | `devops/keycloak/Dockerfile`: `quay.io/keycloak/keycloak` 26.7.4 pinned by digest, plus the `email-otp-authenticator` v1.5.0 extension fetched by exact URL and SHA-256 (built for 26.7.3; upgrade Keycloak and the extension together and repeat the checksum and Sigstore checks). Health and metrics enabled at build |
| Runtime | One replica, `Recreate` strategy (two JVMs do not fit the node), priority class, probes, heap set by `JAVA_OPTS_KC_HEAP` |
| Hostname and proxy | `KC_HOSTNAME=https://id.oxinov.com`, a separate `KC_HOSTNAME_ADMIN`, `KC_PROXY_HEADERS=xforwarded`, HTTP inside the cluster with TLS terminated by Traefik (HSTS). Changing the hostname changes the issuer and breaks every product's token validation: plan it like a cutover |
| Admin exposure | `/admin` and `/realms/master` on the public host route to a closed Service (`oxinov-identity-private` ingress). Operators use `oxctl keycloak-admin`: a Session Manager tunnel from `localhost:8080` to the `keycloak` Service's cluster IP (nothing listens on the node's own port 8080). Port 8080 on the laptop must be free: a running local Keycloak (`oxinov-lms-keycloak-1`) silently answers instead of production, and `oxctl` now refuses to start in that case |
| Database | Its own `keycloak` database and role on the shared PostgreSQL StatefulSet; included in the nightly `pg_dumpall` and disk snapshots; never exposed outside the cluster |
| Secrets | `KC_DB_PASSWORD`, `KC_BOOTSTRAP_ADMIN_PASSWORD`, the automation secret, client secrets, and SMTP settings come from Parameter Store through the `oxinov-app` Secret. `configure-realm.sh` writes client secrets to a file for the deploy (never printed) |
| Configuration ownership | Terraform: AWS (DNS, SES). Helm: the Keycloak workload. `configure-realm.sh`: realm, flows, clients, mappers. Never change these by hand in the console; a console change is lost or fights the script |

Local: `devops/keycloak/admin/` holds the separate local administrator environment (`start-local.sh`, `.env.example`); sign-in codes arrive in Mailpit at `http://localhost:8025`.

## 6. Administration and least privilege

- Staff administer from `master` with password plus TOTP; no shared accounts; one person, one account; keep the number of `master` administrators minimal.
- `oxinov-automation` currently holds the `master` `admin` role so the script can manage both realms. That is broader than necessary: when you next change it, narrow it to the realm-management roles the script uses, test with the rehearsal, and record the change.
- Impersonation, dynamic client registration, and user self-service beyond sign-in stay off unless a requirement needs them.
- Never expose an admin token or the admin API to a browser or product.

## 7. Events, monitoring, and recovery

- Audit events are enabled in both realms by `configure-realm.sh`: security-relevant sign-in event types (the `EVENT_TYPES` list; routine token refreshes excluded) kept 365 days, and admin events without request bodies. Read them in the admin console under **Events**, and sign-in failures also in `oxctl logs keycloak`; delivery problems in `oxctl logs mail-relay`.
- Watch: Keycloak ready, login failure spikes (brute force), email delivery failures (`MessageRejected` in the mail-relay log means the SES sandbox), certificate expiry, JVM memory, restarts.
- Never log tokens, authorization codes, email codes, client secrets, or passwords; log client ID, request ID, and a failure reason.
- If Keycloak is down, nobody can sign in to any product: it is a critical dependency. Recovery is `oxctl rollback` for a bad release, then database restore from the nightly dump with the owner's approval (RPO 24 hours, RTO 4 hours proposed). High availability (several replicas, RDS) comes with the EKS and RDS scale-out steps.
- Signing keys: products read JWKS through discovery, so a key rotation in Keycloak needs no product change; test it in the local rehearsal before doing it in production.

## 8. Decision process for an identity change

Who authenticates (person or service)? Which realm owns the identity? Which client asks, and is it public or confidential? Which flow, with PKCE? Which token and audience? Which scopes and claims? Where does authorization happen (almost always the product API, not Keycloak roles)? Is tenant isolation involved? Is MFA or a higher trust level needed (step-up is FR TRUST work)? Session length? Token storage? Validation? Secrets? Logout? What happens when the user is disabled or a credential is compromised? Logs and metrics? Negative tests? How is it rehearsed and promoted?

For a major change, describe the identity architecture, client, flow, token, session, integration, security, deployment, secrets, observability, tests, and recovery before changing the script.

## 9. Tests for every identity change

In the local rehearsal or local stack: sign-in by email code, registration with email verification, SSO into the second product without a new prompt, sign-out, token refresh and refresh-token reuse refused, a token for the wrong audience refused by the API, an expired or tampered token refused, redirect to a foreign URL refused, staff console sign-in requiring TOTP, brute-force lockout, and the product's allowed and denied authorization paths (other tenant, lower role).

## 10. Checklists

**Client:** confidential or public by where the secret can live; code flow with PKCE only; exact redirect URIs, post-logout redirects, and web origins; audience mapper for its own API; minimal scopes and claims; secret in Parameter Store and rotatable; never cloned from another client without review.

**Realm:** customer flows passwordless; email verification; duplicate emails refused; brute-force protection; token and session lifetimes as above; refresh-token rotation; staff MFA; events and retention; identity-provider linking only with confirmation; registration intended.

**Production:** TLS and HSTS; stable hostname and issuer; proxy headers only from Traefik; admin paths closed; database private, backed up, and restorable; secrets from Parameter Store; probes and memory within the node budget; logs without secrets; rehearsal passed.

## 11. Upgrades and extensions

Before an upgrade: read the release notes and upgrade guide for every version in between; check the email-code extension's compatibility (it is built for a specific Keycloak minor version) and repeat its checksum, Sigstore, and code review; check deprecated realm settings used by `configure-realm.sh`; rebuild the image pinned by digest; run the local rehearsal (sign-in, SSO, tokens, staff MFA); then release, with `oxctl rollback` as the first recovery step. Keep custom themes presentational and custom providers to the one reviewed extension.

## Never

Put a client secret or token in browser code; trust a decoded JWT without verification; send an ID token to an API; stop at authentication without authorization; use wildcard redirect URIs or origins; give services or people more than the roles they need; commit realm secrets or export a production realm with secrets; expose the admin console or the Keycloak database; run production sign-in over plain HTTP; store customer passwords anywhere; write custom crypto; log tokens or codes; treat hidden UI as security; change production flows in the console; apply version-specific settings without checking the current documentation.
