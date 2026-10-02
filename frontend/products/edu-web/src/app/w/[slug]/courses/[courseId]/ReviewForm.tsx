'use client';

import { useActionState, useState } from 'react';
import type { FormState } from '@/app/actions';
import { saveReview, withdrawReview } from '@/app/review-actions';
import type { MyReview } from '@/lib/edu-api.ts';
import { MY_REVIEW_STATUS } from '@/lib/reviews.ts';

/**
 * The learner's own rating and review (FR-CATALOG-304). Approve first: a new or changed review waits until
 * the store approves it, and the form says so.
 */
export function ReviewForm({ hidden, review }: { hidden: Record<string, string>; review: MyReview }) {
  const [rating, setRating] = useState(review.rating ?? 0);
  const [state, action, pending] = useActionState<FormState & { saved?: boolean }, FormData>(saveReview, {});
  const [withdrawState, withdraw, withdrawing] = useActionState<FormState, FormData>(withdrawReview, {});
  const fields = Object.entries(hidden).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />);

  return (
    <section aria-labelledby="review-heading" className="card grid gap-3">
      <h2 id="review-heading" className="text-2xl">
        {review.status ? 'Your review' : 'Rate this offering'}
      </h2>
      {review.status ? <p className={`notice ${review.status === 'HIDDEN' ? 'notice-error' : ''}`}>{MY_REVIEW_STATUS[review.status]}</p> : null}
      <form action={action} className="grid gap-3">
        {fields}
        <fieldset className="grid gap-1">
          <legend className="field-label">Your rating</legend>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value} className="cursor-pointer text-3xl leading-none" style={{ color: value <= rating ? 'var(--ox-color-warning)' : 'var(--ox-color-text-muted)' }}>
                <input type="radio" name="rating" value={value} className="sr-only" checked={rating === value} onChange={() => setRating(value)} required />
                <span aria-hidden="true">{value <= rating ? '★' : '☆'}</span>
                <span className="sr-only">
                  {value} {value === 1 ? 'star' : 'stars'}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="grid gap-1">
          <span className="field-label">What helped you? (optional)</span>
          <textarea name="body" className="field min-h-24" defaultValue={review.body} maxLength={2000} placeholder="For example: the kanji drills made reading much easier." />
        </label>
        <p className="text-sm text-muted">Your first name and the initial of your last name are shown with the review, never your email.</p>
        {state.error ? (
          <p role="alert" className="notice notice-error">
            {state.error}
          </p>
        ) : state.saved ? (
          <p role="status" className="notice">
            Thank you. Your review is waiting for approval.
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary justify-self-start" disabled={pending || rating === 0}>
          {pending ? 'Sending…' : review.status ? 'Send changes' : 'Send review'}
        </button>
      </form>
      {review.status ? (
        <form action={withdraw} className="flex flex-wrap items-center gap-2">
          {fields}
          <button type="submit" className="btn btn-secondary text-sm" disabled={withdrawing}>
            Withdraw my review
          </button>
          {withdrawState.error ? (
            <span role="alert" className="text-sm tone-danger">
              {withdrawState.error}
            </span>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
