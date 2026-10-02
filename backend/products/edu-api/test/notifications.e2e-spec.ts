/**
 * In-app notifications and renewal reminders against real PostgreSQL (FR-COMM-704, FR-AUTH-104): the
 * hourly sweep sends each reminder once per stage, course, and end date; payments notify the learner;
 * learners read and clear only their own; administrators send notices to members.
 */
import type { Mailer, OutgoingMail } from '../src/notifications/mailer';
import { RenewalRemindersService } from '../src/notifications/renewal-reminders.service';
import { SEED, createTestContext, ownerQuery, resetDatabase, type TestContext } from './helpers';

class CapturingMailer implements Mailer {
  readonly sent: OutgoingMail[] = [];
  send(mail: OutgoingMail): Promise<void> {
    this.sent.push(mail);
    return Promise.resolve();
  }
}

const DAY = 24 * 60 * 60 * 1000;

describe('notifications and renewal reminders', () => {
  let ctx: TestContext;
  const mailer = new CapturingMailer();
  const { sakuraOwner: owner, aiko, bikash, instructor } = SEED.users;
  const base = `/v1/tenants/${SEED.sakura}`;
  const auth = async (subject: string) => ({ Authorization: `Bearer ${await ctx.devToken(subject)}` });
  const list = async (subject: string) => ctx.http.get(`${base}/me/notifications`).set(await auth(subject));
  const userId = async (subject: string) => (await ownerQuery<{ id: string }>(`SELECT id FROM user_profiles WHERE auth_subject = $1`, [subject]))[0]!.id;
  const grant = async (learner: string, endsAt: Date | null) => {
    const id = await userId(learner);
    const existing = await ownerQuery<{ id: string }>(`SELECT id FROM enrollments WHERE tenant_id = $1 AND user_id = $2 AND course_id = $3`, [SEED.sakura, id, SEED.paidCourse]);
    const enrollment = existing[0]?.id ?? (await ownerQuery<{ id: string }>(`INSERT INTO enrollments (tenant_id, user_id, course_id) VALUES ($1, $2, $3) RETURNING id`, [SEED.sakura, id, SEED.paidCourse]))[0]!.id;
    await ownerQuery(`INSERT INTO entitlements (tenant_id, user_id, course_id, enrollment_id, source, starts_at, ends_at) VALUES ($1, $2, $3, $4, 'ADMIN_GRANT', now() - interval '20 days', $5)`, [
      SEED.sakura,
      id,
      SEED.paidCourse,
      enrollment,
      endsAt,
    ]);
  };

  beforeAll(async () => {
    await resetDatabase();
    ctx = await createTestContext({ mailer });
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('reminds 7 days and 1 day before access ends, then once when it ends, never twice', async () => {
    const reminders = ctx.app.get(RenewalRemindersService);
    const now = new Date();
    const end = new Date(now.getTime() + 5 * DAY);
    await grant(aiko, end);
    await grant(bikash, null); // lifetime: never reminded

    expect(await reminders.sweep(now)).toEqual({ notified: 1, emailed: 1 });
    expect(mailer.sent.at(-1)).toMatchObject({ subject: expect.stringMatching(/ends in 7 days$/) });
    expect(await reminders.sweep(now)).toEqual({ notified: 0, emailed: 0 });

    expect(await reminders.sweep(new Date(end.getTime() - 12 * 60 * 60 * 1000))).toEqual({ notified: 1, emailed: 1 });
    expect(mailer.sent.at(-1)).toMatchObject({ subject: expect.stringMatching(/ends tomorrow$/) });
    // When access ends: an in-app notice only.
    expect(await reminders.sweep(new Date(end.getTime() + 60 * 60 * 1000))).toEqual({ notified: 1, emailed: 0 });
    expect(await reminders.sweep(new Date(end.getTime() + 2 * 60 * 60 * 1000))).toEqual({ notified: 0, emailed: 0 });

    const mine = await list(aiko);
    expect(mine.body.data.unread).toBe(3);
    expect(mine.body.data.items.map((n: { kind: string; linkPath: string }) => [n.kind, n.linkPath])).toEqual([
      ['ACCESS_ENDED', '/o/jlpt-n5-complete'],
      ['RENEWAL_DUE', '/o/jlpt-n5-complete'],
      ['RENEWAL_DUE', '/o/jlpt-n5-complete'],
    ]);
    expect((await list(bikash)).body.data).toEqual({ items: [], unread: 0 });
  });

  it('starts fresh reminders after a renewal moves the end date', async () => {
    const reminders = ctx.app.get(RenewalRemindersService);
    const now = new Date();
    await grant(aiko, new Date(now.getTime() + 6 * DAY));
    expect(await reminders.sweep(now)).toEqual({ notified: 1, emailed: 1 });
  });

  it('notifies the learner when a payment is approved or needs a fix', async () => {
    const bikashId = await userId(bikash);
    const payment = async (ref: string) =>
      (
        await ownerQuery<{ id: string }>(
          `INSERT INTO payments (tenant_id, user_id, course_id, provider, provider_payment_id, amount_minor, currency, status, plan_period, list_price_minor, submitted_at, bank_transaction_id)
           VALUES ($1, $2, $3, 'BANK_QR', $4, 500000, 'NPR', 'PENDING_REVIEW', 'MONTH_1', 500000, now(), $4) RETURNING id`,
          [SEED.sakura, bikashId, SEED.paidCourse, ref],
        )
      )[0]!.id;
    const approved = await payment('OXE-NOTIF1');
    const rejected = await payment('OXE-NOTIF2');
    expect((await ctx.http.post(`${base}/store/payments/${approved}/approve`).set(await auth(owner))).status).toBe(200);
    expect((await ctx.http.post(`${base}/store/payments/${rejected}/reject`).set(await auth(owner)).send({ reason: 'Amount does not match the statement' })).status).toBe(200);

    const items = (await list(bikash)).body.data.items as { kind: string; title: string; body: string; linkPath: string }[];
    expect(items.map((n) => n.kind)).toEqual(['PAYMENT_REJECTED', 'PAYMENT_APPROVED']);
    expect(items[0]).toMatchObject({ body: 'Reason from our team: Amount does not match the statement', linkPath: `/w/sakura/pay/bank/${rejected}` });
    expect(items[1]).toMatchObject({ title: 'Thank you for subscribing to JLPT N5 Complete Preparation', linkPath: `/w/sakura/courses/${SEED.paidCourse}` });
  });

  it('lets learners read and clear only their own notifications', async () => {
    const mine = (await list(aiko)).body.data;
    const first = mine.items[0].id as string;
    expect((await ctx.http.post(`${base}/me/notifications/${first}/read`).set(await auth(aiko))).status).toBe(204);
    expect((await list(aiko)).body.data.unread).toBe(mine.unread - 1);
    // Another learner's notification is not found, and nothing changes.
    expect((await ctx.http.post(`${base}/me/notifications/${first}/read`).set(await auth(bikash))).status).toBe(404);
    expect((await ctx.http.post(`${base}/me/notifications/read-all`).set(await auth(aiko))).status).toBe(204);
    expect((await list(aiko)).body.data.unread).toBe(0);
    expect((await list(bikash)).body.data.unread).toBeGreaterThan(0);
  });

  it('lets administrators send a notice to every member, in-app only', async () => {
    const before = mailer.sent.length;
    const notice = { title: 'Dashain holiday', body: 'Live classes pause from 10 to 14 October.', linkPath: '/o/jlpt-n5-complete' };
    expect((await ctx.http.post(`${base}/notices`).set(await auth(aiko)).send(notice)).status).toBe(403);
    expect((await ctx.http.post(`${base}/notices`).set(await auth(owner)).send({ ...notice, linkPath: '//evil.example' })).status).toBe(400);
    const sent = await ctx.http.post(`${base}/notices`).set(await auth(owner)).send(notice);
    expect(sent.status).toBe(201);
    expect(sent.body.data.recipients).toBe(3);
    for (const member of [aiko, bikash, instructor]) {
      expect((await list(member)).body.data.items[0]).toMatchObject({ kind: 'NOTICE', title: 'Dashain holiday' });
    }
    expect((await list(owner)).body.data.items).toEqual([]);
    expect(mailer.sent.length).toBe(before);
  });
});
