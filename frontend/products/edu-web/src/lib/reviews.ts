/**
 * Ratings and reviews helpers (FR-CATALOG-304; design screen 2, "Learner reviews"): star text, labels, and
 * reading the review form. Pure functions, unit-tested without the API.
 */
import type { ReviewStatus } from './edu-api.ts';

export const REVIEW_TABS: readonly { status: ReviewStatus; label: string }[] = [
  { status: 'PENDING', label: 'Waiting' },
  { status: 'APPROVED', label: 'Shown' },
  { status: 'HIDDEN', label: 'Hidden' },
];

/** What the learner sees about their own review. */
export const MY_REVIEW_STATUS: Record<ReviewStatus, string> = {
  PENDING: 'Waiting for approval. It shows on the offering page once the store approves it.',
  APPROVED: 'Shown on the offering page.',
  HIDDEN: 'Not shown. Edit it and send it again if you like.',
};

export function parseReviewStatus(value: string | string[] | undefined): ReviewStatus {
  const text = Array.isArray(value) ? value[0] : value;
  return REVIEW_TABS.find((tab) => tab.status === text)?.status ?? 'PENDING';
}

/** 4 → "★★★★☆". Ratings outside 1 to 5 are clamped; an exact half rounds down, so 4.5 never shows 5 stars. */
export function stars(rating: number): string {
  const full = Math.min(5, Math.max(0, Math.ceil(rating - 0.5)));
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

/** "4.5 out of 5 from 12 reviews", for screen readers and summaries. */
export function ratingLabel(average: number | null, count: number): string {
  if (average === null || count === 0) return 'No reviews yet';
  return `${average.toFixed(1)} out of 5 from ${count} ${count === 1 ? 'review' : 'reviews'}`;
}

/** Share of reviews at each star level, as whole percentages for the bars (5 stars first). */
export function starShares(counts: readonly number[]): number[] {
  const total = counts.reduce((sum, count) => sum + count, 0);
  return counts.map((count) => (total === 0 ? 0 : Math.round((count / total) * 100)));
}

/** Reads the review form: a rating from 1 to 5 and an optional text of up to 2000 characters. */
export function reviewFromForm(form: { get(name: string): unknown }): { rating: number; body: string } | { error: string } {
  const rating = Number(form.get('rating'));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: 'Choose 1 to 5 stars.' };
  const body = String(form.get('body') ?? '').trim();
  if (body.length > 2000) return { error: 'Keep the review under 2,000 characters.' };
  return { rating, body };
}
