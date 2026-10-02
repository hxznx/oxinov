/**
 * Payment match checks (FR-MGMT-1405): what the reviewer sees beside each bank QR payment. Checks help the
 * reviewer but never approve a payment on their own. Only a bank transaction ID already on another payment
 * blocks approval; everything else is a warning to look at the bank statement more closely. Pure functions.
 */

export type CheckLevel = 'ok' | 'warn' | 'block';

export interface PaymentCheck {
  level: CheckLevel;
  text: string;
}

/** Another payment that shares this payment's transaction ID or receipt image. */
export interface OtherPayment {
  reference: string;
  learner: string;
  status: string;
}

export interface PaymentCheckInput {
  reference: string;
  amountMinor: number;
  bankTransactionId: string | null;
  /** What the learner says they paid; null for payments sent before this question existed. */
  paidAmountMinor: number | null;
  /** Whether the learner says they wrote the reference in the bank remarks. */
  referenceIncluded: boolean | null;
  hasReceipt: boolean;
  createdAt: Date;
  submittedAt: Date | null;
  sameTransaction: OtherPayment[];
  sameReceipt: OtherPayment[];
  coupon: { code: string; discountMinor: number } | null;
}

/** A reference older than this when the receipt arrives is worth a second look at the receipt date. */
const STALE_DAYS = 3;
const DAY = 24 * 60 * 60 * 1000;

const STATUS_WORDS: Record<string, string> = { SUCCEEDED: 'approved', PENDING_REVIEW: 'waiting for review', REJECTED: 'rejected', PENDING: 'not sent yet' };
const npr = (minor: number) => `NPR ${(minor / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
const others = (list: OtherPayment[]) => list.map((item) => `${item.reference} (${item.learner}, ${STATUS_WORDS[item.status] ?? item.status.toLowerCase()})`).join(', ');

/**
 * Letters and digits only, upper case: "ft-2610 0112" and "FT26100112" are the same bank transaction. Used to
 * find a transaction ID typed differently on two payments.
 */
export function transactionKey(id: string): string {
  return id.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function paymentChecks(input: PaymentCheckInput): PaymentCheck[] {
  const checks: PaymentCheck[] = [];

  if (!input.bankTransactionId) checks.push({ level: 'warn', text: 'No bank transaction ID yet' });
  else if (input.sameTransaction.length > 0) {
    checks.push({ level: 'block', text: `Transaction ID ${input.bankTransactionId} is also on payment ${others(input.sameTransaction)}. Approval is blocked.` });
  } else checks.push({ level: 'ok', text: `Transaction ID ${input.bankTransactionId} is not on any other payment` });

  const price = npr(input.amountMinor);
  if (input.paidAmountMinor === null) checks.push({ level: 'warn', text: `The learner did not say how much they paid; the price is ${price}` });
  else if (input.paidAmountMinor === input.amountMinor) checks.push({ level: 'ok', text: `The learner says they paid ${price}, the exact price` });
  else {
    const gap = Math.abs(input.paidAmountMinor - input.amountMinor);
    const side = input.paidAmountMinor < input.amountMinor ? 'less' : 'more';
    checks.push({ level: 'warn', text: `The learner says they paid ${npr(input.paidAmountMinor)}: ${npr(gap)} ${side} than the price of ${price}` });
  }

  if (input.referenceIncluded === true) checks.push({ level: 'ok', text: `The learner wrote ${input.reference} in the bank remarks` });
  else if (input.referenceIncluded === false) {
    checks.push({ level: 'warn', text: `The learner did not write ${input.reference} in the remarks; match by amount, time, and name instead` });
  } else checks.push({ level: 'warn', text: `Not stated whether ${input.reference} was written in the remarks` });

  if (!input.hasReceipt) checks.push({ level: 'warn', text: 'No receipt attached' });
  else if (input.sameReceipt.length > 0) checks.push({ level: 'warn', text: `The same receipt image was sent for payment ${others(input.sameReceipt)}` });
  else checks.push({ level: 'ok', text: 'Receipt attached, not used on any other payment' });

  if (input.submittedAt) {
    const days = Math.floor((input.submittedAt.getTime() - input.createdAt.getTime()) / DAY);
    if (days >= STALE_DAYS) checks.push({ level: 'warn', text: `The reference was made ${days} days before the receipt was sent; check the date on the receipt` });
  }

  checks.push({ level: 'ok', text: `Look for ${price} with remark ${input.reference} in the bank statement` });
  if (input.coupon) checks.push({ level: 'ok', text: `Coupon ${input.coupon.code}: ${npr(input.coupon.discountMinor)} off` });
  return checks;
}

/** The first blocking check, if any: approval must not go ahead while it stands. */
export function blockingCheck(checks: readonly PaymentCheck[]): PaymentCheck | null {
  return checks.find((check) => check.level === 'block') ?? null;
}
