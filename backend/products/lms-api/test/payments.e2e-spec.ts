/**
 * Paid-course checkout with Khalti and eSewa against real PostgreSQL (FR-CATALOG-303, FR-PAY-2701/2702,
 * ADR-023). The providers are fakes whose answers each test sets; the real adapters are unit-tested in
 * src/payments/providers.spec.ts.
 */
import type {
  CheckoutRequest,
  CheckoutStart,
  PaymentProvider,
  ProviderName,
  VerifyRequest,
  VerifyResult,
} from '../src/payments/providers';
import { SEED, assertValidSecurityEvent, createTestContext, ownerQuery, resetDatabase, type TestContext } from './helpers';

class FakeProvider implements PaymentProvider {
  /** What the provider says when asked about a payment, by our payment ID; PENDING by default. */
  readonly answers = new Map<string, VerifyResult>();
  readonly started: CheckoutRequest[] = [];
  lookups = 0;

  constructor(readonly name: ProviderName) {}

  start(request: CheckoutRequest): Promise<CheckoutStart> {
    this.started.push(request);
    return Promise.resolve(
      this.name === 'KHALTI'
        ? { providerPaymentId: `pidx-${request.paymentId}`, redirect: { method: 'GET', url: `https://pay.khalti.test/${request.paymentId}` } }
        : { providerPaymentId: request.paymentId, redirect: { method: 'POST', url: 'https://esewa.test/form', fields: { transaction_uuid: request.paymentId } } },
    );
  }

  verify(request: VerifyRequest): Promise<VerifyResult> {
    this.lookups += 1;
    return Promise.resolve(this.answers.get(request.paymentId) ?? { status: 'PENDING', detail: 'fake pending' });
  }
}

describe('paid-course checkout', () => {
  let ctx: TestContext;
  const khalti = new FakeProvider('KHALTI');
  const esewa = new FakeProvider('ESEWA');
  const bearer = async (subject: string) => ({ Authorization: `Bearer ${await ctx.devToken(subject)}` });
  const base = `/v1/tenants/${SEED.sakura}`;
  const price = 150000; // NPR 1,500 in paisa

  beforeAll(async () => {
    await resetDatabase();
    await ownerQuery(`UPDATE courses SET price_minor = $1, currency = 'NPR' WHERE id = $2`, [price, SEED.paidCourse]);
    ctx = await createTestContext({ paymentProviders: new Map<ProviderName, PaymentProvider>([['KHALTI', khalti], ['ESEWA', esewa]]) });
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  const checkout = async (subject: string, provider: ProviderName, courseId: string = SEED.paidCourse) =>
    ctx.http.post(`${base}/courses/${courseId}/checkout`).set(await bearer(subject)).send({ provider });
  const verify = async (subject: string, paymentId: string) =>
    ctx.http.post(`${base}/payments/${paymentId}/verify`).set(await bearer(subject));
  const paidLesson = async (subject: string) =>
    ctx.http.get(`${base}/courses/${SEED.paidCourse}/lessons/${SEED.paidLesson}`).set(await bearer(subject));
  const entitlements = async (paymentId: string) =>
    ownerQuery<{ n: string }>(`SELECT count(*)::text AS n FROM entitlements WHERE payment_id = $1`, [paymentId]);

  it('offers both providers for a paid NPR course, and nothing for free or other-currency courses', async () => {
    const options = await ctx.http.get(`${base}/courses/${SEED.paidCourse}/checkout`).set(await bearer(SEED.users.aiko));
    expect(options.status).toBe(200);
    expect(options.body.data).toMatchObject({ available: true, amountMinor: price, currency: 'NPR', owned: false, mode: 'sandbox' });
    expect(options.body.data.providers.sort()).toEqual(['ESEWA', 'KHALTI']);

    const free = await ctx.http.get(`${base}/courses/${SEED.freeCourse}/checkout`).set(await bearer(SEED.users.aiko));
    expect(free.body.data).toMatchObject({ available: false, providers: [] });
    expect((await checkout(SEED.users.aiko, 'KHALTI', SEED.freeCourse)).body.error.code).toBe('NOT_FOR_SALE');
  });

  it('does not sell courses from schools that are not approved sellers', async () => {
    await ownerQuery(`UPDATE courses SET price_minor = 50000 WHERE id = $1`, [SEED.everestCourse]);
    const headers = await bearer(SEED.users.everestOwner);
    const options = await ctx.http.get(`/v1/tenants/${SEED.everest}/courses/${SEED.everestCourse}/checkout`).set(headers);
    expect(options.body.data).toMatchObject({ available: false, reason: expect.stringMatching(/not on sale/) });
    const refused = await ctx.http.post(`/v1/tenants/${SEED.everest}/courses/${SEED.everestCourse}/checkout`).set(headers).send({ provider: 'ESEWA' });
    expect(refused.status).toBe(409);
    expect(refused.body.error.code).toBe('NOT_FOR_SALE');
  });

  it('grants access only after the provider confirms the payment, exactly once', async () => {
    const started = await checkout(SEED.users.aiko, 'KHALTI');
    expect(started.status).toBe(201);
    const { paymentId, redirect } = started.body.data;
    expect(redirect).toEqual({ method: 'GET', url: `https://pay.khalti.test/${paymentId}` });
    // The provider is told to send the learner back to this school's return page for this payment.
    expect(khalti.started.at(-1)).toMatchObject({
      amountMinor: price,
      returnUrl: `https://edu.test.oxinov.example/w/sakura/pay/${paymentId}/khalti`,
    });

    // Coming back from the provider is not proof: still pending, still locked.
    let status = await verify(SEED.users.aiko, paymentId);
    expect(status.status).toBe(200);
    expect(status.body.data.status).toBe('PENDING');
    expect((await paidLesson(SEED.users.aiko)).body.error.code).toBe('NOT_ENTITLED');

    khalti.answers.set(paymentId, { status: 'COMPLETED', amountMinor: price, transactionId: 'khalti-tx-1' });
    status = await verify(SEED.users.aiko, paymentId);
    expect(status.body.data).toMatchObject({ status: 'SUCCEEDED', transactionId: 'khalti-tx-1', amountMinor: price });
    expect((await paidLesson(SEED.users.aiko)).status).toBe(200);

    // Checking again, even concurrently, changes nothing and never asks the provider again.
    const lookups = khalti.lookups;
    const again = await Promise.all([verify(SEED.users.aiko, paymentId), verify(SEED.users.aiko, paymentId)]);
    expect(again.map((r) => (r.body as { data: { status: string } }).data.status)).toEqual(['SUCCEEDED', 'SUCCEEDED']);
    expect(khalti.lookups).toBe(lookups);
    expect((await entitlements(paymentId))[0]?.n).toBe('1');

    const options = await ctx.http.get(`${base}/courses/${SEED.paidCourse}/checkout`).set(await bearer(SEED.users.aiko));
    expect(options.body.data).toMatchObject({ owned: true, available: false });
    expect((await checkout(SEED.users.aiko, 'ESEWA')).status).toBe(409);

    const audit = await ownerQuery<{ action: string }>(`SELECT action FROM audit_events WHERE target_id = $1 ORDER BY created_at`, [paymentId]);
    expect(audit.map((row) => row.action)).toEqual(['payment.checkout_started', 'payment.succeeded']);
  });

  it('keeps payments private to the learner who made them', async () => {
    const started = await checkout(SEED.users.bikash, 'ESEWA');
    expect(started.status).toBe(201);
    expect(started.body.data.redirect).toMatchObject({ method: 'POST', fields: { transaction_uuid: started.body.data.paymentId } });
    const other = await verify(SEED.users.aiko, started.body.data.paymentId);
    expect(other.status).toBe(404);
    const mine = await ctx.http.get(`${base}/me/payments?courseId=${SEED.paidCourse}`).set(await bearer(SEED.users.bikash));
    expect(mine.body.data.map((p: { id: string }) => p.id)).toEqual([started.body.data.paymentId]);
  });

  it('never grants on a different amount, a cancelled payment, or a reused provider transaction', async () => {
    const wrongAmount = (await checkout(SEED.users.bikash, 'ESEWA')).body.data.paymentId;
    esewa.answers.set(wrongAmount, { status: 'COMPLETED', amountMinor: 100, transactionId: 'esewa-ref-1' });
    expect((await verify(SEED.users.bikash, wrongAmount)).body.data.status).toBe('FAILED');
    expect(ctx.securityEvents.some((e) => e.event.action === 'payment.amount_mismatch')).toBe(true);

    const cancelled = (await checkout(SEED.users.bikash, 'KHALTI')).body.data.paymentId;
    khalti.answers.set(cancelled, { status: 'FAILED', detail: 'Khalti status User canceled' });
    expect((await verify(SEED.users.bikash, cancelled)).body.data.status).toBe('FAILED');

    // Aiko's Khalti transaction presented again for Bikash's payment.
    const replay = (await checkout(SEED.users.bikash, 'KHALTI')).body.data.paymentId;
    khalti.answers.set(replay, { status: 'COMPLETED', amountMinor: price, transactionId: 'khalti-tx-1' });
    expect((await verify(SEED.users.bikash, replay)).body.data.status).toBe('FAILED');
    expect(ctx.securityEvents.some((e) => e.event.action === 'payment.transaction_reused')).toBe(true);

    expect((await paidLesson(SEED.users.bikash)).body.error.code).toBe('NOT_ENTITLED');
    for (const id of [wrongAmount, cancelled, replay]) expect((await entitlements(id))[0]?.n).toBe('0');
    for (const event of ctx.securityEvents.filter((e) => e.event.action.startsWith('payment.'))) assertValidSecurityEvent(event);
  });

  it('rejects unknown providers and malformed IDs', async () => {
    const bad = await ctx.http.post(`${base}/courses/${SEED.paidCourse}/checkout`).set(await bearer(SEED.users.bikash)).send({ provider: 'STRIPE' });
    expect(bad.status).toBe(400);
    expect((await ctx.http.post(`${base}/payments/not-a-uuid/verify`).set(await bearer(SEED.users.bikash))).status).toBe(400);
  });
});
