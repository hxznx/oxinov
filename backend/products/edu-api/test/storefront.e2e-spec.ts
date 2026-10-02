/**
 * Oxinov's public store against real PostgreSQL (ADR-028): browsing without sign-in, the offering page's
 * public syllabus and plans, joining the store as a learner, and the kind and category set in Studio.
 * The seed's Sakura workspace is the configured seller (PAYMENTS_SELLER_TENANT_IDS in setup-env).
 */
import { SEED, createTestContext, ownerQuery, resetDatabase, type TestContext } from './helpers';

describe('Oxinov store: public pages and joining', () => {
  let ctx: TestContext;
  const { sakuraOwner: owner, instructor, aiko, everestOwner } = SEED.users;
  const auth = async (subject: string) => ({ Authorization: `Bearer ${await ctx.devToken(subject)}` });
  const listing = (courseId: string) => `/v1/tenants/${SEED.sakura}/courses/${courseId}/listing`;

  beforeAll(async () => {
    await resetDatabase();
    ctx = await createTestContext();
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('lists only the seller workspace’s published offerings to anyone, without signing in', async () => {
    const res = await ctx.http.get('/v1/store');
    expect(res.status).toBe(200);
    const store = res.body.data;
    expect(store).toMatchObject({ name: 'Sakura Japanese School', slug: 'sakura', upcomingLive: [] });
    expect(store.defaultPlans.map((plan: { label: string; priceMinor: number }) => [plan.label, plan.priceMinor])).toEqual([
      ['1 month', 500_000],
      ['6 months', 1_000_000],
      ['1 year', 1_500_000],
      ['Lifetime', 2_000_000],
    ]);
    // Drafts and other workspaces' courses never appear.
    expect(store.offerings.map((offering: { slug: string }) => offering.slug).sort()).toEqual(['hiragana-first-words', 'jlpt-n5-complete']);
    const free = store.offerings.find((offering: { slug: string }) => offering.slug === 'hiragana-first-words');
    expect(free).toMatchObject({ kind: 'COURSE', category: 'OTHER', free: true, hasPlans: false, fromMinor: 0 });
    expect(free.lessonCount).toBeGreaterThan(0);
  });

  it('shows the syllabus and plans on the offering page but never lesson content', async () => {
    const plans = [
      { period: 'MONTH_1', priceMinor: 500_000, active: true },
      { period: 'MONTH_6', priceMinor: 1_000_000, active: false },
      { period: 'YEAR_1', priceMinor: 1_500_000, active: true },
    ];
    expect((await ctx.http.put(`/v1/tenants/${SEED.sakura}/courses/${SEED.paidCourse}/plans`).set(await auth(owner)).send({ plans })).status).toBe(200);

    const res = await ctx.http.get('/v1/store/offerings/jlpt-n5-complete');
    expect(res.status).toBe(200);
    const offering = res.body.data;
    expect(offering).toMatchObject({ id: SEED.paidCourse, hasPlans: true, free: false, fromMinor: 500_000, storeSlug: 'sakura', checkoutOpen: false });
    expect(offering.plans.map((plan: { label: string }) => plan.label)).toEqual(['1 month', '1 year']);
    expect(offering.curriculum.length).toBeGreaterThan(0);
    const lessons = offering.curriculum.flatMap((section: { lessons: object[] }) => section.lessons);
    expect(lessons.some((lesson: { isPreview: boolean }) => lesson.isPreview)).toBe(true);
    // Titles only: no body, media, resources, or IDs that would open a lesson.
    for (const lesson of lessons) expect(Object.keys(lesson).sort()).toEqual(['durationSec', 'isPreview', 'kind', 'title']);
    expect(JSON.stringify(offering)).not.toContain(SEED.paidLesson);

    // Drafts, other workspaces, and malformed addresses are simply not found.
    expect((await ctx.http.get('/v1/store/offerings/jlpt-n4-grammar')).status).toBe(404);
    expect((await ctx.http.get('/v1/store/offerings/networking-fundamentals')).status).toBe(404);
    expect((await ctx.http.get('/v1/store/offerings/..%2Fsecret')).status).toBe(404);
  });

  it('lists the next live classes on the store home without their meeting links', async () => {
    const startsAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const created = await ctx.http
      .post(`/v1/tenants/${SEED.sakura}/courses/${SEED.freeCourse}/live-sessions`)
      .set(await auth(owner))
      .send({ title: 'Open class: start Japanese', startsAt, durationMin: 60, joinUrl: 'https://meet.google.com/abc-defg-hij', visibility: 'FREE' });
    expect(created.status).toBe(201);
    const home = await ctx.http.get('/v1/store');
    expect(home.body.data.upcomingLive).toEqual([
      { title: 'Open class: start Japanese', startsAt, durationMin: 60, visibility: 'FREE', offeringSlug: 'hiragana-first-words', offeringTitle: expect.any(String) },
    ]);
    expect(JSON.stringify(home.body.data)).not.toContain('meet.google.com');
  });

  it('lets a signed-in visitor join the store as a learner once, and needs sign-in to do it', async () => {
    expect((await ctx.http.post('/v1/store/join')).status).toBe(401);

    const first = await ctx.http.post('/v1/store/join').set(await auth(everestOwner));
    expect(first.status).toBe(201);
    expect(first.body.data).toMatchObject({ id: SEED.sakura, slug: 'sakura', role: 'LEARNER' });
    const again = await ctx.http.post('/v1/store/join').set(await auth(everestOwner));
    expect(again.status).toBe(200);
    const workspaces = await ctx.http.get('/v1/tenants').set(await auth(everestOwner));
    expect(workspaces.body.data.map((w: { slug: string }) => w.slug).sort()).toEqual(['everest', 'sakura']);
    const audit = await ownerQuery(`SELECT 1 FROM audit_events WHERE tenant_id = $1 AND action = 'tenant.member.joined_store'`, [SEED.sakura]);
    expect(audit).toHaveLength(1);

    // Existing members keep their role; a suspended learner stays suspended.
    expect((await ctx.http.post('/v1/store/join').set(await auth(owner))).body.data.role).toBe('OWNER');
    await ownerQuery(`UPDATE tenant_memberships SET status = 'SUSPENDED' WHERE tenant_id = $1 AND user_id = (SELECT id FROM user_profiles WHERE auth_subject = $2)`, [SEED.sakura, aiko]);
    expect((await ctx.http.post('/v1/store/join').set(await auth(aiko))).status).toBe(403);
  });

  it('lets administrators set an offering’s kind and category, and shows them on the store', async () => {
    const body = { kind: 'IDEA', category: 'IDEAS_RESEARCH' };
    expect((await ctx.http.put(listing(SEED.paidCourse)).set(await auth(instructor)).send(body)).status).toBe(403);
    expect((await ctx.http.put(listing(SEED.paidCourse)).set(await auth(owner)).send({ kind: 'PODCAST', category: 'OTHER' })).status).toBe(400);
    expect((await ctx.http.put(listing(SEED.everestCourse)).set(await auth(owner)).send(body)).status).toBe(404);
    const saved = await ctx.http.put(listing(SEED.paidCourse)).set(await auth(owner)).send(body);
    expect(saved.status).toBe(200);
    expect(saved.body.data).toEqual({ courseId: SEED.paidCourse, ...body });

    const offering = await ctx.http.get('/v1/store/offerings/jlpt-n5-complete');
    expect(offering.body.data).toMatchObject(body);
    const catalog = await ctx.http.get(`/v1/tenants/${SEED.sakura}/courses/${SEED.paidCourse}`).set(await auth(owner));
    expect(catalog.body.data).toMatchObject(body);
  });
});
