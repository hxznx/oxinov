'use client';

import { useActionState } from 'react';
import type { FormState } from '@/app/actions';
import { moderateReview } from '@/app/review-actions';

/** Approve a waiting review, or hide it with a reason only administrators see (FR-CATALOG-304). */
export function ModerationForms({ slug, tenantId, reviewId, canApprove, canHide }: { slug: string; tenantId: string; reviewId: string; canApprove: boolean; canHide: boolean }) {
  const [approveState, approve, approving] = useActionState<FormState, FormData>(moderateReview, {});
  const [hideState, hide, hiding] = useActionState<FormState, FormData>(moderateReview, {});
  const fields = (step: string) => (
    <>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="reviewId" value={reviewId} />
      <input type="hidden" name="step" value={step} />
    </>
  );
  const error = approveState.error ?? hideState.error;
  return (
    <div className="grid justify-items-end gap-2">
      {canApprove ? (
        <form action={approve}>
          {fields('approve')}
          <button type="submit" className="btn btn-approve px-3 py-1.5 text-sm font-studio" disabled={approving}>
            {approving ? 'Approving…' : 'Approve'}
          </button>
        </form>
      ) : null}
      {canHide ? (
        <form action={hide} className="flex flex-wrap justify-end gap-2">
          {fields('hide')}
          <label className="sr-only" htmlFor={`hide-${reviewId}`}>
            Why hide this review
          </label>
          <input id={`hide-${reviewId}`} name="reason" className="field w-44 py-1.5 text-sm" placeholder="Reason (private)" maxLength={500} required />
          <button type="submit" className="btn btn-reject px-3 py-1.5 text-sm" disabled={hiding}>
            Hide
          </button>
        </form>
      ) : null}
      {error ? (
        <span role="alert" className="studio-status tone-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
