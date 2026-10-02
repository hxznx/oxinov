import {
  accessWindow,
  addMonths,
  couponProblem,
  discountFor,
  looksLikeDocument,
  newReference,
  normalizeCode,
  normalizeTransactionId,
  storefrontPrice,
  type CouponRule,
} from './store-rules';

const at = (iso: string) => new Date(iso);

describe('access plans (FR-CATALOG-305)', () => {
  it('adds calendar months and clamps to the end of shorter months', () => {
    expect(addMonths(at('2026-03-10T08:00:00Z'), 1).toISOString()).toBe('2026-04-10T08:00:00.000Z');
    expect(addMonths(at('2026-01-31T00:00:00Z'), 1).toISOString()).toBe('2026-02-28T00:00:00.000Z');
    expect(addMonths(at('2027-11-15T00:00:00Z'), 6).toISOString()).toBe('2028-05-15T00:00:00.000Z');
  });

  it('starts today when the learner has no access', () => {
    const now = at('2026-03-01T00:00:00Z');
    expect(accessWindow('MONTH_1', now, undefined)).toEqual({ startsAt: now, endsAt: at('2026-04-01T00:00:00Z') });
  });

  it('extends from the current end on early renewal, so no paid day is lost', () => {
    const now = at('2026-03-01T00:00:00Z');
    const window = accessWindow('MONTH_1', now, at('2026-03-10T00:00:00Z'));
    expect(window).toEqual({ startsAt: at('2026-03-10T00:00:00Z'), endsAt: at('2026-04-10T00:00:00Z') });
  });

  it('starts today when the earlier access already ended', () => {
    const now = at('2026-03-01T00:00:00Z');
    expect(accessWindow('YEAR_1', now, at('2026-02-01T00:00:00Z')).startsAt).toEqual(now);
  });

  it('never ends for lifetime, and stays lifetime once held', () => {
    const now = at('2026-03-01T00:00:00Z');
    expect(accessWindow('LIFETIME', now, undefined).endsAt).toBeNull();
    expect(accessWindow('MONTH_1', now, null)).toEqual({ startsAt: now, endsAt: null });
  });
});

describe('coupons (FR-CATALOG-317)', () => {
  const coupon = (over: Partial<CouponRule> = {}): CouponRule => ({
    code: 'DASHAIN25',
    percentOff: 25,
    amountOffMinor: null,
    courseId: null,
    period: null,
    startsAt: null,
    endsAt: null,
    maxUses: null,
    usedCount: 0,
    active: true,
    ...over,
  });
  const now = at('2026-10-01T00:00:00Z');

  it('accepts a valid coupon and computes percentage and fixed discounts', () => {
    expect(couponProblem(coupon(), 'c1', 'YEAR_1', now)).toBeNull();
    expect(discountFor(coupon(), 1_500_000)).toBe(375_000);
    expect(discountFor(coupon({ percentOff: null, amountOffMinor: 100_000 }), 1_500_000)).toBe(100_000);
  });

  it('never discounts below NPR 1 to pay', () => {
    expect(discountFor(coupon({ percentOff: 100 }), 500_000)).toBe(499_900);
    expect(discountFor(coupon({ percentOff: null, amountOffMinor: 9_999_999 }), 500_000)).toBe(499_900);
  });

  it('refuses inactive, early, expired, used-up, other-course, and other-plan coupons', () => {
    expect(couponProblem(coupon({ active: false }), 'c1', 'YEAR_1', now)).toMatch(/no longer active/);
    expect(couponProblem(coupon({ startsAt: at('2026-10-02T00:00:00Z') }), 'c1', 'YEAR_1', now)).toMatch(/not active yet/);
    expect(couponProblem(coupon({ endsAt: now }), 'c1', 'YEAR_1', now)).toMatch(/expired/);
    expect(couponProblem(coupon({ maxUses: 2, usedCount: 2 }), 'c1', 'YEAR_1', now)).toMatch(/fully used/);
    expect(couponProblem(coupon({ courseId: 'c2' }), 'c1', 'YEAR_1', now)).toMatch(/different course/);
    expect(couponProblem(coupon({ period: 'MONTH_1' }), 'c1', 'YEAR_1', now)).toMatch(/1 month plan/);
  });

  it('normalises codes and transaction IDs typed by people', () => {
    expect(normalizeCode('  dashain 25 ')).toBe('DASHAIN25');
    expect(normalizeTransactionId(' ft26 1234 abc ')).toBe('FT261234ABC');
  });
});

describe('references and uploads (FR-CATALOG-307)', () => {
  it('creates readable references without confusable characters', () => {
    for (let i = 0; i < 200; i += 1) expect(newReference('OXE-')).toMatch(/^OXE-[2-9A-HJKMNP-Z]{6}$/);
  });

  it('checks uploaded screenshots and PDFs by their first bytes', () => {
    expect(looksLikeDocument('image/png', Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
    expect(looksLikeDocument('image/jpeg', Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
    expect(looksLikeDocument('application/pdf', new TextEncoder().encode('%PDF-1.7'))).toBe(true);
    expect(looksLikeDocument('image/png', new TextEncoder().encode('<html>'))).toBe(false);
    expect(looksLikeDocument('text/html', new TextEncoder().encode('<html>'))).toBe(false);
  });
});

describe('store cards (ADR-028)', () => {
  it('shows the cheapest plan, the single price, or free', () => {
    expect(storefrontPrice([{ priceMinor: 1_500_000 }, { priceMinor: 500_000 }], 0)).toEqual({ fromMinor: 500_000, hasPlans: true, free: false });
    expect(storefrontPrice([], 99_900)).toEqual({ fromMinor: 99_900, hasPlans: false, free: false });
    expect(storefrontPrice([], 0)).toEqual({ fromMinor: 0, hasPlans: false, free: true });
  });
});
