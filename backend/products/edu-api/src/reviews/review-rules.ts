/**
 * Ratings and reviews (FR-CATALOG-304): the public name of a reviewer and the rating summary. Pure
 * functions, unit-tested. Only APPROVED reviews reach these (approve-first, the owner's choice).
 */

export interface RatingSummary {
  /** Average of the approved ratings to one decimal place; null when there are none. */
  average: number | null;
  count: number;
  /** How many approved reviews gave 5, 4, 3, 2, and 1 stars. */
  stars: [number, number, number, number, number];
}

export function summarizeRatings(ratings: readonly number[]): RatingSummary {
  const valid = ratings.filter((rating) => Number.isInteger(rating) && rating >= 1 && rating <= 5);
  const stars: RatingSummary['stars'] = [0, 0, 0, 0, 0];
  for (const rating of valid) stars[5 - rating] = (stars[5 - rating] ?? 0) + 1;
  const average = valid.length === 0 ? null : Math.round((valid.reduce((sum, rating) => sum + rating, 0) / valid.length) * 10) / 10;
  return { average, count: valid.length, stars };
}

/**
 * The name shown with a public review: the first name and the initial of the last name ("Aiko R."), never
 * the email address. Without a display name, or when the name looks like an email address, it is "Learner".
 */
export function reviewerName(displayName: string | null | undefined): string {
  if (!displayName || displayName.includes('@')) return 'Learner';
  const words = displayName.replace(/[<>]/g, ' ').trim().split(/\s+/).filter(Boolean);
  const [first, ...rest] = words;
  if (!first) return 'Learner';
  const last = rest.at(-1);
  return last ? `${first.slice(0, 40)} ${last[0]?.toUpperCase()}.` : first.slice(0, 40);
}
