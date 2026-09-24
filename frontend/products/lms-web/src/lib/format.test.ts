// Unit tests for Oxinov Edu helpers. Run: pnpm --filter @oxinov/lms-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { displayCode, formatDate, formatDuration, formatPrice, suggestSlug } from './format.ts';

describe('prices', () => {
  it('shows free courses as Free and converts minor units by currency', () => {
    assert.equal(formatPrice({ amountMinor: 0, currency: 'JPY' }), 'Free');
    assert.equal(formatPrice({ amountMinor: 1500, currency: 'JPY' }), '¥1,500');
    assert.equal(formatPrice({ amountMinor: 1999, currency: 'USD' }), '$19.99');
    assert.match(formatPrice({ amountMinor: 250000, currency: 'NPR' }), /2,500\.00/);
  });
});

describe('durations', () => {
  it('rounds to minutes and hours', () => {
    assert.equal(formatDuration(null), null);
    assert.equal(formatDuration(0), null);
    assert.equal(formatDuration(420), '7 min');
    assert.equal(formatDuration(3600), '1 h');
    assert.equal(formatDuration(5400), '1 h 30 min');
  });
});

describe('workspace addresses', () => {
  it('turns a school name into a valid address', () => {
    assert.equal(suggestSlug('Sakura Japanese School'), 'sakura-japanese-school');
    assert.equal(suggestSlug('  Everest -- Skills!! '), 'everest-skills');
    assert.match(suggestSlug('x'.repeat(80)), /^x{63}$/);
  });
});

describe('join codes', () => {
  it('splits eight-character codes for reading aloud', () => {
    assert.equal(displayCode('K7PX9QMD'), 'K7PX-9QMD');
    assert.equal(displayCode('SHORT'), 'SHORT');
  });
});

describe('dates', () => {
  it('uses the workspace time zone and survives an unknown one', () => {
    assert.equal(formatDate('2026-09-24T20:00:00Z', 'Asia/Kathmandu'), 'Sep 25, 2026');
    assert.equal(formatDate('2026-09-24T20:00:00Z', 'Not/AZone'), 'Sep 24, 2026');
  });
});
