// Unit tests for the reviews helpers. Run: pnpm --filter @oxinov/edu-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseReviewStatus, ratingLabel, reviewFromForm, starShares, stars } from './reviews.ts';

const form = (entries: Record<string, string>) => ({ get: (name: string) => entries[name] ?? null });

describe('reviews helpers (FR-CATALOG-304)', () => {
  it('draws stars and labels the rating', () => {
    assert.equal(stars(4), '★★★★☆');
    assert.equal(stars(4.6), '★★★★★');
    assert.equal(stars(4.5), '★★★★☆');
    assert.equal(stars(9), '★★★★★');
    assert.equal(stars(-1), '☆☆☆☆☆');
    assert.equal(ratingLabel(4.5, 12), '4.5 out of 5 from 12 reviews');
    assert.equal(ratingLabel(4, 1), '4.0 out of 5 from 1 review');
    assert.equal(ratingLabel(null, 0), 'No reviews yet');
  });

  it('turns star counts into bar percentages', () => {
    assert.deepEqual(starShares([3, 1, 0, 0, 0]), [75, 25, 0, 0, 0]);
    assert.deepEqual(starShares([0, 0, 0, 0, 0]), [0, 0, 0, 0, 0]);
  });

  it('reads the review form and refuses bad ratings', () => {
    assert.deepEqual(reviewFromForm(form({ rating: '5', body: '  Very clear.  ' })), { rating: 5, body: 'Very clear.' });
    assert.deepEqual(reviewFromForm(form({ rating: '3' })), { rating: 3, body: '' });
    assert.deepEqual(reviewFromForm(form({ rating: '0' })), { error: 'Choose 1 to 5 stars.' });
    assert.deepEqual(reviewFromForm(form({ rating: '4.5' })), { error: 'Choose 1 to 5 stars.' });
    assert.ok('error' in reviewFromForm(form({ rating: '4', body: 'x'.repeat(2001) })));
  });

  it('reads the moderation tab from the address', () => {
    assert.equal(parseReviewStatus('HIDDEN'), 'HIDDEN');
    assert.equal(parseReviewStatus('nope'), 'PENDING');
    assert.equal(parseReviewStatus(undefined), 'PENDING');
  });
});
