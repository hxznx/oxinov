# Oxinov account portal (`frontend/platform-web`)

`app.oxinov.com`: sign in once, complete the welcome step, and reach every Oxinov product (ADR-011, FR-ID-2205, FR-PORTAL-3101/3102).

## How sign-in works (backend-for-frontend)

| Route | Purpose |
| --- | --- |
| `GET /auth/login` | Creates state, nonce, and a PKCE verifier, seals them in a 10-minute `ox_signin` cookie, and redirects to `id.oxinov.com`. `?idp=google` skips to Google; `?returnTo=` accepts same-site paths only |
| `GET /auth/callback` | Checks state, exchanges the code with the PKCE verifier and client secret, verifies the ID token nonce, and seals the tokens into the `ox_session` cookie |
| `GET /auth/refresh` | Rotates tokens before expiry; a refused refresh signs the person out |
| `POST /auth/logout` | Same-origin only: revokes the refresh token and ends the Keycloak session |

Tokens never reach browser JavaScript: cookies are `HttpOnly`, `SameSite=Lax`, `Secure` on HTTPS, and encrypted with AES-256-GCM (`SESSION_SECRET`). The portal calls `api.oxinov.com` from the server.

## Screens

- Signed out: cyberpunk sign-in with "Continue with email" (and "Continue with Google" when `GOOGLE_SIGNIN_ENABLED=true`).
- `/welcome`: name, country, minimum-age confirmation, and "Agree and continue" for the current Terms and Privacy Policy; reused when a material policy changes.
- `/`: your apps (entitled, launched products), plan, verification level, and profile; app launcher and sign-out in the header.

## Local development

```bash
cp devops/keycloak/admin/.env.example devops/keycloak/admin/.env
bash devops/keycloak/admin/start-local.sh
cp frontend/platform-web/.env.example frontend/platform-web/.env.local   # add the client secret from Keycloak and a session secret
pnpm --filter @oxinov/design-system build
pnpm --filter @oxinov/platform-web dev          # http://localhost:3001 (platform API on :4200)
pnpm --filter @oxinov/platform-web test         # sealed sessions, PKCE vector, redirect safety
```

Sign-in codes arrive in Mailpit at http://localhost:8025. Production runs the standalone server (`output: 'standalone'`) in a container; its image and deployment arrive with the AWS environment.

## Assistant skills

Coding assistants working here follow [oxinov-frontend](../../.claude/skills/oxinov-frontend/SKILL.md), [oxinov-platform-integration](../../.claude/skills/oxinov-platform-integration/SKILL.md), [oxinov-branding](../../.claude/skills/oxinov-branding/SKILL.md), [oxinov-accessibility](../../.claude/skills/oxinov-accessibility/SKILL.md), [oxinov-security](../../.claude/skills/oxinov-security/SKILL.md), [oxinov-testing](../../.claude/skills/oxinov-testing/SKILL.md). All rules and skills: [AI knowledge](../../docs/14-ai-knowledge/README.md).
