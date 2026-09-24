// Unit tests for the portal security core. Run: pnpm --filter @oxinov/platform-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { codeChallenge, randomToken } from './pkce.ts';
import { productUrl } from './product-url.ts';
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

describe('app launcher', () => {
  const edu = { key: 'lms', address: 'edu.oxinov.com' };

  it('uses the public address unless a local override exists for that product', () => {
    assert.equal(productUrl(edu, undefined), 'https://edu.oxinov.com');
    assert.equal(productUrl(edu, 'market=http://localhost:3005'), 'https://edu.oxinov.com');
    assert.equal(productUrl(edu, 'market=http://localhost:3005, lms=http://localhost:3002/'), 'http://localhost:3002');
  });

  it('ignores overrides that are not web addresses', () => {
    assert.equal(productUrl(edu, 'lms=javascript:alert(1)'), 'https://edu.oxinov.com');
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
