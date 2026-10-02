'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { enterStore } from '@/app/storefront-actions';
import type { StorePlan } from '@/lib/edu-api.ts';
import { formatDate } from '@/lib/format.ts';
import { formatNpr, perMonthMinor, planEnd, type PlanPeriod } from '@/lib/store.ts';

const ZONE = 'Asia/Kathmandu';

function Continue({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full justify-center py-4 font-studio text-lg tracking-wide" disabled={pending}>
      {pending ? 'Opening…' : label}
    </button>
  );
}

/**
 * Plan cards on the offering page (design screen 2): price, monthly cost, and the end date if access
 * started today. "Continue to payment" signs the visitor in if needed, adds them to the store, and opens
 * the course with this plan ready for bank QR checkout and a coupon.
 */
export function PlanPicker({ offering, courseId, plans, initial, tone }: { offering: string; courseId: string; plans: StorePlan[]; initial?: PlanPeriod; tone: string }) {
  const fallback = plans.find((plan) => plan.period === 'YEAR_1')?.period ?? plans[0]?.period;
  const [period, setPeriod] = useState<PlanPeriod | undefined>(plans.some((plan) => plan.period === initial) ? initial : fallback);
  const month = plans.find((plan) => plan.period === 'MONTH_1');
  const chosen = plans.find((plan) => plan.period === period);
  const now = new Date();

  return (
    <form action={enterStore} className="grid gap-3" style={{ ['--tone' as string]: `var(${tone})` }}>
      <input type="hidden" name="offering" value={offering} />
      <input type="hidden" name="courseId" value={courseId} />
      <fieldset className="grid gap-2">
        <legend className="sr-only">Plans</legend>
        {plans.map((plan) => {
          const monthly = perMonthMinor(plan);
          const end = planEnd(plan.period, now);
          const saving = month && monthly && plan.period !== 'MONTH_1' ? Math.round(100 - (100 * monthly) / month.priceMinor) : 0;
          return (
            <label key={plan.period} className="store-plan">
              <input type="radio" name="plan" value={plan.period} checked={period === plan.period} onChange={() => setPeriod(plan.period)} />
              <span className="grid gap-0.5">
                <span className="font-studio text-lg font-bold">
                  {plan.label}
                  {saving >= 10 ? <span className="text-hud ml-2 text-xs font-normal tone-warning">· {saving}% less per month</span> : null}
                </span>
                <span className="text-sm text-muted" suppressHydrationWarning>
                  {monthly && plan.period !== 'MONTH_1' ? `About ${formatNpr(monthly)} a month · ` : ''}
                  {end ? `until ${formatDate(end, ZONE)}` : 'One payment · no end date'}
                </span>
              </span>
              <span className="font-display font-bold">{formatNpr(plan.priceMinor)}</span>
            </label>
          );
        })}
      </fieldset>
      {chosen ? (
        <p className="bg-raised px-4 py-3 text-sm text-muted">
          <strong className="text-ink">
            {chosen.label} · {formatNpr(chosen.priceMinor)}
          </strong>
          <br />
          Every lesson and subscriber material for the whole plan. Access starts when your payment is approved; renewing early adds the time to the end.
        </p>
      ) : null}
      <Continue label="Continue to payment" />
      <p className="text-center text-sm text-muted">Bank QR now · coupons at checkout · card for learners abroad soon</p>
    </form>
  );
}

/** Free offerings and "watch the free lessons": enter the store without choosing a plan. */
export function EnterButton({ offering, courseId, label, secondary }: { offering: string; courseId: string; label: string; secondary?: boolean }) {
  return (
    <form action={enterStore}>
      <input type="hidden" name="offering" value={offering} />
      <input type="hidden" name="courseId" value={courseId} />
      {secondary ? <SecondaryButton label={label} /> : <Continue label={label} />}
    </form>
  );
}

function SecondaryButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-secondary w-full justify-center font-studio" disabled={pending}>
      {pending ? 'Opening…' : label}
    </button>
  );
}
