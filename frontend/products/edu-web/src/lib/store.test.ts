// Unit tests for the store helpers. Run: pnpm --filter @oxinov/edu-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EVIDENCE_MAX_BYTES, EVIDENCE_TYPES, fileProblem, formatNpr, parseNpr, paymentHeadline, perMonthMinor, planEnd } from './store.ts';

describe('store helpers (ADR-028)', () => {
  it('formats paisa as rupees', () => {
    assert.equal(formatNpr(1_500_000), 'NPR 15,000');
    assert.equal(formatNpr(112_550), 'NPR 1,125.5');
  });

  it('parses rupees typed by people into paisa', () => {
    assert.equal(parseNpr('15,000'), 1_500_000);
    assert.equal(parseNpr('NPR 5000.50'), 500_050);
    assert.equal(parseNpr('0'), null);
    assert.equal(parseNpr('12.345'), null);
    assert.equal(parseNpr('ten'), null);
  });

  it('compares plans by their monthly cost', () => {
    assert.equal(perMonthMinor({ period: 'YEAR_1', priceMinor: 1_500_000 }), 125_000);
    assert.equal(perMonthMinor({ period: 'MONTH_6', priceMinor: 1_000_000 }), 166_667);
    assert.equal(perMonthMinor({ period: 'LIFETIME', priceMinor: 2_000_000 }), null);
  });

  it('shows the plan end date, clamping to shorter months, and none for lifetime', () => {
    assert.equal(planEnd('MONTH_1', new Date('2026-01-31T00:00:00Z'))?.toISOString(), '2026-02-28T00:00:00.000Z');
    assert.equal(planEnd('YEAR_1', new Date('2026-10-01T06:00:00Z'))?.toISOString(), '2027-10-01T06:00:00.000Z');
    assert.equal(planEnd('LIFETIME', new Date()), null);
  });

  it('explains every payment state', () => {
    assert.match(paymentHeadline('PENDING_REVIEW').title ?? '', /received/);
    assert.equal(paymentHeadline('REJECTED').tone, 'error');
    assert.equal(paymentHeadline('SUCCEEDED').tone, 'success');
  });

  it('accepts only receipts the API accepts', () => {
    assert.equal(fileProblem({ type: 'image/png', size: 2000 }, EVIDENCE_TYPES, EVIDENCE_MAX_BYTES, 'JPG, PNG, or PDF'), null);
    assert.match(fileProblem({ type: 'image/gif', size: 2000 }, EVIDENCE_TYPES, EVIDENCE_MAX_BYTES, 'JPG, PNG, or PDF') ?? '', /Choose a JPG/);
    assert.match(fileProblem({ type: 'image/png', size: EVIDENCE_MAX_BYTES + 1 }, EVIDENCE_TYPES, EVIDENCE_MAX_BYTES, 'x') ?? '', /larger than 5 MB/);
  });
});
