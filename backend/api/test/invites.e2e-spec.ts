/**
 * Workspace join codes and people (FR-AUTH-102, FR-TENANT): administrators create and revoke codes,
 * verified people redeem them, limits and expiry hold under row-level security, and one tenant can
 * never see or use another tenant's codes.
 */
import { SEED, assertValidSecurityEvent, createTestContext, ownerQuery, resetDatabase, type TestContext } from './helpers';

describe('workspace join codes', () => {
  let ctx: TestContext;
  const bearer = async (subject: string, emailVerified = true) => ({
    Authorization: `Bearer ${await ctx.devToken(subject, { emailVerified })}`,
  });
  const createInvite = async (subject: string, tenantId: string, body: Record<string, unknown>) =>
    ctx.http.post(`/v1/tenants/${tenantId}/invites`).set(await bearer(subject)).send(body);
  const redeem = async (subject: string, code: string, emailVerified = true) =>
    ctx.http.post('/v1/invites/redeem').set(await bearer(subject, emailVerified)).send({ code });

  beforeAll(async () => {
    await resetDatabase();
    ctx = await createTestContext();
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  beforeEach(() => {
    ctx.securityEvents.length = 0;
  });

  it('lets the owner create a learner code that a new person redeems, once', async () => {
    const created = await createInvite(SEED.users.sakuraOwner, SEED.sakura, { role: 'LEARNER' });
    expect(created.status).toBe(201);
    const code: string = created.body.data.code;
    expect(code).toMatch(/^[A-HJKMNP-Z2-9]{8}$/);
    expect(created.body.data).toMatchObject({ role: 'LEARNER', status: 'ACTIVE', useCount: 0, maxUses: null });
    const days = (new Date(created.body.data.expiresAt).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(13.9);
    expect(days).toBeLessThanOrEqual(14);

    // People type codes loosely: lower case, spaces, and a hyphen are accepted.
    const typed = `${code.slice(0, 4).toLowerCase()}- ${code.slice(4)}`;
    const joined = await redeem('dev|newcomer-rita', typed);
    expect(joined.status).toBe(201);
    expect(joined.body.data).toMatchObject({ id: SEED.sakura, slug: 'sakura', role: 'LEARNER' });

    const again = await redeem('dev|newcomer-rita', code);
    expect(again.status).toBe(200);

    const workspaces = await ctx.http.get('/v1/tenants').set(await bearer('dev|newcomer-rita'));
    expect(workspaces.body.data.map((w: { slug: string }) => w.slug)).toEqual(['sakura']);

    const [row] = await ownerQuery<{ use_count: number }>('SELECT use_count FROM tenant_invites WHERE code = $1', [code]);
    expect(row?.use_count).toBe(1);
    const [audit] = await ownerQuery<{ n: string }>(
      "SELECT count(*)::text AS n FROM audit_events WHERE action = 'tenant.member.joined' AND tenant_id = $1",
      [SEED.sakura],
    );
    expect(audit?.n).toBe('1');
  });

  it('refuses code management to instructors and learners', async () => {
    const byInstructor = await createInvite(SEED.users.instructor, SEED.sakura, { role: 'LEARNER' });
    expect(byInstructor.status).toBe(403);
    const list = await ctx.http.get(`/v1/tenants/${SEED.sakura}/invites`).set(await bearer(SEED.users.aiko));
    expect(list.status).toBe(403);
    const people = await ctx.http.get(`/v1/tenants/${SEED.sakura}/members`).set(await bearer(SEED.users.aiko));
    expect(people.status).toBe(403);
  });

  it('never grants ownership and lets only the owner mint administrator codes', async () => {
    const owner = await createInvite(SEED.users.sakuraOwner, SEED.sakura, { role: 'OWNER' });
    expect(owner.status).toBe(400);

    const admin = await createInvite(SEED.users.sakuraOwner, SEED.sakura, { role: 'ADMIN', maxUses: 1 });
    expect(admin.status).toBe(201);
    expect((await redeem('dev|new-admin-hari', admin.body.data.code)).body.data.role).toBe('ADMIN');

    const byAdmin = await createInvite('dev|new-admin-hari', SEED.sakura, { role: 'ADMIN' });
    expect(byAdmin.status).toBe(403);
    const learnerByAdmin = await createInvite('dev|new-admin-hari', SEED.sakura, { role: 'LEARNER' });
    expect(learnerByAdmin.status).toBe(201);
  });

  it('stops a code at its use limit, after revocation, and after expiry, with one generic answer', async () => {
    const single = await createInvite(SEED.users.sakuraOwner, SEED.sakura, { role: 'LEARNER', maxUses: 1 });
    expect((await redeem('dev|first-sita', single.body.data.code)).status).toBe(201);
    const usedUp = await redeem('dev|second-gita', single.body.data.code);
    expect(usedUp.status).toBe(404);
    expect(usedUp.body.error.code).toBe('INVITE_INVALID');

    const revocable = await createInvite(SEED.users.sakuraOwner, SEED.sakura, { role: 'LEARNER' });
    const revoked = await ctx.http
      .delete(`/v1/tenants/${SEED.sakura}/invites/${revocable.body.data.id}`)
      .set(await bearer(SEED.users.sakuraOwner));
    expect(revoked.status).toBe(200);
    expect(revoked.body.data.status).toBe('REVOKED');
    expect((await redeem('dev|late-ram', revocable.body.data.code)).body.error.code).toBe('INVITE_INVALID');

    const expiring = await createInvite(SEED.users.sakuraOwner, SEED.sakura, { role: 'LEARNER' });
    await ownerQuery("UPDATE tenant_invites SET expires_at = now() - interval '1 minute' WHERE id = $1", [expiring.body.data.id]);
    expect((await redeem('dev|late-ram', expiring.body.data.code)).body.error.code).toBe('INVITE_INVALID');

    const unknown = await redeem('dev|late-ram', 'ZZZZ-ZZZZ');
    expect(unknown.body.error.code).toBe('INVITE_INVALID');
    expect((await redeem('dev|late-ram', 'not a code!')).body.error.code).toBe('INVITE_INVALID');

    const failures = ctx.securityEvents.filter((event) => event.event.action === 'tenant.invite.redeem_failed');
    expect(failures.length).toBeGreaterThanOrEqual(5);
    failures.forEach(assertValidSecurityEvent);

    const statuses = await ctx.http.get(`/v1/tenants/${SEED.sakura}/invites`).set(await bearer(SEED.users.sakuraOwner));
    expect(statuses.body.data.map((invite: { status: string }) => invite.status)).toEqual(
      expect.arrayContaining(['USED_UP', 'REVOKED', 'EXPIRED', 'ACTIVE']),
    );
  });

  it('requires a verified email to join', async () => {
    const code = (await createInvite(SEED.users.sakuraOwner, SEED.sakura, { role: 'LEARNER' })).body.data.code;
    const response = await redeem('dev|unverified-mohan', code, false);
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('keeps each tenant’s codes and people private from other tenants', async () => {
    const sakuraInvite = await createInvite(SEED.users.sakuraOwner, SEED.sakura, { role: 'LEARNER' });

    const list = await ctx.http.get(`/v1/tenants/${SEED.sakura}/invites`).set(await bearer(SEED.users.everestOwner));
    expect(list.status).toBe(404);
    const revoke = await ctx.http
      .delete(`/v1/tenants/${SEED.everest}/invites/${sakuraInvite.body.data.id}`)
      .set(await bearer(SEED.users.everestOwner));
    expect(revoke.status).toBe(404);

    const everestCodes = await ctx.http.get(`/v1/tenants/${SEED.everest}/invites`).set(await bearer(SEED.users.everestOwner));
    expect(everestCodes.body.data.map((invite: { code: string }) => invite.code)).not.toContain(sakuraInvite.body.data.code);
  });

  it('lists the people in a workspace for its administrators', async () => {
    const people = await ctx.http.get(`/v1/tenants/${SEED.sakura}/members`).set(await bearer(SEED.users.sakuraOwner));
    expect(people.status).toBe(200);
    const roles = Object.fromEntries(people.body.data.map((m: { role: string; userId: string }) => [m.userId, m.role]));
    expect(Object.values(roles)).toEqual(expect.arrayContaining(['OWNER', 'INSTRUCTOR', 'LEARNER', 'ADMIN']));
    const everestPeople = await ctx.http.get(`/v1/tenants/${SEED.everest}/members`).set(await bearer(SEED.users.everestOwner));
    expect(everestPeople.body.data.length).toBeLessThan(people.body.data.length);
  });
});
