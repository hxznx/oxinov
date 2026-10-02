import { randomInt } from 'node:crypto';

/**
 * Pure rules for access plans, coupons, and bank QR references (ADR-028; FR-CATALOG-305, FR-CATALOG-307,
 * FR-CATALOG-317). Kept free of I/O so every money and time rule is unit-tested.
 */

export const PLAN_PERIODS = ['MONTH_1', 'MONTH_6', 'YEAR_1', 'LIFETIME'] as const;
export type PlanPeriod = (typeof PLAN_PERIODS)[number];

/** Months of access per plan; lifetime has no end. */
export const PLAN_MONTHS: Record<PlanPeriod, number | null> = { MONTH_1: 1, MONTH_6: 6, YEAR_1: 12, LIFETIME: null };

export const PLAN_LABELS: Record<PlanPeriod, string> = { MONTH_1: '1 month', MONTH_6: '6 months', YEAR_1: '1 year', LIFETIME: 'Lifetime' };

/** Adds calendar months in UTC, clamping to the last day of a shorter month (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(from: Date, months: number): Date {
  const year = from.getUTCFullYear();
  const month = from.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(from.getUTCDate(), lastDay);
  return new Date(Date.UTC(year, month, day, from.getUTCHours(), from.getUTCMinutes(), from.getUTCSeconds(), from.getUTCMilliseconds()));
}

/**
 * When a newly approved plan starts and ends. A renewal while access is still active starts at the
 * current end, so no paid day is lost; lifetime access already held makes any further plan lifetime too.
 *
 * @param currentEnd end of the learner's latest active access for the course: `undefined` when there is
 *   none, `null` when it is lifetime.
 */
export function accessWindow(period: PlanPeriod, now: Date, currentEnd: Date | null | undefined): { startsAt: Date; endsAt: Date | null } {
  if (currentEnd === null) return { startsAt: now, endsAt: null };
  const startsAt = currentEnd && currentEnd > now ? currentEnd : now;
  const months = PLAN_MONTHS[period];
  return { startsAt, endsAt: months === null ? null : addMonths(startsAt, months) };
}

export interface CouponRule {
  readonly code: string;
  readonly percentOff: number | null;
  readonly amountOffMinor: number | null;
  readonly courseId: string | null;
  readonly period: PlanPeriod | null;
  readonly startsAt: Date | null;
  readonly endsAt: Date | null;
  readonly maxUses: number | null;
  readonly usedCount: number;
  readonly active: boolean;
}

/** Why a coupon cannot be used for this course and plan now, or `null` when it can. */
export function couponProblem(coupon: CouponRule, courseId: string, period: PlanPeriod, now: Date): string | null {
  if (!coupon.active) return 'This coupon is no longer active.';
  if (coupon.startsAt && now < coupon.startsAt) return 'This coupon is not active yet.';
  if (coupon.endsAt && now >= coupon.endsAt) return 'This coupon has expired.';
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return 'This coupon has been fully used.';
  if (coupon.courseId && coupon.courseId !== courseId) return 'This coupon is for a different course.';
  if (coupon.period && coupon.period !== period) return `This coupon is only for the ${PLAN_LABELS[coupon.period]} plan.`;
  return null;
}

/**
 * Discount in minor units, never more than the price and never leaving less than NPR 1 to pay (a free
 * plan is an access grant, not a payment). A percentage that lands on a fraction of a paisa rounds the
 * discount up, in the learner's favour.
 */
export function discountFor(coupon: Pick<CouponRule, 'percentOff' | 'amountOffMinor'>, priceMinor: number): number {
  const raw = coupon.percentOff !== null ? Math.ceil((priceMinor * coupon.percentOff) / 100) : (coupon.amountOffMinor ?? 0);
  return Math.max(0, Math.min(raw, priceMinor - 100));
}

/** Normalises what a learner types: trims, upper-cases, drops inner spaces. */
export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}

/** Bank transaction IDs are compared without case or spaces, so the same receipt cannot be used twice. */
export function normalizeTransactionId(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}

// No 0/O or 1/I/L: references are read off a screen and typed into a bank app.
const REFERENCE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/** A short reference the learner writes in the bank remarks, for example `OXE-7F3K2Q`. */
export function newReference(prefix: string): string {
  let code = '';
  for (let i = 0; i < 6; i += 1) code += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  return `${prefix}${code}`;
}

/** Proof of payment the learner may upload: a screenshot or the bank's PDF receipt, up to 5 MB. */
export const EVIDENCE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
export const EVIDENCE_MAX_BYTES = 5 * 1024 * 1024;
/** The store's bank QR image. */
export const QR_TYPES = ['image/png', 'image/jpeg'] as const;
export const QR_MAX_BYTES = 2 * 1024 * 1024;

/** Checks the first bytes of an uploaded image or PDF against its declared type. */
export function looksLikeDocument(contentType: string, head: Uint8Array): boolean {
  switch (contentType) {
    case 'image/png':
      return head.length >= 8 && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
    case 'image/jpeg':
      return head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    case 'application/pdf':
      return head.length >= 5 && String.fromCharCode(...head.subarray(0, 5)) === '%PDF-';
    default:
      return false;
  }
}

/** Offering kinds and store categories (ADR-028 point 1); the database enums have the same values. */
export const OFFERING_KINDS = ['COURSE', 'TRAINING', 'IDEA', 'THINK_TANK', 'SKILL'] as const;
export type OfferingKind = (typeof OFFERING_KINDS)[number];
export const OFFERING_CATEGORIES = ['LANGUAGES', 'TECHNOLOGY', 'IDEAS_RESEARCH', 'OTHER'] as const;
export type OfferingCategory = (typeof OFFERING_CATEGORIES)[number];

/**
 * The price a store card shows: the cheapest active plan ("from"), or the course's single price when it
 * has no plans. `free` only when there are no plans and the single price is zero.
 */
export function storefrontPrice(plans: { priceMinor: number }[], priceMinor: number): { fromMinor: number; hasPlans: boolean; free: boolean } {
  if (plans.length > 0) return { fromMinor: Math.min(...plans.map((plan) => plan.priceMinor)), hasPlans: true, free: false };
  return { fromMinor: priceMinor, hasPlans: false, free: priceMinor === 0 };
}
