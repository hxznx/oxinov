// Unit tests for the Oxinov Studio helpers. Run: pnpm --filter @oxinov/edu-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { StoreSettings } from './store.ts';
import { formatNpr } from './store.ts';
import { approvedTotal, saleState, studioTodo, type OfferingRow } from './studio.ts';

const ready: StoreSettings = {
  available: true,
  qrUrl: 'https://example.test/qr.png',
  accountName: 'Ox Inov Pvt. Ltd.',
  accountNumber: '0123456789',
  bankName: 'Example Bank',
  reviewTimeText: 'Within 2 hours',
  helpContact: 'WhatsApp +977 0000000000',
  refundPolicy: 'Change to another course within 3 days.',
  referencePrefix: 'OXE-',
  defaultMonth1Minor: 500_000,
  defaultMonth6Minor: 1_000_000,
  defaultYear1Minor: 1_500_000,
  defaultLifetimeMinor: 2_000_000,
  isSeller: true,
};

const offering = (overrides: Partial<OfferingRow>): OfferingRow => ({
  courseId: 'c1',
  title: 'Japanese JLPT N5',
  published: true,
  draftStatus: null,
  hasPlans: true,
  fromMinor: 500_000,
  kind: 'COURSE',
  category: 'LANGUAGES',
  ...overrides,
});

describe('studio helpers (ADR-028)', () => {
  it('has nothing to do when the store is ready', () => {
    assert.deepEqual(studioTodo({ base: '/w/x/studio', settings: ready, waiting: 0, offerings: [offering({})] }), []);
  });

  it('lists waiting payments first, then what keeps checkout closed', () => {
    const items = studioTodo({
      base: '/w/x/studio',
      settings: { ...ready, qrUrl: null, refundPolicy: '  ', helpContact: null },
      waiting: 2,
      offerings: [offering({ hasPlans: false }), offering({ courseId: 'c2', published: false, hasPlans: false })],
    });
    assert.deepEqual(
      items.map((item) => item.key),
      ['waiting', 'qr', 'refund', 'help', 'plans'],
    );
    assert.equal(items[0]?.title, '2 payments waiting for review');
    assert.equal(items[0]?.href, '/w/x/studio/payments');
    assert.equal(items.at(-1)?.title, '1 published offering has no plans');
  });

  it('warns when the workspace is not the seller', () => {
    const items = studioTodo({ base: '/b', settings: { ...ready, isSeller: false }, waiting: 0, offerings: [] });
    assert.deepEqual(
      items.map((item) => item.key),
      ['seller'],
    );
  });

  it('describes each sale state', () => {
    assert.deepEqual(saleState(offering({}), formatNpr), { text: 'On sale from NPR 5,000', tone: 'success' });
    assert.deepEqual(saleState(offering({ hasPlans: false, fromMinor: 0 }), formatNpr), { text: 'Free, no plans', tone: 'warning' });
    assert.deepEqual(saleState(offering({ hasPlans: false, fromMinor: 99_900 }), formatNpr), { text: 'NPR 999, no plans', tone: 'warning' });
    assert.deepEqual(saleState(offering({ published: false, draftStatus: 'IN_REVIEW' }), formatNpr), { text: 'In review', tone: 'muted' });
    assert.deepEqual(saleState(offering({ published: false }), formatNpr), { text: 'Draft, not published', tone: 'muted' });
  });

  it('adds up approved payments', () => {
    assert.equal(approvedTotal([{ amountMinor: 1000 }, { amountMinor: 1_500_000 }]), 1_501_000);
    assert.equal(approvedTotal([]), 0);
  });
});
