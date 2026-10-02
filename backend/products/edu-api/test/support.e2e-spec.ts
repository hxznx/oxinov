/**
 * Support messages and OXI against real PostgreSQL (FR-CHAT-1301 learner-to-support, FR-AI-1705): each
 * learner sees only their own thread, administrators answer from the inbox, unread markers move with each
 * side, a reply notifies the learner, and OXI recommends only published store offerings.
 */
import { DatabaseContext } from '../src/database/database-context.service';
import { SEED, createTestContext, ownerQuery, resetDatabase, type TestContext } from './helpers';

describe('support messages and OXI', () => {
  let ctx: TestContext;
  const { sakuraOwner: owner, aiko, bikash, instructor, everestOwner } = SEED.users;
  const base = `/v1/tenants/${SEED.sakura}`;
  const auth = async (subject: string) => ({ Authorization: `Bearer ${await ctx.devToken(subject)}` });
  const get = async (subject: string, path: string) => ctx.http.get(`${base}${path}`).set(await auth(subject));
  const post = async (subject: string, path: string, body: object) => ctx.http.post(`${base}${path}`).set(await auth(subject)).send(body);
  type Thread = { id: string; learnerEmail: string | null; unread: boolean; lastSender: string };
  let threadId = '';

  beforeAll(async () => {
    await resetDatabase();
    ctx = await createTestContext();
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('starts a learner’s private thread with their first message', async () => {
    expect((await get(aiko, '/me/support')).body.data).toEqual({ threadId: null, unread: false, messages: [] });
    expect((await post(aiko, '/me/support', { body: '   ' })).status).toBe(400);
    const sent = await post(aiko, '/me/support', { body: 'Can I watch on my phone?' });
    expect(sent.status).toBe(200);
    expect(sent.body.data.messages).toEqual([expect.objectContaining({ sender: 'LEARNER', body: 'Can I watch on my phone?' })]);
    threadId = sent.body.data.threadId as string;
  });

  it('keeps each thread private to its learner and the workspace administrators', async () => {
    expect((await get(bikash, '/me/support')).body.data.threadId).toBeNull();
    expect((await get(bikash, '/support/threads')).status).toBe(403);
    expect((await get(instructor, '/support/threads')).status).toBe(403);
    expect((await get(everestOwner, `/support/threads/${threadId}`)).status).toBe(404);
    const bikashId = (await ownerQuery<{ id: string }>('SELECT id FROM user_profiles WHERE auth_subject = $1', [bikash]))[0]!.id;
    const seen = await ctx.app.get(DatabaseContext).run({ tenantId: SEED.sakura, userId: bikashId }, (tx) => tx.supportMessage.count());
    expect(seen).toBe(0);
  });

  it('lets an administrator read and reply; the learner is notified and sees it as unread', async () => {
    const [first] = (await get(owner, '/support/threads')).body.data as Thread[];
    expect(first).toMatchObject({ id: threadId, learnerEmail: 'aiko@learner.example', unread: true, lastSender: 'LEARNER' });
    expect((await get(owner, `/support/threads/${threadId}`)).body.data.messages).toHaveLength(1);
    expect(((await get(owner, '/support/threads')).body.data as Thread[])[0]?.unread).toBe(false);

    const replied = await post(owner, `/support/threads/${threadId}/messages`, { body: 'Yes: choose "Add to home screen".' });
    expect(replied.status).toBe(200);
    expect(replied.body.data.messages[1]).toMatchObject({ sender: 'STAFF', authorName: null });
    expect(((await get(owner, '/support/threads')).body.data as Thread[])[0]?.unread).toBe(false);

    expect((await get(aiko, '/me/support/unread')).body.data).toBe(true);
    expect((await get(aiko, '/me/support')).body.data.unread).toBe(true);
    expect((await get(aiko, '/me/support/unread')).body.data).toBe(false);
    const notices = await get(aiko, '/me/notifications');
    expect(JSON.stringify(notices.body.data)).toContain('Oxinov support replied');
  });

  it('OXI recommends only published store offerings and hands people questions to support', async () => {
    const ask = async (question: string) => (await ctx.http.post('/v1/oxi/ask').set(await auth(bikash)).send({ question })).body.data as { reply: string; picks: { slug: string }[]; handoff: boolean };
    const published = (await ctx.http.get('/v1/store')).body.data.offerings.map((offering: { slug: string }) => offering.slug) as string[];
    const answer = await ask('I want to learn Japanese hiragana');
    expect(answer.picks.length).toBeGreaterThan(0);
    expect(answer.picks.every((item) => published.includes(item.slug))).toBe(true);
    expect(answer.picks.some((item) => item.slug === 'jlpt-n4-grammar')).toBe(false);
    expect((await ask('Talk to a human')).handoff).toBe(true);
    expect((await ctx.http.post('/v1/oxi/ask').send({ question: 'hi' })).status).toBe(401);
  });
});
