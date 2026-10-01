'use client';

import { useActionState } from 'react';
import { reviewPayment, type StoreFormState } from '@/app/store-actions';

/** Approve (unlocks the course, sends the thank-you email) or reject with a reason the learner sees. */
export function ReviewForms({ slug, tenantId, paymentId }: { slug: string; tenantId: string; paymentId: string }) {
  const [state, action, pending] = useActionState<StoreFormState, FormData>(reviewPayment, {});
  const hidden = (
    <>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="paymentId" value={paymentId} />
    </>
  );
  return (
    <section aria-label="Decision" className="studio-panel grid gap-4 p-5">
      <form action={action} className="grid gap-2">
        {hidden}
        <input type="hidden" name="decision" value="approve" />
        <button type="submit" className="btn btn-approve justify-center font-studio" disabled={pending}>
          {pending ? 'Saving…' : 'Approve · unlock'}
        </button>
      </form>
      <form action={action} className="grid gap-2">
        {hidden}
        <input type="hidden" name="decision" value="reject" />
        <label className="grid gap-1">
          <span className="field-label">Reason (shown to the learner)</span>
          <textarea name="reason" className="field" rows={3} maxLength={500} placeholder="For example: the amount on the screenshot is NPR 1,500; the 1-year plan is NPR 15,000." />
        </label>
        <button type="submit" className="btn btn-reject justify-center font-studio" disabled={pending}>
          Reject with reason
        </button>
      </form>
      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="notice">
          {state.ok}
        </p>
      ) : null}
    </section>
  );
}
