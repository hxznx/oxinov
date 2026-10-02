/**
 * Oxinov's store against real PostgreSQL and an S3-compatible server (ADR-028): access plans, bank QR
 * checkout with a reference, receipt upload, administrator review, coupons, renewal, and payment emails
 * (FR-CATALOG-305, FR-CATALOG-307, FR-CATALOG-317, FR-MGMT-1403, FR-MGMT-1408, FR-COMM-703).
 */
import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import type { Mailer, OutgoingMail } from '../src/notifications/mailer';
import { SEED, createTestContext, ownerQuery, resetDatabase, type TestContext } from './helpers';

const enabled = Boolean(process.env.TEST_MEDIA_S3_ENDPOINT);
const suite = enabled ? describe : describe.skip;

class CapturingMailer implements Mailer {
  readonly sent: OutgoingMail[] = [];
  fail = false;
  send(mail: OutgoingMail): Promise<void> {
    if (this.fail) return Promise.reject(new Error('relay down'));
    this.sent.push(mail);
    return Promise.resolve();
  }
}

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(200)]);
const HTML = Buffer.from('<html><script>alert(1)</script></html>');
const DAY = 24 * 60 * 60 * 1000;

suite('Oxinov store: plans, bank QR payments, review, coupons', () => {
  let ctx: TestContext;
  const mailer = new CapturingMailer();
  const base = `/v1/tenants/${SEED.sakura}`;
  const { sakuraOwner: owner, instructor, aiko, bikash } = SEED.users;
  const auth = async (subject: string) => ({ Authorization: `Bearer ${await ctx.devToken(subject)}` });
  const api = async (subject: string, method: 'get' | 'post' | 'put' | 'patch', path: string, body?: object) => {
    const req = ctx.http[method](`${base}${path}`).set(await auth(subject));
    return body ? req.send(body) : req;
  };
  const paidLesson = async (subject: string) => api(subject, 'get', `/courses/${SEED.paidCourse}/lessons/${SEED.paidLesson}`);
  const start = async (subject: string, period: string, couponCode?: string) =>
    api(subject, 'post', `/courses/${SEED.paidCourse}/checkout/bank-qr`, { period, ...(couponCode ? { couponCode } : {}) });

  /** Uploads a receipt for a payment and submits it with a bank transaction ID. */
  const pay = async (subject: string, paymentId: string, txId: string, bytes: Buffer = PNG) => {
    const ticket = await api(subject, 'post', `/me/bank-payments/${paymentId}/evidence-upload`, { contentType: 'image/png', sizeBytes: bytes.length });
    expect(ticket.status).toBe(201);
    const put = await fetch(ticket.body.data.uploadUrl, { method: 'PUT', headers: ticket.body.data.headers, body: new Uint8Array(bytes) });
    expect(put.status).toBe(200);
    return api(subject, 'post', `/me/bank-payments/${paymentId}/submit`, { bankTransactionId: txId });
  };
  const entitlementsFor = (paymentId: string) =>
    ownerQuery<{ starts_at: Date; ends_at: Date | null }>(`SELECT starts_at, ends_at FROM entitlements WHERE payment_id = $1`, [paymentId]);

  beforeAll(async () => {
    await resetDatabase();
    const s3 = new S3Client({ region: 'ap-south-1', endpoint: process.env.MEDIA_S3_ENDPOINT, forcePathStyle: true });
    await s3.send(new CreateBucketCommand({ Bucket: process.env.MEDIA_BUCKET })).catch((error: Error) => {
      if (!['BucketAlreadyOwnedByYou', 'BucketAlreadyExists'].includes(error.name)) throw error;
    });
    ctx = await createTestContext({ mailer });
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('keeps checkout closed until the owner sets a QR and plans, and lets only the owner set them', async () => {
    let info = await api(aiko, 'get', `/courses/${SEED.paidCourse}/plans`);
    expect(info.status).toBe(200);
    expect(info.body.data.bank).toMatchObject({ available: false, reason: expect.stringMatching(/not set up yet/) });
    expect((await start(aiko, 'YEAR_1')).body.error.code).toBe('NOT_FOR_SALE');

    // Payment details and prices belong to the owner (FR-MGMT-1408).
    expect((await api(instructor, 'patch', '/store/settings', { accountName: 'Mallory' })).status).toBe(403);
    const plans = [
      { period: 'MONTH_1', priceMinor: 500_000, active: true },
      { period: 'MONTH_6', priceMinor: 1_000_000, active: false },
      { period: 'YEAR_1', priceMinor: 1_500_000, active: true },
      { period: 'LIFETIME', priceMinor: 2_000_000, active: true },
    ];
    expect((await api(instructor, 'put', `/courses/${SEED.paidCourse}/plans`, { plans })).status).toBe(403);
    const saved = await api(owner, 'put', `/courses/${SEED.paidCourse}/plans`, { plans });
    expect(saved.status).toBe(200);
    expect(saved.body.data.map((p: { period: string }) => p.period)).toEqual(['MONTH_1', 'MONTH_6', 'YEAR_1', 'LIFETIME']);

    // A QR that is not really an image is refused; a real PNG is accepted.
    const bad = await api(owner, 'post', '/store/settings/qr-upload', { contentType: 'image/png', sizeBytes: HTML.length });
    await fetch(bad.body.data.uploadUrl, { method: 'PUT', headers: bad.body.data.headers, body: new Uint8Array(HTML) });
    expect((await api(owner, 'post', '/store/settings/qr-complete', { uploadId: bad.body.data.uploadId, contentType: 'image/png' })).body.error.code).toBe('MEDIA_INVALID');
    const qr = await api(owner, 'post', '/store/settings/qr-upload', { contentType: 'image/png', sizeBytes: PNG.length });
    await fetch(qr.body.data.uploadUrl, { method: 'PUT', headers: qr.body.data.headers, body: new Uint8Array(PNG) });
    expect((await api(owner, 'post', '/store/settings/qr-complete', { uploadId: qr.body.data.uploadId, contentType: 'image/png' })).status).toBe(200);
    const settings = await api(owner, 'patch', '/store/settings', { accountName: 'Ox Inov Pvt. Ltd.', accountNumber: '0123 4567 89', reviewTimeText: 'Within 2 hours, 9 AM to 9 PM' });
    expect(settings.body.data).toMatchObject({ accountName: 'Ox Inov Pvt. Ltd.', isSeller: true });

    info = await api(aiko, 'get', `/courses/${SEED.paidCourse}/plans`);
    expect(info.body.data.bank).toMatchObject({ available: true, accountName: 'Ox Inov Pvt. Ltd.', reviewTimeText: 'Within 2 hours, 9 AM to 9 PM' });
    expect(info.body.data.bank.qrUrl).toEqual(expect.stringContaining('/store/qr-'));
    // Only active plans are on sale, shortest first.
    expect(info.body.data.plans.map((p: { period: string; label: string }) => p.label)).toEqual(['1 month', '1 year', 'Lifetime']);
    expect((await start(aiko, 'MONTH_6')).body.error.code).toBe('NOT_FOR_SALE');

    // A course sold through plans is never enrolled for free, even if its old one-time price is 0.
    await ownerQuery(`UPDATE courses SET price_minor = 0 WHERE id = $1`, [SEED.paidCourse]);
    expect((await api(aiko, 'post', `/courses/${SEED.paidCourse}/enrollments`)).body.error.code).toBe('PAYMENT_REQUIRED');
    // The catalogue shows the cheapest plan as a "from" price.
    const listed = await api(aiko, 'get', `/courses/${SEED.paidCourse}`);
    expect(listed.body.data).toMatchObject({ hasPlans: true, price: { amountMinor: 500_000, currency: 'NPR' } });
  });

  it('grants a year of access only after an administrator approves the submitted payment, exactly once', async () => {
    const started = await start(aiko, 'YEAR_1');
    expect(started.status).toBe(201);
    const payment = started.body.data.payment;
    expect(payment).toMatchObject({ status: 'PENDING', amountMinor: 1_500_000, planLabel: '1 year', discountMinor: 0 });
    expect(payment.reference).toMatch(/^OXE-[2-9A-HJKMNP-Z]{6}$/);

    // Nothing is granted before review: not by starting, not by submitting.
    expect((await paidLesson(aiko)).body.error.code).toBe('NOT_ENTITLED');
    expect((await api(aiko, 'post', `/me/bank-payments/${payment.id}/submit`, { bankTransactionId: 'FT261001' })).body.error.code).toBe('MEDIA_NOT_UPLOADED');
    const submitted = await pay(aiko, payment.id, ' ft26 1001 ');
    expect(submitted.status).toBe(200);
    expect(submitted.body.data).toMatchObject({ status: 'PENDING_REVIEW', bankTransactionId: 'FT261001', hasEvidence: true });
    expect((await paidLesson(aiko)).body.error.code).toBe('NOT_ENTITLED');

    // Learners and instructors cannot review; administrators see the queue, oldest first, with evidence.
    expect((await api(aiko, 'post', `/store/payments/${payment.id}/approve`)).status).toBe(403);
    expect((await api(instructor, 'get', '/store/payments')).status).toBe(403);
    const queue = await api(owner, 'get', '/store/payments');
    expect(queue.body.data.map((p: { id: string }) => p.id)).toEqual([payment.id]);
    expect(queue.body.data[0]).toMatchObject({ learnerEmail: 'aiko@learner.example', reference: payment.reference, evidenceUrl: null });
    const detail = await api(owner, 'get', `/store/payments/${payment.id}`);
    expect(detail.body.data.evidenceUrl).toEqual(expect.stringContaining('/evidence-'));

    const approved = await api(owner, 'post', `/store/payments/${payment.id}/approve`);
    expect(approved.status).toBe(200);
    expect(approved.body.data.status).toBe('SUCCEEDED');
    expect((await paidLesson(aiko)).status).toBe(200);
    const [granted] = await entitlementsFor(payment.id);
    expect(granted!.ends_at!.getTime() - granted!.starts_at.getTime()).toBeGreaterThan(364 * DAY);
    expect(granted!.ends_at!.getTime() - granted!.starts_at.getTime()).toBeLessThan(367 * DAY);

    // One thank-you email naming the course, plan, and reference.
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0]).toMatchObject({ to: 'aiko@learner.example', subject: expect.stringMatching(/^Thank you for subscribing to .+ \(1 year\)$/) });
    expect(mailer.sent[0]!.text).toContain(payment.reference);

    // Approving again, or concurrently, changes nothing and sends nothing.
    const again = await Promise.all([api(owner, 'post', `/store/payments/${payment.id}/approve`), api(owner, 'post', `/store/payments/${payment.id}/approve`)]);
    expect(again.map((r) => r.status)).toEqual([200, 200]);
    expect(await entitlementsFor(payment.id)).toHaveLength(1);
    expect(mailer.sent).toHaveLength(1);

    const audit = await ownerQuery<{ action: string }>(`SELECT action FROM audit_events WHERE target_id = $1 ORDER BY created_at`, [payment.id]);
    expect(audit.map((row) => row.action)).toEqual(['payment.checkout_started', 'payment.submitted_for_review', 'payment.approved']);
  });

  it('extends from the current end on early renewal, so no paid day is lost', async () => {
    const [current] = await ownerQuery<{ ends_at: Date }>(
      `SELECT max(ends_at) AS ends_at FROM entitlements e JOIN user_profiles u ON u.id = e.user_id WHERE u.auth_subject = $1`,
      [aiko],
    );
    const started = await start(aiko, 'MONTH_1');
    await pay(aiko, started.body.data.payment.id, 'FT261002');
    expect((await api(owner, 'post', `/store/payments/${started.body.data.payment.id}/approve`)).status).toBe(200);
    const [renewal] = await entitlementsFor(started.body.data.payment.id);
    expect(renewal!.starts_at.getTime()).toBe(current!.ends_at.getTime());
    expect(renewal!.ends_at!.getTime()).toBeGreaterThan(current!.ends_at.getTime() + 27 * DAY);
  });

  it('refuses a bank transaction ID that already paid for another payment', async () => {
    const started = await start(bikash, 'MONTH_1');
    const reused = await pay(bikash, started.body.data.payment.id, 'ft26 1001');
    expect(reused.status).toBe(409);
    expect(reused.body.error.message).toMatch(/already used/);
    expect(ctx.securityEvents.some((e) => e.event.action === 'payment.transaction_reused')).toBe(true);
    expect((await paidLesson(bikash)).body.error.code).toBe('NOT_ENTITLED');
  });

  it('refuses a receipt that is not really an image or PDF', async () => {
    const started = await start(bikash, 'MONTH_1');
    const forged = await pay(bikash, started.body.data.payment.id, 'FT261003', HTML);
    expect(forged.body.error.code).toBe('MEDIA_INVALID');
  });

  it('rejects with a reason the learner sees and emails, then accepts a corrected resubmission on the same payment', async () => {
    const before = mailer.sent.length;
    const started = await start(bikash, 'LIFETIME');
    const id = started.body.data.payment.id;
    await pay(bikash, id, 'FT261004');
    expect((await api(owner, 'post', `/store/payments/${id}/reject`, { reason: 'no' })).status).toBe(400);
    const rejected = await api(owner, 'post', `/store/payments/${id}/reject`, { reason: 'The screenshot shows NPR 2,000; the lifetime plan is NPR 20,000.' });
    expect(rejected.body.data).toMatchObject({ status: 'REJECTED', reviewReason: expect.stringMatching(/NPR 20,000/) });
    expect(mailer.sent).toHaveLength(before + 1);
    expect(mailer.sent.at(-1)).toMatchObject({ to: 'bikash@learner.example', subject: expect.stringMatching(/^We could not approve your payment/) });
    expect(mailer.sent.at(-1)!.text).toContain('Reason from our team: The screenshot shows NPR 2,000');
    expect(mailer.sent.at(-1)!.text).toContain(`/w/sakura/pay/bank/${id}`);

    const mine = await api(bikash, 'get', `/courses/${SEED.paidCourse}/plans`);
    expect(mine.body.data.openPayment).toMatchObject({ id, status: 'REJECTED' });

    const resubmitted = await pay(bikash, id, 'FT261005');
    expect(resubmitted.body.data).toMatchObject({ id, status: 'PENDING_REVIEW', reviewReason: null });
    // A second payment for the same course cannot start while one is being checked.
    expect((await start(bikash, 'MONTH_1')).status).toBe(409);
    expect((await api(owner, 'post', `/store/payments/${id}/approve`)).status).toBe(200);
    expect((await entitlementsFor(id))[0]!.ends_at).toBeNull();
    // Lifetime access needs no further plan.
    expect((await start(bikash, 'MONTH_1')).body.error.message).toMatch(/lifetime access/);
  });

  it('applies coupons at checkout, rechecks them at approval, and counts only approved uses', async () => {
    expect((await api(instructor, 'post', '/store/coupons', { code: 'TEAM10', percentOff: 10 })).status).toBe(403);
    const coupon = await api(owner, 'post', '/store/coupons', { code: 'dashain25', percentOff: 25, maxUses: 1 });
    expect(coupon.body.data).toMatchObject({ code: 'DASHAIN25', usedCount: 0 });
    expect((await api(owner, 'post', '/store/coupons', { code: 'DASHAIN25', percentOff: 5 })).status).toBe(409);
    expect((await api(owner, 'post', '/store/coupons', { code: 'BOTH', percentOff: 5, amountOffMinor: 1000 })).body.error.code).toBe('COUPON_INVALID');

    expect((await start(instructor, 'YEAR_1', 'NOPE')).body.error.code).toBe('COUPON_INVALID');
    const first = await start(instructor, 'YEAR_1', ' dashain25 ');
    expect(first.body.data.payment).toMatchObject({ listPriceMinor: 1_500_000, discountMinor: 375_000, amountMinor: 1_125_000, couponCode: 'DASHAIN25' });

    // Two learners hold the one-use coupon; only the first approval may use it.
    const second = await start(aiko, 'LIFETIME', 'DASHAIN25');
    await pay(instructor, first.body.data.payment.id, 'FT261006');
    await pay(aiko, second.body.data.payment.id, 'FT261007');
    expect((await api(owner, 'post', `/store/payments/${first.body.data.payment.id}/approve`)).status).toBe(200);
    const blocked = await api(owner, 'post', `/store/payments/${second.body.data.payment.id}/approve`);
    expect(blocked.body.error.code).toBe('COUPON_INVALID');
    expect(blocked.body.error.message).toMatch(/fully used/);
    const [used] = await ownerQuery<{ used_count: number }>(`SELECT used_count FROM coupons WHERE code = 'DASHAIN25'`);
    expect(used!.used_count).toBe(1);
    expect(await entitlementsFor(second.body.data.payment.id)).toHaveLength(0);
  });

  it('never fails an approval because email is down', async () => {
    mailer.fail = true;
    const started = await start(instructor, 'MONTH_1');
    await pay(instructor, started.body.data.payment.id, 'FT261008');
    const approved = await api(owner, 'post', `/store/payments/${started.body.data.payment.id}/approve`);
    mailer.fail = false;
    expect(approved.body.data.status).toBe('SUCCEEDED');
    expect(ctx.logs.some((line) => line.includes('mail.failed') && !line.includes('@'))).toBe(true);
  });

  it('keeps payments private to their learner and to the seller workspace', async () => {
    const [anyPayment] = await ownerQuery<{ id: string }>(`SELECT id FROM payments WHERE provider = 'BANK_QR' LIMIT 1`);
    // Another learner's payment is simply not found.
    const [aikoPayment] = await ownerQuery<{ id: string }>(
      `SELECT p.id FROM payments p JOIN user_profiles u ON u.id = p.user_id WHERE u.auth_subject = $1 AND provider = 'BANK_QR' LIMIT 1`,
      [aiko],
    );
    expect((await api(bikash, 'get', `/me/bank-payments/${aikoPayment!.id}`)).status).toBe(404);
    // Another school's owner cannot see this school's queue or payments.
    const other = await ctx.http.get(`${base}/store/payments/${anyPayment!.id}`).set(await auth(SEED.users.everestOwner));
    expect([403, 404]).toContain(other.status);
    // A school that is not an approved seller cannot sell.
    const everest = await ctx.http
      .get(`/v1/tenants/${SEED.everest}/courses/${SEED.everestCourse}/plans`)
      .set(await auth(SEED.users.everestOwner));
    expect(everest.body.data.bank).toMatchObject({ available: false, reason: expect.stringMatching(/not on sale/) });
  });

  it('checks each payment against the others and blocks approval of a reused transaction ID (FR-MGMT-1405)', async () => {
    type Check = { ok: boolean; level: string; text: string };
    const started = await start(owner, 'MONTH_1');
    expect(started.status).toBe(201);
    const id = started.body.data.payment.id as string;
    const ticket = await api(owner, 'post', `/me/bank-payments/${id}/evidence-upload`, { contentType: 'image/png', sizeBytes: PNG.length });
    await fetch(ticket.body.data.uploadUrl, { method: 'PUT', headers: ticket.body.data.headers, body: new Uint8Array(PNG) });
    // FT-26-1002 is the approved renewal FT261002 typed with dashes: the database cannot see it, the check does.
    expect((await api(owner, 'post', `/me/bank-payments/${id}/submit`, { bankTransactionId: 'FT261099', paidAmount: -5 })).status).toBe(400);
    const sent = await api(owner, 'post', `/me/bank-payments/${id}/submit`, { bankTransactionId: 'FT-26-1002', paidAmount: 4900, referenceIncluded: false });
    expect(sent.status).toBe(200);

    const detail = await api(owner, 'get', `/store/payments/${id}`);
    const checks = detail.body.data.checks as Check[];
    expect(checks.find((check) => check.level === 'block')?.text).toMatch(/^Transaction ID FT-26-1002 is also on payment OXE-[2-9A-HJKMNP-Z]{6} \(.+, approved\)/);
    expect(checks.filter((check) => check.level === 'warn').map((check) => check.text)).toEqual(
      expect.arrayContaining([
        'The learner says they paid NPR 4,900: NPR 100 less than the price of NPR 5,000',
        expect.stringMatching(/did not write OXE-.+ in the remarks/),
        expect.stringMatching(/^The same receipt image was sent for payment/),
      ]),
    );
    expect(checks.every((check) => check.ok === (check.level === 'ok'))).toBe(true);

    const refused = await api(owner, 'post', `/store/payments/${id}/approve`);
    expect(refused.status).toBe(409);
    expect(refused.body.error.message).toMatch(/Approval is blocked/);
    expect((await api(owner, 'get', `/store/payments/${id}`)).body.data.status).toBe('PENDING_REVIEW');
  });
});
