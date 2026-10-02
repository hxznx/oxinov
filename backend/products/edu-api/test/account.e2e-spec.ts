/**
 * The learner account centre's data against real PostgreSQL (FR-AUTH-104): the caller's own
 * subscriptions with plan, price paid, and end date or lifetime, and their own bank payments, never
 * another learner's or another workspace's.
 */
import { SEED, createTestContext, ownerQuery, resetDatabase, type TestContext } from './helpers';

const DAY = 24 * 60 * 60 * 1000;

describe('learner account centre', () => {
  let ctx: TestContext;
  const { aiko, bikash, everestOwner } = SEED.users;
  const base = `/v1/tenants/${SEED.sakura}`;
  const get = async (subject: string, path: string) => ctx.http.get(`${base}${path}`).set({ Authorization: `Bearer ${await ctx.devToken(subject)}` });
  const userId = async (subject: string) => (await ownerQuery<{ id: string }>(`SELECT id FROM user_profiles WHERE auth_subject = $1`, [subject]))[0]!.id;

  beforeAll(async () => {
    await resetDatabase();
    ctx = await createTestContext();
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('lists the caller’s subscriptions with plan, price, and end date, active first', async () => {
    const aikoId = await userId(aiko);
    // A free course through the API, and a paid 1-year plan renewed from a month (as approval records it).
    expect((await ctx.http.post(`${base}/courses/${SEED.freeCourse}/enrollments`).set({ Authorization: `Bearer ${await ctx.devToken(aiko)}` })).status).toBe(201);
    const [enrollment] = await ownerQuery<{ id: string }>(`INSERT INTO enrollments (tenant_id, user_id, course_id) VALUES ($1, $2, $3) RETURNING id`, [SEED.sakura, aikoId, SEED.paidCourse]);
    const payment = async (period: string, amount: number, ref: string) =>
      (
        await ownerQuery<{ id: string }>(
          `INSERT INTO payments (tenant_id, user_id, course_id, provider, provider_payment_id, amount_minor, currency, status, verified_at, plan_period, list_price_minor)
           VALUES ($1, $2, $3, 'BANK_QR', $4, $5, 'NPR', 'SUCCEEDED', now(), $6, $5) RETURNING id`,
          [SEED.sakura, aikoId, SEED.paidCourse, ref, amount, period],
        )
      )[0]!.id;
    const month = await payment('MONTH_1', 500_000, 'OXE-AAAAA1');
    const year = await payment('YEAR_1', 1_500_000, 'OXE-AAAAA2');
    const now = Date.now();
    await ownerQuery(
      `INSERT INTO entitlements (tenant_id, user_id, course_id, enrollment_id, source, payment_id, starts_at, ends_at) VALUES
         ($1, $2, $3, $4, 'PURCHASE', $5, $6, $7), ($1, $2, $3, $4, 'PURCHASE', $8, $7, $9)`,
      [SEED.sakura, aikoId, SEED.paidCourse, enrollment!.id, month, new Date(now - 10 * DAY), new Date(now + 20 * DAY), year, new Date(now + 385 * DAY)],
    );

    const res = await get(aiko, '/me/subscriptions');
    expect(res.status).toBe(200);
    const subs = res.body.data as { courseId: string; state: string; source: string; planLabel: string | null; paidMinor: number | null; endsAt: string | null }[];
    expect(subs.map((s) => [s.courseId, s.state, s.source, s.planLabel, s.paidMinor])).toEqual([
      [SEED.paidCourse, 'ACTIVE', 'PURCHASE', '1 year', 1_500_000],
      [SEED.freeCourse, 'ACTIVE', 'FREE', null, null],
    ]);
    expect(new Date(subs[0]!.endsAt!).getTime()).toBeCloseTo(now + 385 * DAY, -4);
    expect(subs[1]!.endsAt).toBeNull();

    // Another learner sees only their own; another workspace's owner cannot read this workspace at all.
    expect((await get(bikash, '/me/subscriptions')).body.data).toEqual([]);
    expect((await get(everestOwner, '/me/subscriptions')).status).toBe(404);
  });

  it('lists the caller’s own bank payments, newest first', async () => {
    const res = await get(aiko, '/me/bank-payments');
    expect(res.status).toBe(200);
    expect(res.body.data.map((p: { reference: string; planLabel: string; status: string }) => [p.reference, p.planLabel, p.status])).toEqual([
      ['OXE-AAAAA2', '1 year', 'SUCCEEDED'],
      ['OXE-AAAAA1', '1 month', 'SUCCEEDED'],
    ]);
    expect((await get(bikash, '/me/bank-payments')).body.data).toEqual([]);
  });

  it('shows the caller their own profile only, and needs sign-in', async () => {
    expect((await ctx.http.get('/v1/me')).status).toBe(401);
    const me = await ctx.http.get('/v1/me').set({ Authorization: `Bearer ${await ctx.devToken(aiko)}` });
    expect(me.status).toBe(200);
    const [profile] = await ownerQuery<{ email: string }>(`SELECT email FROM user_profiles WHERE auth_subject = $1`, [aiko]);
    expect(me.body.data).toMatchObject({ email: profile!.email });
  });
});
