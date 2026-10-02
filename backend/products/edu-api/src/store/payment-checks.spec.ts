import { blockingCheck, paymentChecks, transactionKey, type PaymentCheckInput } from './payment-checks';

const base: PaymentCheckInput = {
  reference: 'OXE-7F3K2Q',
  amountMinor: 1_500_000,
  bankTransactionId: 'FT26100112345',
  paidAmountMinor: 1_500_000,
  referenceIncluded: true,
  hasReceipt: true,
  createdAt: new Date('2026-10-03T08:00:00Z'),
  submittedAt: new Date('2026-10-03T08:20:00Z'),
  sameTransaction: [],
  sameReceipt: [],
  coupon: null,
};

describe('payment match checks (FR-MGMT-1405)', () => {
  it('passes a clean payment without approving it', () => {
    const checks = paymentChecks(base);
    expect(checks.every((check) => check.level === 'ok')).toBe(true);
    expect(blockingCheck(checks)).toBeNull();
    expect(checks.map((check) => check.text)).toContain('Look for NPR 15,000 with remark OXE-7F3K2Q in the bank statement');
  });

  it('blocks approval when the transaction ID is on another payment', () => {
    const checks = paymentChecks({ ...base, sameTransaction: [{ reference: 'OXE-AAAA22', learner: 'Bikash T.', status: 'SUCCEEDED' }] });
    expect(blockingCheck(checks)?.text).toBe('Transaction ID FT26100112345 is also on payment OXE-AAAA22 (Bikash T., approved). Approval is blocked.');
  });

  it('warns about a different amount, a missing reference, a reused receipt, and an old reference', () => {
    const checks = paymentChecks({
      ...base,
      paidAmountMinor: 1_400_000,
      referenceIncluded: false,
      sameReceipt: [{ reference: 'OXE-BBBB33', learner: 'Sita G.', status: 'REJECTED' }],
      submittedAt: new Date('2026-10-07T08:00:00Z'),
    });
    const warnings = checks.filter((check) => check.level === 'warn').map((check) => check.text);
    expect(warnings).toEqual([
      'The learner says they paid NPR 14,000: NPR 1,000 less than the price of NPR 15,000',
      'The learner did not write OXE-7F3K2Q in the remarks; match by amount, time, and name instead',
      'The same receipt image was sent for payment OXE-BBBB33 (Sita G., rejected)',
      'The reference was made 4 days before the receipt was sent; check the date on the receipt',
    ]);
    expect(blockingCheck(checks)).toBeNull();
  });

  it('handles payments sent before the amount question existed', () => {
    const checks = paymentChecks({ ...base, paidAmountMinor: null, referenceIncluded: null, bankTransactionId: null, hasReceipt: false });
    expect(checks.filter((check) => check.level === 'warn')).toHaveLength(4);
    expect(blockingCheck(checks)).toBeNull();
  });

  it('treats transaction IDs typed with spaces, dashes, or lower case as the same', () => {
    expect(transactionKey('ft-2610 0112/345')).toBe('FT26100112345');
    expect(transactionKey('FT26100112345')).toBe(transactionKey(' ft 26100112345 '));
  });
});
