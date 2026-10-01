'use client';

import { useActionState } from 'react';
import { createCoupon, toggleCoupon, type StoreFormState } from '@/app/store-actions';
import { PLAN_LABELS, PLAN_PERIODS } from '@/lib/store.ts';

/** New coupon: percentage or fixed NPR discount, optional plan, end date, and use limit (FR-CATALOG-317). */
export function CouponForm({ slug, tenantId }: { slug: string; tenantId: string }) {
  const [state, action, pending] = useActionState<StoreFormState, FormData>(createCoupon, {});
  return (
    <form action={action} className="grid gap-3 border-t border-[var(--ox-color-border)] pt-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <h3 className="studio-h2">New coupon</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1">
          <span className="field-label">Code</span>
          <input name="code" className="field uppercase" required maxLength={40} placeholder="DASHAIN25" />
        </label>
        <label className="grid gap-1">
          <span className="field-label">Discount type</span>
          <select name="kind" className="field" defaultValue="percent">
            <option value="percent">Percent off</option>
            <option value="amount">NPR off</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="field-label">Discount</span>
          <input name="amount" className="field" inputMode="decimal" required placeholder="25" />
        </label>
        <label className="grid gap-1">
          <span className="field-label">Plan</span>
          <select name="period" className="field" defaultValue="">
            <option value="">All plans</option>
            {PLAN_PERIODS.map((period) => (
              <option key={period} value={period}>
                {PLAN_LABELS[period]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="field-label">Ends on (optional)</span>
          <input name="endsAt" type="date" className="field" />
        </label>
        <label className="grid gap-1">
          <span className="field-label">Use limit (optional)</span>
          <input name="maxUses" className="field" inputMode="numeric" placeholder="200" />
        </label>
      </div>
      <button type="submit" className="btn btn-secondary justify-self-start font-studio" disabled={pending}>
        {pending ? 'Creating…' : 'Create coupon'}
      </button>
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
    </form>
  );
}

export function CouponToggle({ slug, tenantId, couponId, active }: { slug: string; tenantId: string; couponId: string; active: boolean }) {
  const [state, action, pending] = useActionState<StoreFormState, FormData>(toggleCoupon, {});
  return (
    <form action={action}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="couponId" value={couponId} />
      <input type="hidden" name="active" value={active ? 'false' : 'true'} />
      <button type="submit" className="btn btn-secondary px-3 py-1 text-sm" disabled={pending} aria-label={active ? 'Turn coupon off' : 'Turn coupon on'}>
        {active ? 'On · turn off' : 'Off · turn on'}
      </button>
      {state.error ? <span className="block text-sm">{state.error}</span> : null}
    </form>
  );
}
