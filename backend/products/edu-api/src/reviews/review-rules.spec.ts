import { reviewerName, summarizeRatings } from './review-rules';

describe('review rules (FR-CATALOG-304)', () => {
  it('averages approved ratings to one decimal place and counts each star level', () => {
    expect(summarizeRatings([5, 4, 4, 3])).toEqual({ average: 4, count: 4, stars: [1, 2, 1, 0, 0] });
    expect(summarizeRatings([5, 4])).toEqual({ average: 4.5, count: 2, stars: [1, 1, 0, 0, 0] });
    expect(summarizeRatings([5, 5, 4])).toMatchObject({ average: 4.7 });
    expect(summarizeRatings([])).toEqual({ average: null, count: 0, stars: [0, 0, 0, 0, 0] });
    expect(summarizeRatings([0, 6, 2.5, 1])).toEqual({ average: 1, count: 1, stars: [0, 0, 0, 0, 1] });
  });

  it('shows a first name and last initial, never an email address', () => {
    expect(reviewerName('Aiko Rai')).toBe('Aiko R.');
    expect(reviewerName('Bikash Kumar Thapa')).toBe('Bikash T.');
    expect(reviewerName('Sita')).toBe('Sita');
    expect(reviewerName('  ')).toBe('Learner');
    expect(reviewerName(null)).toBe('Learner');
    expect(reviewerName('sita@example.com')).toBe('Learner');
  });
});
