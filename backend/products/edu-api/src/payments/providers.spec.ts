import { loadPaymentsConfig } from '../config/app-config';
import { esewaAmount, esewaResult, esewaSignature, esewaSignatureValid, EsewaProvider, khaltiResult } from './providers';

const TEST_KEY = '8gBm/:&EnhH.1/q'; // eSewa's published sandbox key for merchant EPAYTEST
const request = { paymentId: 'p1', providerPaymentId: 'p1', amountMinor: 10000, createdAt: new Date('2026-09-27T00:00:00Z') };

describe('eSewa', () => {
  it('signs total_amount, transaction_uuid and product_code in order (accepted by the eSewa sandbox)', () => {
    const fields = { total_amount: '100', transaction_uuid: '11-201-13', product_code: 'EPAYTEST' };
    expect(esewaSignature(TEST_KEY, fields, ['total_amount', 'transaction_uuid', 'product_code'])).toBe(
      '5DZywcrTKD0gia/rsSMcrRHmJl+4Tbol6S+lWgdJ94E=',
    );
    expect(esewaSignatureValid(TEST_KEY, fields, ['total_amount', 'transaction_uuid', 'product_code'], '5DZywcrTKD0gia/rsSMcrRHmJl+4Tbol6S+lWgdJ94E=')).toBe(true);
    expect(esewaSignatureValid(TEST_KEY, fields, ['total_amount', 'transaction_uuid', 'product_code'], 'x')).toBe(false);
  });

  it('writes rupee amounts the way it signs them', () => {
    expect(esewaAmount(10000)).toBe('100');
    expect(esewaAmount(10050)).toBe('100.50');
    expect(esewaAmount(5)).toBe('0.05');
  });

  it('builds a signed form that posts to the configured eSewa URL', async () => {
    const provider = new EsewaProvider({ productCode: 'EPAYTEST', secretKey: TEST_KEY, formUrl: 'https://rc-epay.esewa.com.np/form', statusUrl: 'x' });
    const { providerPaymentId, redirect } = await provider.start({
      paymentId: '0b7c7d8e-1111-4000-8000-000000000001',
      amountMinor: 150000,
      courseTitle: 'JLPT N5',
      returnUrl: 'https://edu.example/ok',
      failureUrl: 'https://edu.example/fail',
      websiteUrl: 'https://edu.example',
    });
    expect(providerPaymentId).toBe('0b7c7d8e-1111-4000-8000-000000000001');
    if (redirect.method !== 'POST') throw new Error('expected a form');
    expect(redirect.fields).toMatchObject({ amount: '1500', total_amount: '1500', product_code: 'EPAYTEST', tax_amount: '0' });
    expect(esewaSignatureValid(TEST_KEY, redirect.fields, ['total_amount', 'transaction_uuid', 'product_code'], redirect.fields.signature ?? '')).toBe(true);
  });

  it('grants only COMPLETE for the same transaction, with the amount from eSewa', () => {
    expect(esewaResult({ status: 'COMPLETE', transaction_uuid: 'p1', total_amount: 100.0, ref_id: '000AB1' }, request, Date.now())).toEqual({
      status: 'COMPLETED',
      amountMinor: 10000,
      transactionId: '000AB1',
    });
    expect(esewaResult({ status: 'COMPLETE', transaction_uuid: 'other', total_amount: 100, ref_id: 'r' }, request, Date.now()).status).toBe('PENDING');
    expect(esewaResult({ status: 'CANCELED' }, request, Date.now()).status).toBe('FAILED');
    expect(esewaResult({ status: 'AMBIGUOUS' }, request, Date.now()).status).toBe('PENDING');
  });

  it('treats NOT_FOUND as pending at first and as abandoned after an hour', () => {
    const created = request.createdAt.getTime();
    expect(esewaResult({ status: 'NOT_FOUND' }, request, created + 5 * 60_000).status).toBe('PENDING');
    expect(esewaResult({ status: 'NOT_FOUND' }, request, created + 2 * 3_600_000).status).toBe('FAILED');
  });
});

describe('Khalti', () => {
  it('grants only Completed, with the amount and transaction from the lookup', () => {
    expect(khaltiResult({ status: 'Completed', total_amount: 150000, transaction_id: 'GFq9PFS7b2iYvL8Lir9oXe' })).toEqual({
      status: 'COMPLETED',
      amountMinor: 150000,
      transactionId: 'GFq9PFS7b2iYvL8Lir9oXe',
    });
    expect(khaltiResult({ status: 'Completed' }).status).toBe('PENDING');
    for (const state of ['Pending', 'Initiated', 'Something new']) expect(khaltiResult({ status: state }).status).toBe('PENDING');
    for (const state of ['Expired', 'User canceled', 'Refunded', 'Partially Refunded']) expect(khaltiResult({ status: state }).status).toBe('FAILED');
  });
});

describe('payments configuration', () => {
  const tenant = 'aaaaaaaa-0000-4000-8000-000000000001';

  it('enables a provider only when its keys are set', () => {
    const none = loadPaymentsConfig({}, 'local');
    expect(none.mode).toBe('sandbox');
    expect(none.khalti).toBeUndefined();
    expect(none.esewa).toBeUndefined();
    const config = loadPaymentsConfig(
      { KHALTI_SECRET_KEY: 'k', ESEWA_PRODUCT_CODE: 'EPAYTEST', ESEWA_SECRET_KEY: TEST_KEY, PAYMENTS_SELLER_TENANT_IDS: ` ${tenant.toUpperCase()} ` },
      'local',
    );
    expect(config.khalti?.apiUrl).toBe('https://dev.khalti.com/api/v2');
    expect(config.esewa?.formUrl).toBe('https://rc-epay.esewa.com.np/api/epay/main/v2/form');
    expect(config.sellerTenantIds.has(tenant)).toBe(true);
  });

  it('uses the live systems only when asked, and never with the eSewa test merchant', () => {
    expect(loadPaymentsConfig({ PAYMENTS_MODE: 'live', KHALTI_SECRET_KEY: 'k', EDU_WEB_URL: 'https://edu.oxinov.com' }, 'production').khalti?.apiUrl).toBe(
      'https://khalti.com/api/v2',
    );
    expect(() => loadPaymentsConfig({ PAYMENTS_MODE: 'live', ESEWA_PRODUCT_CODE: 'EPAYTEST', ESEWA_SECRET_KEY: 'x' }, 'local')).toThrow(/test merchant/);
  });

  it('rejects incomplete or unsafe settings', () => {
    expect(() => loadPaymentsConfig({ ESEWA_PRODUCT_CODE: 'X' }, 'local')).toThrow(/both/);
    expect(() => loadPaymentsConfig({ PAYMENTS_SELLER_TENANT_IDS: 'oxinov' }, 'local')).toThrow(/UUIDs/);
    expect(() => loadPaymentsConfig({ PAYMENTS_MODE: 'real' }, 'local')).toThrow(/sandbox or live/);
    expect(() => loadPaymentsConfig({ EDU_WEB_URL: 'http://edu.oxinov.com' }, 'production')).toThrow(/https/);
  });
});
