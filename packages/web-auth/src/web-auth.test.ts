// Unit tests for the shared web sign-in core. Run: pnpm --filter @oxinov/web-auth test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadWebAuthConfig } from './config.ts';
import { createOidcClient } from './oidc.ts';
import { codeChallenge, randomToken } from './pkce.ts';
import { safeReturnTo } from './return-to.ts';
import { sealSession, sealTransaction, unsealSession, unsealTransaction } from './session.ts';

const secret = 'x'.repeat(40);
const session = { subject: 'sub-1', accessToken: 'a', refreshToken: 'r', accessExpiresAt: 1 };

describe('PKCE', () => {
  it('matches the RFC 7636 appendix B test vector', () => {
    assert.equal(codeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  it('creates distinct URL-safe random values', () => {
    const [a, b] = [randomToken(), randomToken()];
    assert.notEqual(a, b);
    assert.match(a, /^[A-Za-z0-9_-]{43}$/);
  });
});

describe('return-to protection', () => {
  it('keeps same-site relative paths', () => {
    assert.equal(safeReturnTo('/welcome'), '/welcome');
    assert.equal(safeReturnTo('/?tab=security'), '/?tab=security');
  });

  it('refuses other sites, protocol-relative, backslash, control characters, and auth routes', () => {
    for (const value of ['https://evil.example', '//evil.example', '/\\evil.example', '/a\nb', 'javascript:alert(1)', '/auth/login', '', undefined, null]) {
      assert.equal(safeReturnTo(value), '/', String(value));
    }
  });
});

describe('sealed cookies', () => {
  it('round-trips a session', async () => {
    const sealed = await sealSession(session, secret);
    const opened = await unsealSession(sealed, secret);
    assert.ok(opened);
    for (const [key, value] of Object.entries(session)) assert.equal(opened[key as keyof typeof session], value, key);
    // The cookie is encrypted, not just signed: nothing readable leaks to the browser.
    assert.doesNotMatch(sealed, /sub-1/);
    assert.doesNotMatch(Buffer.from(sealed.split('.')[3] ?? '', 'base64url').toString('latin1'), /sub-1/);
  });

  it('rejects tampering, a different secret, and missing cookies', async () => {
    const sealed = await sealSession(session, secret);
    const tampered = `${sealed.slice(0, -4)}AAAA`;
    assert.equal(await unsealSession(tampered, secret), null);
    assert.equal(await unsealSession(sealed, 'y'.repeat(40)), null);
    assert.equal(await unsealSession(undefined, secret), null);
  });

  it('never accepts a sign-in transaction as a session', async () => {
    const transaction = await sealTransaction({ state: 's', verifier: 'v', nonce: 'n', returnTo: '/' }, secret);
    assert.equal(await unsealSession(transaction, secret), null);
    assert.equal((await unsealTransaction(transaction, secret))?.state, 's');
  });
});

describe('authorization request', () => {
  const client = createOidcClient(() =>
    loadWebAuthConfig('ox', {
      APP_URL: 'https://app.oxinov.com',
      OIDC_ISSUER: 'https://id.oxinov.com/realms/oxinov',
      OIDC_CLIENT_ID: 'oxinov-platform-web',
      OIDC_CLIENT_SECRET: 'client-secret',
      SESSION_SECRET: secret,
    }),
  );
  const input = { state: 's', nonce: 'n', challenge: 'c' };

  async function withDiscovery<T>(run: () => Promise<T>): Promise<T> {
    const original = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ authorization_endpoint: 'https://id.oxinov.com/realms/oxinov/protocol/openid-connect/auth' }))) as typeof fetch;
    try {
      return await run();
    } finally {
      globalThis.fetch = original;
    }
  }

  it('asks for the code flow with PKCE and the exact callback, without prompt by default', async () => {
    const url = new URL(await withDiscovery(() => client.authorizationUrl(input)));
    assert.equal(url.searchParams.get('response_type'), 'code');
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
    assert.equal(url.searchParams.get('redirect_uri'), 'https://app.oxinov.com/auth/callback');
    assert.equal(url.searchParams.has('prompt'), false);
  });

  it('opens account creation with prompt=create', async () => {
    const url = new URL(await withDiscovery(() => client.authorizationUrl({ ...input, prompt: 'create' })));
    assert.equal(url.searchParams.get('prompt'), 'create');
  });
});

describe('configuration', () => {
  const env = {
    APP_URL: 'https://edu.oxinov.com/',
    OIDC_ISSUER: 'https://id.oxinov.com/realms/oxinov/',
    OIDC_CLIENT_ID: 'oxinov-edu-web',
    OIDC_CLIENT_SECRET: 'client-secret',
    SESSION_SECRET: secret,
  };

  it('gives each app its own cookie names and secure cookies over HTTPS', () => {
    const config = loadWebAuthConfig('oxedu', env);
    assert.equal(config.sessionCookie, 'oxedu_session');
    assert.equal(config.transactionCookie, 'oxedu_signin');
    assert.equal(config.appUrl, 'https://edu.oxinov.com');
    assert.equal(config.issuer, 'https://id.oxinov.com/realms/oxinov');
    assert.equal(config.secureCookies, true);
    assert.equal(loadWebAuthConfig('ox', { ...env, APP_URL: 'http://localhost:3001' }).secureCookies, false);
  });

  it('refuses missing values, short session secrets, and unsafe cookie prefixes', () => {
    assert.throws(() => loadWebAuthConfig('ox', { ...env, OIDC_CLIENT_SECRET: ' ' }), /OIDC_CLIENT_SECRET is required/);
    assert.throws(() => loadWebAuthConfig('ox', { ...env, SESSION_SECRET: 'short' }), /at least 32/);
    assert.throws(() => loadWebAuthConfig('Ox-Session;', env), /cookiePrefix/);
  });
});
