'use client';

import { useActionState } from 'react';
import { savePlans, type StoreFormState } from '@/app/store-actions';
import { PLAN_LABELS, PLAN_PERIODS, type Plan, type PlanPeriod } from '@/lib/store.ts';

/** One row per plan length: on sale or hidden, and the NPR price. Missing plans start at the store defaults. */
export function PlansForm({
  slug,
  tenantId,
  courseId,
  plans,
  defaults,
  disabled,
}: {
  slug: string;
  tenantId: string;
  courseId: string;
  plans: Plan[];
  defaults: Record<PlanPeriod, number>;
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState<StoreFormState, FormData>(savePlans, {});
  const isNew = plans.length === 0;
  return (
    <form action={action} className="card grid gap-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="courseId" value={courseId} />
      {isNew ? <p className="notice">No plans yet: the store&apos;s default prices are filled in. Save to put this course on sale.</p> : null}
      <fieldset disabled={disabled || pending} className="grid gap-3">
        <legend className="sr-only">Plans</legend>
        {PLAN_PERIODS.map((period) => {
          const plan = plans.find((item) => item.period === period);
          const price = plan?.priceMinor ?? defaults[period];
          return (
            <div key={period} className="grid grid-cols-[1fr_10rem_auto] items-center gap-3 border-b border-[var(--ox-color-border)] pb-3">
              <span className="grid">
                <span className="font-semibold">{PLAN_LABELS[period]}</span>
                <span className="text-sm opacity-80">{period === 'LIFETIME' ? 'Never ends' : 'Counted from approval, or from the end of current access'}</span>
              </span>
              <label className="grid gap-1">
                <span className="field-label">Price (NPR)</span>
                <input name={`price-${period}`} className="field" inputMode="decimal" defaultValue={String(price / 100)} />
              </label>
              <label className="flex min-h-11 items-center gap-2">
                <input type="checkbox" name={`active-${period}`} defaultChecked={plan ? plan.active : true} />
                On sale
              </label>
            </div>
          );
        })}
      </fieldset>
      {!disabled ? (
        <button type="submit" className="btn btn-primary justify-self-start" disabled={pending}>
          {pending ? 'Saving…' : 'Save plans'}
        </button>
      ) : (
        <p className="notice">Only the owner can change prices.</p>
      )}
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
