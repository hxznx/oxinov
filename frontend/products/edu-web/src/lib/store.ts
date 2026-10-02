/**
 * Oxinov store types and pure helpers (ADR-028): access plans, bank QR payments, review, settings, and
 * coupons. Types mirror the Edu API DTOs in backend/products/edu-api/src/store/store.dto.ts.
 */
export type PlanPeriod = 'MONTH_1' | 'MONTH_6' | 'YEAR_1' | 'LIFETIME';
export const PLAN_PERIODS: readonly PlanPeriod[] = ['MONTH_1', 'MONTH_6', 'YEAR_1', 'LIFETIME'];
export const PLAN_LABELS: Record<PlanPeriod, string> = { MONTH_1: '1 month', MONTH_6: '6 months', YEAR_1: '1 year', LIFETIME: 'Lifetime' };
const PLAN_MONTHS: Record<PlanPeriod, number | null> = { MONTH_1: 1, MONTH_6: 6, YEAR_1: 12, LIFETIME: null };

export interface Plan {
  id: string;
  period: PlanPeriod;
  label: string;
  priceMinor: number;
  currency: string;
  active: boolean;
}

export interface BankDetails {
  available: boolean;
  reason?: string;
  qrUrl: string | null;
  accountName: string | null;
  accountNumber: string | null;
  bankName: string | null;
  reviewTimeText: string;
  helpContact: string | null;
  refundPolicy: string;
}

export type BankPaymentStatus = 'PENDING' | 'PENDING_REVIEW' | 'SUCCEEDED' | 'REJECTED' | 'FAILED';

export interface BankPayment {
  id: string;
  courseId: string;
  courseTitle: string;
  status: BankPaymentStatus;
  reference: string;
  planPeriod: PlanPeriod;
  planLabel: string;
  listPriceMinor: number;
  discountMinor: number;
  amountMinor: number;
  currency: string;
  couponCode: string | null;
  bankTransactionId: string | null;
  hasEvidence: boolean;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewReason: string | null;
  createdAt: string;
}

export interface CheckoutInfo {
  plans: Plan[];
  bank: BankDetails;
  owned: boolean;
  accessEndsAt: string | null;
  openPayment: BankPayment | null;
}

export interface BankCheckout {
  payment: BankPayment;
  bank: BankDetails;
}

export interface ReviewItem extends BankPayment {
  learnerName: string | null;
  learnerEmail: string | null;
  checks: { ok: boolean; text: string }[];
  evidenceUrl: string | null;
}

export interface StoreSettings extends BankDetails {
  referencePrefix: string;
  defaultMonth1Minor: number;
  defaultMonth6Minor: number;
  defaultYear1Minor: number;
  defaultLifetimeMinor: number;
  isSeller: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  percentOff: number | null;
  amountOffMinor: number | null;
  courseId: string | null;
  period: PlanPeriod | null;
  startsAt: string | null;
  endsAt: string | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
}

export interface UploadTicket {
  uploadId: string;
  uploadUrl: string;
  headers: Record<string, string>;
  expiresAt: string;
}

/** NPR amounts are stored in paisa; shown as whole rupees with thousands separators (NPR 15,000). */
export function formatNpr(minor: number): string {
  const rupees = minor / 100;
  return `NPR ${rupees.toLocaleString('en-US', { maximumFractionDigits: Number.isInteger(rupees) ? 0 : 2 })}`;
}

/** Rupees typed by a person to paisa; null when it is not a positive amount with at most two decimals. */
export function parseNpr(input: string): number | null {
  const cleaned = input.replace(/[,\s]/g, '').replace(/^NPR/i, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const minor = Math.round(Number(cleaned) * 100);
  return minor > 0 ? minor : null;
}

/** Cost per month, for comparing plans; null for lifetime. */
export function perMonthMinor(plan: Pick<Plan, 'period' | 'priceMinor'>): number | null {
  const months = PLAN_MONTHS[plan.period];
  return months === null ? null : Math.round(plan.priceMinor / months);
}

/** When access would end if bought now (or after current access ends, for a renewal). */
export function planEnd(period: PlanPeriod, from: Date): Date | null {
  const months = PLAN_MONTHS[period];
  if (months === null) return null;
  const end = new Date(from);
  const day = end.getUTCDate();
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(day, lastDay));
  return end;
}

/** How a bank payment's state is explained to the learner. */
export function paymentHeadline(status: BankPaymentStatus): { title: string; tone: 'info' | 'success' | 'error' } {
  switch (status) {
    case 'PENDING':
      return { title: 'Scan, pay, and send us the receipt', tone: 'info' };
    case 'PENDING_REVIEW':
      return { title: 'We received your payment details', tone: 'info' };
    case 'SUCCEEDED':
      return { title: 'Payment approved. Your course is unlocked', tone: 'success' };
    case 'REJECTED':
      return { title: 'Your payment needs a quick fix', tone: 'error' };
    default:
      return { title: 'This checkout was replaced or closed', tone: 'error' };
  }
}

export const EVIDENCE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
export const EVIDENCE_MAX_BYTES = 5 * 1024 * 1024;
export const QR_TYPES = ['image/png', 'image/jpeg'] as const;
export const QR_MAX_BYTES = 2 * 1024 * 1024;

/** Why a chosen file cannot be uploaded, or null when it can. */
export function fileProblem(file: { type: string; size: number }, types: readonly string[], maxBytes: number, what: string): string | null {
  if (!types.includes(file.type)) return `Choose a ${what}.`;
  if (file.size === 0) return 'That file is empty.';
  if (file.size > maxBytes) return `The file is larger than ${maxBytes / (1024 * 1024)} MB.`;
  return null;
}

/**
 * A WhatsApp chat link from the store's help contact (design screen 15), when it names WhatsApp or is just a
 * phone number; null for anything else, such as an email address or a Viber-only note.
 */
export function whatsappLink(helpContact: string | null | undefined, message?: string): string | null {
  if (!helpContact) return null;
  const text = helpContact.trim();
  const mentions = /whats\s*app/i.test(text);
  const onlyPhone = /^\+?[\d\s()-]{8,20}$/.test(text);
  if (!mentions && !onlyPhone) return null;
  const digits = (text.match(/\+?\d[\d\s()-]{6,}\d/)?.[0] ?? '').replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return null;
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}
