/**
 * Transport hardening: product token audiences (FR-ID-2207), security headers, and the per-client
 * rate limit that returns the stable RATE_LIMITED envelope.
 */
import { createTestContext, resetDatabase, type TestContext } from './helpers';

async function contextWith(env: Record<string, string>): Promise<TestContext> {
  const previous = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]));
  Object.assign(process.env, env);
  try {
    return await createTestContext();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

describe('HTTP hardening', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  describe('token audience', () => {
    let ctx: TestContext;
    beforeAll(async () => {
      ctx = await contextWith({ AUTH_AUDIENCE: 'oxinov-edu-api' });
    });
    afterAll(async () => {
      await ctx?.app.close();
    });

    it('accepts a token issued for this API', async () => {
      const token = await ctx.idpToken('user_aud_ok', { aud: 'oxinov-edu-api', email: 'a@example.com', email_verified: true });
      const response = await ctx.http.get('/v1/tenants').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
    });

    it('rejects a token issued for another Oxinov product', async () => {
      const token = await ctx.idpToken('user_aud_other', { aud: 'oxinov-market-api' });
      const response = await ctx.http.get('/v1/tenants').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('sends baseline security headers', async () => {
      const response = await ctx.http.get('/health/live');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['content-security-policy']).toContain("default-src 'none'");
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('rate limit', () => {
    let ctx: TestContext;
    beforeAll(async () => {
      ctx = await contextWith({ RATE_LIMIT_PER_MINUTE: '2' });
    });
    afterAll(async () => {
      await ctx?.app.close();
    });

    it('returns 429 RATE_LIMITED with Retry-After once a client exceeds the limit', async () => {
      expect((await ctx.http.get('/v1/tenants')).status).toBe(401);
      expect((await ctx.http.get('/v1/tenants')).status).toBe(401);
      const limited = await ctx.http.get('/v1/tenants');
      expect(limited.status).toBe(429);
      expect(limited.body.error.code).toBe('RATE_LIMITED');
      expect(limited.body.error.requestId).toBe(limited.headers['x-request-id']);
      expect(Number(limited.headers['retry-after'])).toBeGreaterThan(0);
    });

    it('never throttles health probes', async () => {
      expect((await ctx.http.get('/health/live')).status).toBe(200);
    });
  });
});
