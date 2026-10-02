/**
 * Account deletion and data export against real PostgreSQL (FR-PRIV-3201, FR-PRIV-3202): a 14-day wait the
 * person can cancel, owners must hand over first, nothing is removed before the wait ends (row-level security
 * enforces it), and afterwards the old sign-in starts a new, empty account while payment records stay.
 */
import { AccountService } from '../src/account/account.service';
import { DatabaseContext } from '../src/database/database-context.service';
import { SEED, createTestContext, ownerQuery, resetDatabase, type TestContext } from './helpers';

describe('account deletion and export', () => {
  let ctx: TestContext;
  const { sakuraOwner: owner, aiko, bikash } = SEED.users;
  const base = `/v1/tenants/${SEED.sakura}`;
  const auth = async (subject: string) => ({ Authorization: `Bearer ${await ctx.devToken(subject)}` });
  const me = async (subject: string, method: 'get' | 'post' | 'delete', path: string, body?: object) => {
    const req = ctx.http[method](`/v1/me${path}`).set(await auth(subject));
    return body ? req.send(body) : req;
  };
  const profileId = async (subject: string) => (await ownerQuery<{ id: string }>('SELECT id FROM user_profiles WHERE auth_subject = $1', [subject]))[0]?.id;
  let aikoId = '';

  beforeAll(async () => {
    await resetDatabase();
    ctx = await createTestContext();
    const api = async (path: string, body?: object) => ctx.http.post(`${base}${path}`).set(await auth(aiko)).send(body ?? {});
    expect((await api(`/courses/${SEED.freeCourse}/enrollments`)).status).toBe(201);
    expect((await api(`/courses/${SEED.freeCourse}/lessons/${SEED.freeLesson}/notes`, { body: 'My private note', timestampSec: 5 })).status).toBe(201);
    expect((await ctx.http.put(`${base}/courses/${SEED.freeCourse}/review`).set(await auth(aiko)).send({ rating: 5, body: 'Lovely' })).status).toBe(200);
    aikoId = (await profileId(aiko))!;
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('exports the person’s own data across their workspaces', async () => {
    const res = await me(aiko, 'get', '/export');
    expect(res.status).toBe(200);
    const sakura = (res.body.data.workspaces as { workspace: { slug: string }; notes: { body: string }[]; reviews: unknown[]; access: unknown[] }[]).find((item) => item.workspace.slug === 'sakura');
    expect(sakura?.notes.map((note) => note.body)).toEqual(['My private note']);
    expect(sakura?.reviews).toHaveLength(1);
    expect(sakura?.access.length).toBeGreaterThan(0);
    expect(res.body.data.profile.email).toBe('aiko@learner.example');
  });

  it('needs the word DELETE and refuses workspace owners', async () => {
    expect((await me(aiko, 'post', '/deletion', { confirm: 'yes' })).status).toBe(409);
    const ownerTry = await me(owner, 'post', '/deletion', { confirm: 'DELETE' });
    expect(ownerTry.status).toBe(409);
    expect(ownerTry.body.error.message).toMatch(/Make another member the owner/);
  });

  it('schedules deletion in 14 days and lets the person cancel and ask again', async () => {
    const asked = await me(aiko, 'post', '/deletion', { confirm: 'DELETE' });
    expect(asked.status).toBe(200);
    expect(asked.body.data.state).toBe('SCHEDULED');
    const days = (new Date(asked.body.data.deleteAfter).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(13.9);
    expect(days).toBeLessThanOrEqual(14);
    expect((await me(aiko, 'delete', '/deletion')).body.data.state).toBe('CANCELLED');
    expect((await me(aiko, 'get', '/deletion')).body.data.state).toBe('CANCELLED');
    expect((await me(aiko, 'delete', '/deletion')).status).toBe(404);
    expect((await me(aiko, 'post', '/deletion', { confirm: 'DELETE' })).body.data.state).toBe('SCHEDULED');
  });

  it('removes nothing before the waiting period ends, even if code asks to', async () => {
    expect(await ctx.app.get(AccountService).sweep()).toBe(0);
    const db = ctx.app.get(DatabaseContext);
    const bikashId = (await profileId(bikash))!;
    for (const target of [aikoId, bikashId]) {
      const removed = await db.run({ deletingUserId: target }, (tx) => tx.lessonNote.deleteMany({ where: { userId: target } }));
      expect(removed.count).toBe(0);
      const renamed = await db.run({ deletingUserId: target }, (tx) => tx.userProfile.updateMany({ where: { id: target }, data: { displayName: null, email: null, authSubject: `deleted|${target}` } }));
      expect(renamed.count).toBe(0);
    }
    expect(await ownerQuery('SELECT 1 FROM lesson_notes WHERE user_id = $1', [aikoId])).toHaveLength(1);
  });

  it('deletes the account when the wait is over; signing in again starts an empty account', async () => {
    await ownerQuery(`UPDATE account_deletion_requests SET requested_at = now() - interval '15 days', delete_after = now() - interval '1 day' WHERE user_id = $1`, [aikoId]);
    expect(await ctx.app.get(AccountService).sweep()).toBe(1);

    const [profile] = await ownerQuery<{ email: string | null; display_name: string | null; auth_subject: string }>('SELECT email, display_name, auth_subject FROM user_profiles WHERE id = $1', [aikoId]);
    expect(profile).toEqual({ email: null, display_name: null, auth_subject: `deleted|${aikoId}` });
    for (const table of ['lesson_notes', 'course_reviews', 'notifications', 'tenant_memberships']) {
      expect(await ownerQuery(`SELECT 1 FROM ${table} WHERE user_id = $1`, [aikoId])).toHaveLength(0);
    }
    // Records stay, without personal details.
    expect((await ownerQuery('SELECT 1 FROM enrollments WHERE user_id = $1', [aikoId])).length).toBeGreaterThan(0);
    expect((await ownerQuery<{ completed_at: Date | null }>('SELECT completed_at FROM account_deletion_requests WHERE user_id = $1', [aikoId]))[0]?.completed_at).not.toBeNull();

    // The same sign-in now resolves to a brand-new profile with no workspaces.
    const workspaces = await ctx.http.get('/v1/tenants').set(await auth(aiko));
    expect(workspaces.status).toBe(200);
    expect(workspaces.body.data).toEqual([]);
    expect(await profileId(aiko)).not.toBe(aikoId);
    expect((await me(aiko, 'get', '/deletion')).body.data.state).toBe('NONE');
    expect(await ctx.app.get(AccountService).sweep()).toBe(0);
  });
});
