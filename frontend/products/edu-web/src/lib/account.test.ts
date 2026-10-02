// Unit tests for the account centre helpers. Run: pnpm --filter @oxinov/edu-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { activityTimeline, initials, shareLinks, subscriptionStatus } from './account.ts';
import type { Certificate, Subscription } from './edu-api.ts';
import type { BankPayment } from './store.ts';

const now = new Date('2026-10-02T00:00:00Z');
const sub = (overrides: Partial<Subscription>): Subscription => ({
  courseId: 'c1',
  courseTitle: 'Japanese N5',
  courseSlug: 'japanese-n5',
  kind: 'COURSE',
  state: 'ACTIVE',
  source: 'PURCHASE',
  planLabel: '1 year',
  paidMinor: 1_500_000,
  since: '2026-09-01T00:00:00.000Z',
  endsAt: '2027-09-01T00:00:00.000Z',
  ...overrides,
});

describe('account centre helpers (FR-AUTH-104)', () => {
  it('reads each subscription state and when to offer renewal', () => {
    assert.deepEqual(subscriptionStatus(sub({}), now), { label: 'Active', tone: 'success', renew: false });
    assert.deepEqual(subscriptionStatus(sub({ endsAt: '2026-10-07T00:00:00.000Z' }), now), { label: 'Ends in 5 days', tone: 'warning', renew: true });
    assert.equal(subscriptionStatus(sub({ endsAt: '2026-10-02T20:00:00.000Z' }), now).label, 'Ends tomorrow');
    assert.deepEqual(subscriptionStatus(sub({ endsAt: null }), now), { label: 'Lifetime', tone: 'success', renew: false });
    assert.equal(subscriptionStatus(sub({ endsAt: null, source: 'FREE' }), now).label, 'Free');
    assert.deepEqual(subscriptionStatus(sub({ state: 'ENDED' }), now), { label: 'Ended', tone: 'muted', renew: true });
  });

  it('builds the activity timeline newest first from payments, access, and certificates', () => {
    const payment = (status: BankPayment['status'], at: string | null): BankPayment =>
      ({ status, submittedAt: at, reviewedAt: status === 'PENDING_REVIEW' ? null : at, courseTitle: 'Japanese N5', planLabel: '1 year', reference: 'OXE-AAAAA1' }) as BankPayment;
    const certificate = { issuedAt: '2026-09-30T00:00:00.000Z', courseTitle: 'Japanese N5' } as Certificate;
    const events = activityTimeline([sub({})], [payment('SUCCEEDED', '2026-09-01T01:00:00.000Z'), payment('PENDING', null), payment('REJECTED', '2026-08-31T00:00:00.000Z')], [certificate]);
    assert.deepEqual(
      events.map((event) => event.title),
      ['Certificate earned', 'Payment approved', 'Access started', 'Payment needs a fix'],
    );
  });

  it('makes share links that carry the address safely', () => {
    const links = shareLinks('https://edu.oxinov.com/o/japanese-n5?a=1&b=2', 'Learn Japanese with me');
    assert.deepEqual(
      links.map((link) => link.name),
      ['WhatsApp', 'Facebook', 'Viber', 'Telegram', 'Email'],
    );
    assert.equal(links[1]!.href, 'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fedu.oxinov.com%2Fo%2Fjapanese-n5%3Fa%3D1%26b%3D2');
    assert.ok(links[0]!.href.startsWith('https://wa.me/?text=Learn%20Japanese%20with%20me%20https%3A%2F%2F'));
  });

  it('makes two-letter profile marks', () => {
    assert.equal(initials('Bikash Gurung', null), 'BG');
    assert.equal(initials(null, 'hello.nepal017@gmail.com'), 'HN');
    assert.equal(initials('Aiko', null), 'AI');
    assert.equal(initials(null, null), 'OX');
  });
});
