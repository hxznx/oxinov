/**
 * Ratings and reviews against real PostgreSQL (FR-CATALOG-304, approve first): only learners who have had
 * access can review, a review shows on the public offering page only after an administrator approves it,
 * an edit sends it back for approval, and a hidden review's reason is never public.
 */
import { SEED, createTestContext, resetDatabase, type TestContext } from './helpers';

describe('reviews', () => {
  let ctx: TestContext;
  const { sakuraOwner: owner, aiko, bikash, instructor, everestOwner } = SEED.users;
  const base = `/v1/tenants/${SEED.sakura}`;
  const course = SEED.freeCourse;
  const auth = async (subject: string) => ({ Authorization: `Bearer ${await ctx.devToken(subject)}` });
  type Offering = { ratingAverage: number | null; ratingCount: number; reviews: { author: string; rating: number; body: string }[] };
  const offering = async () => (await ctx.http.get('/v1/store/offerings/hiragana-first-words')).body.data as Offering;
  const queue = async (status = 'PENDING') => (await ctx.http.get(`${base}/store/reviews?status=${status}`).set(await auth(owner))).body.data as { id: string; rating: number }[];

  beforeAll(async () => {
    await resetDatabase();
    ctx = await createTestContext();
    expect((await ctx.http.post(`${base}/courses/${course}/enrollments`).set(await auth(aiko))).status).toBe(201);
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('lets only learners who joined the offering write a review', async () => {
    const mine = await ctx.http.get(`${base}/courses/${course}/review`).set(await auth(bikash));
    expect(mine.status).toBe(200);
    expect(mine.body.data).toMatchObject({ canReview: false, status: null });
    expect((await ctx.http.put(`${base}/courses/${course}/review`).set(await auth(bikash)).send({ rating: 5, body: 'Great' })).status).toBe(403);
    expect((await ctx.http.put(`${base}/courses/${course}/review`).set(await auth(aiko)).send({ rating: 6 })).status).toBe(400);
    expect((await ctx.http.put(`${base}/courses/${SEED.draftCourse}/review`).set(await auth(aiko)).send({ rating: 4 })).status).toBe(404);
    expect((await ctx.http.put(`/v1/tenants/${SEED.sakura}/courses/${course}/review`).set(await auth(everestOwner)).send({ rating: 1 })).status).toBe(404);
  });

  it('keeps a new review pending and off the offering page until it is approved', async () => {
    const saved = await ctx.http.put(`${base}/courses/${course}/review`).set(await auth(aiko)).send({ rating: 4, body: '  Clear lessons.  ' });
    expect(saved.status).toBe(200);
    expect(saved.body.data).toMatchObject({ canReview: true, rating: 4, body: 'Clear lessons.', status: 'PENDING' });
    expect(await offering()).toMatchObject({ ratingCount: 0, rating: { average: null, count: 0 }, reviews: [] });

    expect((await ctx.http.get(`${base}/store/reviews`).set(await auth(instructor))).status).toBe(403);
    const [pending] = await queue();
    expect(pending).toMatchObject({ rating: 4 });
    expect((await ctx.http.post(`${base}/store/reviews/${pending!.id}/approve`).set(await auth(owner))).status).toBe(204);

    const page = await offering();
    expect(page).toMatchObject({ ratingAverage: 4, ratingCount: 1, rating: { average: 4, count: 1, stars: [0, 1, 0, 0, 0] } });
    expect(page.reviews).toEqual([expect.objectContaining({ rating: 4, body: 'Clear lessons.' })]);
    expect(page.reviews[0]?.author).not.toContain('@');
    const notices = await ctx.http.get(`/v1/tenants/${SEED.sakura}/me/notifications`).set(await auth(aiko));
    expect(JSON.stringify(notices.body.data)).toContain('Your review is live');
  });

  it('sends an edited review back for approval', async () => {
    await ctx.http.put(`${base}/courses/${course}/review`).set(await auth(aiko)).send({ rating: 2, body: 'Changed my mind.' });
    expect(await offering()).toMatchObject({ ratingCount: 0, reviews: [] });
    expect((await queue()).map((review) => review.rating)).toEqual([2]);
  });

  it('hides a review with a reason that stays private', async () => {
    const [pending] = await queue();
    expect((await ctx.http.post(`${base}/store/reviews/${pending!.id}/hide`).set(await auth(owner)).send({ reason: 'x' })).status).toBe(400);
    expect((await ctx.http.post(`${base}/store/reviews/${pending!.id}/hide`).set(await auth(owner)).send({ reason: 'Contains a phone number' })).status).toBe(204);
    expect(await queue('HIDDEN')).toEqual([expect.objectContaining({ id: pending!.id, moderationReason: 'Contains a phone number' })]);
    const page = await offering();
    expect(JSON.stringify(page)).not.toContain('phone number');
    expect(page.ratingCount).toBe(0);
    const mine = await ctx.http.get(`${base}/courses/${course}/review`).set(await auth(aiko));
    expect(mine.body.data.status).toBe('HIDDEN');
    expect(JSON.stringify(mine.body.data)).not.toContain('phone number');
    const audit = await ctx.http.get(`${base}/audit-events`).set(await auth(owner));
    expect((audit.body.data as { action: string }[]).map((event) => event.action)).toEqual(expect.arrayContaining(['review.approved', 'review.hidden']));
  });

  it('lets the learner withdraw their own review', async () => {
    expect((await ctx.http.delete(`${base}/courses/${course}/review`).set(await auth(aiko))).status).toBe(204);
    expect((await ctx.http.delete(`${base}/courses/${course}/review`).set(await auth(aiko))).status).toBe(404);
  });
});
