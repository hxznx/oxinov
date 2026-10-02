/**
 * Free access grants against real PostgreSQL (FR-MGMT-1404): administrators give a member access for a
 * length with a required reason, the learner is notified, everything is audited, and a revoke ends it.
 */
import { SEED, createTestContext, ownerQuery, resetDatabase, type TestContext } from './helpers';

describe('free access grants', () => {
  let ctx: TestContext;
  const { sakuraOwner: owner, aiko, bikash } = SEED.users;
  const base = `/v1/tenants/${SEED.sakura}`;
  const auth = async (subject: string) => ({ Authorization: `Bearer ${await ctx.devToken(subject)}` });
  const lesson = async () => ctx.http.get(`${base}/courses/${SEED.paidCourse}/lessons/${SEED.paidLesson}`).set(await auth(aiko));
  let aikoEmail = '';

  beforeAll(async () => {
    await resetDatabase();
    ctx = await createTestContext();
    aikoEmail = (await ownerQuery<{ email: string }>(`SELECT email FROM user_profiles WHERE auth_subject = $1`, [aiko]))[0]!.email;
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('gives a member a month of access with a reason, notifies them, and audits it', async () => {
    expect((await lesson()).body.error.code).toBe('NOT_ENTITLED');
    const body = { email: aikoEmail.toUpperCase(), courseId: SEED.paidCourse, length: 'MONTH_1', reason: 'Scholarship 2026' };

    expect((await ctx.http.post(`${base}/store/grants`).set(await auth(bikash)).send(body)).status).toBe(403);
    expect((await ctx.http.post(`${base}/store/grants`).set(await auth(owner)).send({ ...body, reason: '' })).status).toBe(400);
    expect((await ctx.http.post(`${base}/store/grants`).set(await auth(owner)).send({ ...body, email: 'nobody@example.com' })).status).toBe(404);
    expect((await ctx.http.post(`${base}/store/grants`).set(await auth(owner)).send({ ...body, courseId: SEED.draftCourse })).status).toBe(404);

    const granted = await ctx.http.post(`${base}/store/grants`).set(await auth(owner)).send(body);
    expect(granted.status).toBe(201);
    expect(granted.body.data).toMatchObject({ learnerEmail: aikoEmail, courseTitle: 'JLPT N5 Complete Preparation', revokedAt: null });
    const days = (new Date(granted.body.data.endsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(days).toBeGreaterThan(27);
    expect(days).toBeLessThan(32);

    expect((await lesson()).status).toBe(200);
    const notices = await ctx.http.get(`${base}/me/notifications`).set(await auth(aiko));
    expect(notices.body.data.items[0]).toMatchObject({ title: 'You have been given access to JLPT N5 Complete Preparation' });
    const [audit] = await ownerQuery<{ metadata: { reason: string; length: string } }>(`SELECT metadata FROM audit_events WHERE action = 'access.granted'`);
    expect(audit!.metadata).toMatchObject({ reason: 'Scholarship 2026', length: 'MONTH_1' });
  });

  it('lists grants and revokes one with a reason, ending access at once', async () => {
    const list = await ctx.http.get(`${base}/store/grants`).set(await auth(owner));
    expect(list.body.data).toHaveLength(1);
    const grantId = list.body.data[0].id as string;
    expect((await ctx.http.post(`${base}/store/grants/${grantId}/revoke`).set(await auth(owner)).send({ reason: 'x' })).status).toBe(400);
    const revoked = await ctx.http.post(`${base}/store/grants/${grantId}/revoke`).set(await auth(owner)).send({ reason: 'Given by mistake' });
    expect(revoked.status).toBe(200);
    expect(revoked.body.data).toMatchObject({ revokeReason: 'Given by mistake' });
    expect((await lesson()).body.error.code).toBe('NOT_ENTITLED');
    // A revoked grant cannot be revoked again.
    expect((await ctx.http.post(`${base}/store/grants/${grantId}/revoke`).set(await auth(owner)).send({ reason: 'Again please' })).status).toBe(404);
  });
});
