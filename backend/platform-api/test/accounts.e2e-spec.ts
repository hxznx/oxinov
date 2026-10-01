/**
 * Oxinov account lifecycle against real PostgreSQL with row-level security:
 * FR-ID-2205 (welcome), FR-ID-2206 (accounts by subject), FR-ID-2207 (audience), FR-POLICY-2402/2404
 * (acceptance records and re-acceptance), FR-PLAN-2602/2603 (member access), FR-PORTAL-3102 (catalogue),
 * FR-NOTIF-2903 (one welcome email, through a fake mailer).
 */
import { CURRENT_POLICIES, SEED, assertValidSecurityEvent, createTestContext, ownerQuery, resetDatabase, type TestContext } from './helpers';

const welcome = {
  displayName: 'Mina',
  country: 'NP',
  ageConfirmed: true,
  accepted: CURRENT_POLICIES,
  channel: 'WEB',
  locale: 'ne-NP',
};

describe('platform accounts', () => {
  let ctx: TestContext;
  const bearer = async (subject: string, claims?: Record<string, unknown>) => ({
    Authorization: `Bearer ${await ctx.token(subject, claims)}`,
  });

  beforeAll(async () => {
    await resetDatabase();
    ctx = await createTestContext();
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  beforeEach(() => {
    ctx.securityEvents.length = 0;
    ctx.mailer.sent.length = 0;
    ctx.mailer.failWith = undefined;
  });

  describe('authentication and catalogue', () => {
    it('rejects missing tokens and tokens issued for another product (FR-ID-2207)', async () => {
      const missing = await ctx.http.get('/v1/me');
      expect(missing.status).toBe(401);
      expect(missing.body.error.code).toBe('UNAUTHENTICATED');

      const other = await ctx.http.get('/v1/me').set(await bearer('user_x', { aud: 'oxinov-edu-api' }));
      expect(other.status).toBe(401);
    });

    it('lists only launched products and the current policy versions without sign-in', async () => {
      const products = await ctx.http.get('/v1/products');
      expect(products.status).toBe(200);
      expect(products.body.data).toEqual([{ key: 'edu', name: 'Oxinov Edu', address: 'edu.oxinov.com' }]);

      const policies = await ctx.http.get('/v1/policies/current');
      expect(policies.body.data.map((p: { policyId: string }) => p.policyId).sort()).toEqual(['acceptable-use', 'privacy', 'terms']);
    });
  });

  describe('first sign-in and welcome (FR-ID-2205)', () => {
    it('creates a pending account on first sign-in and asks for the sign-up policies', async () => {
      const response = await ctx.http.get('/v1/me').set(await bearer('google|mina', { email: 'Mina@Example.com' }));
      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        email: 'mina@example.com',
        status: 'PENDING_WELCOME',
        trustLevel: 'T1',
        welcomeRequired: true,
      });
      expect(response.body.data.outstandingPolicies.map((p: { policyId: string }) => p.policyId).sort()).toEqual(['privacy', 'terms']);
      const created = ctx.securityEvents.find((event) => event.event.action === 'auth.account.created');
      expect(created).toBeDefined();
      assertValidSecurityEvent(created);
    });

    it('blocks protected features until the welcome step is complete', async () => {
      const response = await ctx.http.get('/v1/me/entitlements').set(await bearer('google|mina'));
      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('POLICY_ACCEPTANCE_REQUIRED');
      expect(response.body.error.details.policies.sort()).toEqual(['privacy@1', 'terms@1']);
    });

    it('refuses the welcome without age confirmation, with a bad country, or with missing policies', async () => {
      const headers = await bearer('google|mina');
      const noAge = await ctx.http.post('/v1/me/welcome').set(headers).send({ ...welcome, ageConfirmed: false });
      expect(noAge.status).toBe(400);
      const badCountry = await ctx.http.post('/v1/me/welcome').set(headers).send({ ...welcome, country: 'Nepal' });
      expect(badCountry.status).toBe(400);
      const missing = await ctx.http
        .post('/v1/me/welcome')
        .set(headers)
        .send({ ...welcome, accepted: [{ policyId: 'terms', version: 1 }] });
      expect(missing.status).toBe(403);
      expect(missing.body.error.details.policies).toEqual(['privacy@1']);
      expect(ctx.mailer.sent).toEqual([]);
    });

    it('refuses people whose email is not verified', async () => {
      const response = await ctx.http
        .post('/v1/me/welcome')
        .set(await bearer('google|unverified', { email: 'u@example.com', email_verified: false }))
        .send(welcome);
      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('EMAIL_NOT_VERIFIED');
      expect(ctx.mailer.sent).toEqual([]);
    });

    it('activates the account, records acceptances, and grants member access to launched products only', async () => {
      const headers = await bearer('google|mina');
      const response = await ctx.http.post('/v1/me/welcome').set(headers).send(welcome);
      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({ status: 'ACTIVE', country: 'NP', displayName: 'Mina', welcomeRequired: false, outstandingPolicies: [] });
      // FR-NOTIF-2903: exactly one welcome email, to the verified address.
      expect(ctx.mailer.sent.map(({ to, subject }) => ({ to, subject }))).toEqual([{ to: 'mina@example.com', subject: 'Welcome to Oxinov' }]);

      const accepted = ctx.securityEvents.filter((event) => event.event.action === 'auth.policy.accepted');
      expect(accepted).toHaveLength(2);
      accepted.forEach(assertValidSecurityEvent);

      const rows = await ownerQuery<{ policy_id: string; locale: string; channel: string }>(
        `SELECT pa.policy_id, pa.locale, pa.channel FROM policy_acceptances pa JOIN user_accounts u ON u.id = pa.user_id
          WHERE u.auth_subject = $1 ORDER BY pa.policy_id`,
        ['google|mina'],
      );
      expect(rows).toEqual([
        { policy_id: 'privacy', locale: 'ne-NP', channel: 'WEB' },
        { policy_id: 'terms', locale: 'ne-NP', channel: 'WEB' },
      ]);

      const entitlements = await ctx.http.get('/v1/me/entitlements').set(headers);
      expect(entitlements.status).toBe(200);
      expect(entitlements.body.data.map((e: { entitlementKey: string }) => e.entitlementKey)).toEqual(['edu.member']);
    });

    it('sends one welcome email with the escaped name, and none on a repeat (FR-NOTIF-2903)', async () => {
      const headers = await bearer('google|sita', { email: 'Sita@Example.com' });
      expect((await ctx.http.get('/v1/me').set(headers)).status).toBe(200);
      const response = await ctx.http.post('/v1/me/welcome').set(headers).send({ ...welcome, displayName: 'Sita <b>Rai</b>' });
      expect(response.status).toBe(200);
      expect(ctx.mailer.sent).toHaveLength(1);
      const [email] = ctx.mailer.sent;
      expect(email).toMatchObject({ to: 'sita@example.com', subject: 'Welcome to Oxinov' });
      expect(email?.text).toContain('Hello Sita <b>Rai</b>,');
      expect(email?.html).toContain('Hello Sita &lt;b&gt;Rai&lt;/b&gt;,');
      expect(email?.text).toContain('https://edu.oxinov.com');
      expect(email?.text).toContain('https://app.oxinov.com');
      expect(email?.text).toContain('support@oxinov.com');

      const again = await ctx.http.post('/v1/me/welcome').set(headers).send(welcome);
      expect(again.status).toBe(200);
      expect(ctx.mailer.sent).toHaveLength(1);
    });

    it('sends one email when the same welcome arrives twice at once (FR-NOTIF-2903)', async () => {
      const headers = await bearer('google|ram', { email: 'ram@example.com' });
      expect((await ctx.http.get('/v1/me').set(headers)).status).toBe(200);
      const responses = await Promise.all([
        ctx.http.post('/v1/me/welcome').set(headers).send(welcome),
        ctx.http.post('/v1/me/welcome').set(headers).send(welcome),
      ]);
      expect(responses.map((r) => r.status)).toEqual([200, 200]);
      expect(responses.map((r) => (r.body as { data: { status: string } }).data.status)).toEqual(['ACTIVE', 'ACTIVE']);
      expect(ctx.mailer.sent.map((m) => m.to)).toEqual(['ram@example.com']);
      const [audit] = await ownerQuery<{ n: string }>(
        `SELECT count(*)::text AS n FROM audit_events a JOIN user_accounts u ON u.id = a.actor_user_id
          WHERE u.auth_subject = $1 AND a.action = 'account.welcomed'`,
        ['google|ram'],
      );
      expect(audit?.n).toBe('1');
    });

    it('completes the welcome even when the email cannot be sent (FR-NOTIF-2903)', async () => {
      const headers = await bearer('google|gita', { email: 'gita@example.com' });
      ctx.mailer.failWith = Object.assign(new Error('Relay unavailable'), { responseCode: 451 });
      const response = await ctx.http.post('/v1/me/welcome').set(headers).send(welcome);
      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({ status: 'ACTIVE', welcomeRequired: false });
      expect(ctx.mailer.sent).toEqual([]);
      expect((await ctx.http.get('/v1/me/entitlements').set(headers)).status).toBe(200);
    });

    it('treats a repeated welcome as a no-op', async () => {
      const response = await ctx.http.post('/v1/me/welcome').set(await bearer('google|mina')).send({ ...welcome, country: 'IN' });
      expect(response.status).toBe(200);
      expect(response.body.data.country).toBe('NP');
      const [count] = await ownerQuery<{ n: string }>(
        `SELECT count(*)::text AS n FROM policy_acceptances pa JOIN user_accounts u ON u.id = pa.user_id WHERE u.auth_subject = $1`,
        ['google|mina'],
      );
      expect(count?.n).toBe('2');
      expect(ctx.mailer.sent).toEqual([]);
    });
  });

  describe('member access and isolation (FR-PLAN-2602, FR-PLAN-2603)', () => {
    it('adds member access automatically when a product launches', async () => {
      await ownerQuery(`UPDATE products SET launched = true, release_gate_recorded_at = now() WHERE key = 'jobs'`);
      const response = await ctx.http.get('/v1/me/entitlements').set(await bearer(SEED.asha.subject));
      expect(response.body.data.map((e: { entitlementKey: string }) => e.entitlementKey)).toEqual(['edu.member', 'jobs.member']);
      await ownerQuery(`UPDATE products SET launched = false, release_gate_recorded_at = NULL WHERE key = 'jobs'`);
    });

    it('shows each person only their own account and entitlements', async () => {
      const asha = await ctx.http.get('/v1/me').set(await bearer(SEED.asha.subject));
      const bibek = await ctx.http.get('/v1/me').set(await bearer(SEED.bibek.subject));
      expect(asha.body.data.id).toBe(SEED.asha.id);
      expect(bibek.body.data.id).toBe(SEED.bibek.id);
      expect(asha.body.data.email).toBe('asha@example.test');
    });
  });

  describe('policy changes (FR-POLICY-2404)', () => {
    it('requires re-acceptance of a new material version before protected actions', async () => {
      await ownerQuery(
        `INSERT INTO policies (id, version, title, url, material, required_for_signup, effective_at)
         VALUES ('terms', 2, 'Oxinov Terms of Service', 'https://oxinov.com/legal/terms/', true, true, now() - interval '1 minute')`,
      );
      const headers = await bearer(SEED.asha.subject);
      const blocked = await ctx.http.get('/v1/me/entitlements').set(headers);
      expect(blocked.status).toBe(403);
      expect(blocked.body.error.details.policies).toEqual(['terms@2']);

      const stale = await ctx.http
        .post('/v1/me/policy-acceptances')
        .set(headers)
        .send({ accepted: [{ policyId: 'terms', version: 1 }], channel: 'WEB', locale: 'en' });
      expect(stale.status).toBe(409);
      expect(stale.body.error.code).toBe('POLICY_VERSION_OUTDATED');

      const accepted = await ctx.http
        .post('/v1/me/policy-acceptances')
        .set(headers)
        .send({ accepted: [{ policyId: 'terms', version: 2 }], channel: 'ANDROID', locale: 'en' });
      expect(accepted.status).toBe(200);
      expect(accepted.body.data.outstandingPolicies).toEqual([]);
      expect((await ctx.http.get('/v1/me/entitlements').set(headers)).status).toBe(200);
    });

    it('does not ask again for a minor policy update', async () => {
      await ownerQuery(
        `INSERT INTO policies (id, version, title, url, material, required_for_signup, effective_at)
         VALUES ('privacy', 2, 'Oxinov Privacy Policy', 'https://oxinov.com/legal/privacy/', false, true, now() - interval '1 minute')`,
      );
      const response = await ctx.http.get('/v1/me/entitlements').set(await bearer(SEED.asha.subject));
      expect(response.status).toBe(200);
    });
  });

  describe('suspension', () => {
    it('blocks a suspended account', async () => {
      await ownerQuery(`UPDATE user_accounts SET status = 'SUSPENDED' WHERE id = $1`, [SEED.bibek.id]);
      const response = await ctx.http.get('/v1/me/entitlements').set(await bearer(SEED.bibek.subject));
      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('ACCOUNT_SUSPENDED');
    });
  });
});
