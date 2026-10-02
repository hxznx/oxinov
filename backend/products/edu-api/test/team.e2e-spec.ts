/**
 * Team and roles against real PostgreSQL (FR-AUTH-102; design screen 22): who may change roles and access,
 * that suspension locks a member out at once, and the audit log administrators read.
 */
import { SEED, createTestContext, ownerQuery, resetDatabase, type TestContext } from './helpers';

describe('team and roles', () => {
  let ctx: TestContext;
  const { sakuraOwner: owner, instructor, aiko, bikash, everestOwner } = SEED.users;
  const base = `/v1/tenants/${SEED.sakura}`;
  const auth = async (subject: string) => ({ Authorization: `Bearer ${await ctx.devToken(subject)}` });
  const id = async (subject: string) => (await ownerQuery<{ id: string }>(`SELECT id FROM user_profiles WHERE auth_subject = $1`, [subject]))[0]!.id;
  const patch = async (actor: string, target: string, body: object) => ctx.http.patch(`${base}/members/${await id(target)}`).set(await auth(actor)).send(body);

  beforeAll(async () => {
    await resetDatabase();
    ctx = await createTestContext();
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('lets the owner promote a teacher to administrator, and administrators manage learners only', async () => {
    const promoted = await patch(owner, instructor, { role: 'ADMIN' });
    expect(promoted.status).toBe(200);
    expect(promoted.body.data).toMatchObject({ role: 'ADMIN', status: 'ACTIVE' });

    // The new administrator manages learners and teachers, but not other administrators or owners.
    expect((await patch(instructor, aiko, { role: 'INSTRUCTOR' })).body.data.role).toBe('INSTRUCTOR');
    expect((await patch(instructor, aiko, { role: 'ADMIN' })).status).toBe(403);
    expect((await patch(instructor, owner, { status: 'SUSPENDED' })).status).toBe(403);
    // Learners change nobody; nobody changes themselves.
    expect((await patch(bikash, aiko, { role: 'LEARNER' })).status).toBe(403);
    expect((await patch(owner, owner, { role: 'ADMIN' })).body.error.message).toMatch(/your own/);
    // An empty change and a member of another workspace are refused.
    expect((await patch(owner, aiko, {})).status).toBe(409);
    expect((await patch(owner, everestOwner, { role: 'LEARNER' })).status).toBe(404);
    expect((await patch(owner, aiko, { role: 'SUPERUSER' })).status).toBe(400);
  });

  it('locks a suspended member out at once and lets them back in when restored', async () => {
    expect((await ctx.http.get(`${base}/courses`).set(await auth(bikash))).status).toBe(200);
    expect((await patch(instructor, bikash, { status: 'SUSPENDED' })).body.data.status).toBe('SUSPENDED');
    expect([403, 404]).toContain((await ctx.http.get(`${base}/courses`).set(await auth(bikash))).status);
    expect((await patch(instructor, bikash, { status: 'ACTIVE' })).body.data.status).toBe('ACTIVE');
    expect((await ctx.http.get(`${base}/courses`).set(await auth(bikash))).status).toBe(200);
  });

  it('shows administrators the audit log with who did what, and nobody else', async () => {
    const log = await ctx.http.get(`${base}/audit-events`).set(await auth(owner));
    expect(log.status).toBe(200);
    const updates = (log.body.data as { action: string; actor: string | null; metadata: { to: { role: string; status: string } } }[]).filter(
      (event) => event.action === 'tenant.member.updated',
    );
    expect(updates.length).toBe(4);
    expect(updates.at(-1)).toMatchObject({ metadata: { to: { role: 'ADMIN' } } });
    expect(updates.every((event) => typeof event.actor === 'string' && event.actor.length > 0)).toBe(true);
    expect((await ctx.http.get(`${base}/audit-events`).set(await auth(aiko))).status).toBe(403);
  });
});
