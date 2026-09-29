# @oxinov/web-auth

Backend-for-frontend sign-in at `id.oxinov.com` for every Oxinov Next.js web app ([identity and access](../../docs/04-architecture/identity-and-access.md), ADR-011, ADR-016). Used by the account portal (`frontend/platform-web`) and Oxinov Edu (`frontend/products/edu-web`).

- Authorization code flow with PKCE (S256), `state`, and ID-token `nonce` checks.
- Tokens never reach the browser: they are sealed with AES-256-GCM into HttpOnly cookies with purpose-separated keys.
- Single-use refresh-token rotation; a rejected refresh signs the person out (FR-ID-2208).
- Sign-out is POST-only with an Origin check, revokes the refresh token, and ends the identity session.
- Post-sign-in destinations are same-site relative paths only (open-redirect protection).
- Each app has its own OIDC client, API audience (FR-ID-2207), and cookie names, so apps sharing a host during development never overwrite each other's sessions.

## Use in an app

```ts
// src/lib/auth.ts
import { createWebAuth } from '@oxinov/web-auth';
export const auth = createWebAuth({ cookiePrefix: 'oxedu' }); // cookies oxedu_session, oxedu_signin
```

```ts
// src/app/auth/login/route.ts (callback and refresh are the same with their handler)
import { auth } from '@/lib/auth.ts';
export const GET = auth.handlers.login;

// src/app/auth/logout/route.ts
export const POST = auth.handlers.logout;
```

Server components call `await auth.requireSession(path)` (redirects to sign-in) or `await auth.currentSession(path)` (returns `null` when signed out) and pass `session.accessToken` to their API. Add `transpilePackages: ['@oxinov/web-auth']` to `next.config.ts`.

Settings, read at request time: `APP_URL`, `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, and `SESSION_SECRET` (at least 32 characters; rotating it signs everyone out).

## Tests

```bash
pnpm --filter @oxinov/web-auth test
```

## Assistant skills

Coding assistants working here follow [oxinov-shared-package](../../.claude/skills/oxinov-shared-package/SKILL.md), [oxinov-frontend](../../.claude/skills/oxinov-frontend/SKILL.md), [oxinov-platform-integration](../../.claude/skills/oxinov-platform-integration/SKILL.md), [oxinov-security](../../.claude/skills/oxinov-security/SKILL.md), [oxinov-testing](../../.claude/skills/oxinov-testing/SKILL.md). All rules and skills: [AI knowledge](../../docs/14-ai-knowledge/README.md).
