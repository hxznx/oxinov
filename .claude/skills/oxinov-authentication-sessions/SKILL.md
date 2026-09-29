---
name: oxinov-authentication-sessions
description: Build and review authentication and sessions in Oxinov - OIDC sign-in through Keycloak with PKCE, state, and nonce, JWT access token verification (issuer, audience, algorithm, expiry), per-product audiences, sealed server-side session cookies, cookie flags, CSRF protection, open-redirect protection, sign-out, token refresh, and authentication or session failures. Use for any change to sign-in, tokens, cookies, or sessions.
---

# Authentication and sessions

Standard: [secure development standard](../../../docs/09-security/secure-development-standard.md). Sources: [identity and access](../../../docs/04-architecture/identity-and-access.md), [API authentication](../../../docs/06-api/api-auth.md). Decisions: ADR-007, ADR-011, ADR-016. Code: `packages/server-kit/src/auth.ts`, `config.ts`; `packages/web-auth/src/` (`oidc.ts`, `pkce.ts`, `session.ts`, `return-to.ts`).

## How it works

```text
browser ──▶ web app /auth/sign-in ──▶ id.oxinov.com (Keycloak: Google, Apple, or email code; no passwords)
   ▲            │ state + PKCE verifier + nonce sealed in a 10-minute cookie
   │            ▼
   └── web app /auth/callback: checks state, exchanges the code with the verifier, checks the nonce
                 → access and refresh tokens sealed (AES-256-GCM) in an HttpOnly cookie
server component or action ──Bearer <access token>──▶ product API ──▶ AuthGuard verifies the JWT
```

The browser never sees a token. The API never reads cookies.

## JWT verification (APIs)

`TokenVerifier` in `server-kit` uses `jose.jwtVerify` with:

- the JWKS from `AUTH_JWKS_URL`, and `AUTH_ISSUER`
- `AUTH_AUDIENCE`: the product's own audience, so a token for another product fails (FR-ID-2207)
- algorithms fixed to `RS256` and `ES256`; never `none`, never a symmetric key in production
- expiry checked; any failure returns `null`, which becomes 401 `UNAUTHENTICATED`

Configuration fails at startup when `AUTH_DEV_JWT_SECRET` is set in staging or production, or when a deployed service has no audience. Development tokens (`dev:token`, issuer `oxinov-dev`, HS256) work only locally and in CI.

Identity comes from the verified `sub` claim, never from an email address or a request field.

## Sessions (web apps)

- `sealSession` encrypts the session with a key derived from `SESSION_SECRET` (32 or more random characters) and the purpose, so a sign-in transaction can never be replayed as a session.
- Cookie flags from `cookieOptions`: `HttpOnly`, `Secure` outside local development, `SameSite=Lax`, `Path=/`.
- A tampered, expired, or rotated-secret cookie unseals to `null`: the person is signed out (fail securely).
- Rotating `SESSION_SECRET` signs everyone out; it is an owner decision.
- Keycloak's idle and maximum session times are the real limit; access tokens live 10 minutes and are refreshed on the server.
- Sign-out clears the cookie, revokes the refresh token, and sends the browser to Keycloak's end-session endpoint (`oidc.ts`).
- Keycloak's brute-force protection is on for the realm (`bruteForceProtected`, `failureFactor=5` in `configure-realm.sh`).

## CSRF and redirects

- The API uses bearer tokens, so a cross-site request carries no credentials to it.
- Web apps change state only in server actions or POST route handlers; Next.js checks the origin of server actions, and the session cookie is `SameSite=Lax`. Never change state on GET.
- After sign-in, only same-site relative paths are allowed (`safeReturnTo`).

## Steps for a change

1. Keep all token handling in `server-kit` and `web-auth`; never parse or trust a JWT elsewhere.
2. New product: its own Keycloak client and audience (oxinov-platform-integration).
3. Test the failures: missing token, malformed token, wrong audience, wrong issuer, expired, `alg: none`, tampered session cookie, replayed sign-in transaction, external `returnTo`.
4. Run `pnpm --filter @oxinov/server-kit test` and `pnpm --filter @oxinov/web-auth test`, and the consumers' checks.
5. A realm change needs `bash devops/kubernetes/scripts/rehearse-local.sh` and the owner's go-ahead to push.

## Never

- Passwords for customers, or any flow that asks for one.
- Tokens in `localStorage`, URLs, logs, or client components.
- Accepting a token because it "looks valid" without signature, issuer, audience, and expiry checks.
- Long-lived tokens, or sharing one audience between products.
