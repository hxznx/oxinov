'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { startBankCheckout, type StoreFormState } from '@/app/store-actions';
import { formatDate } from '@/lib/format.ts';
import { formatNpr, perMonthMinor, planEnd, type CheckoutInfo, type PlanPeriod } from '@/lib/store.ts';

/**
 * Access plans for a course (FR-CATALOG-305, FR-CATALOG-315): each plan's price, monthly cost, and the
 * exact end date before checkout; an optional coupon; then the bank QR payment page. A renewal starts
 * when current access ends, so the dates shown already include it.
 */
export function PlansPanel({
  slug,
  tenantId,
  courseId,
  info,
  timeZone,
  initialPeriod,
}: {
  slug: string;
  tenantId: string;
  courseId: string;
  info: CheckoutInfo;
  timeZone: string;
  /** Plan chosen on the store's offering page, if it is still on sale. */
  initialPeriod?: PlanPeriod;
}) {
  const [state, action, pending] = useActionState<StoreFormState, FormData>(startBankCheckout, {});
  const defaultPeriod = info.plans.find((plan) => plan.period === initialPeriod)?.period ?? info.plans.find((plan) => plan.period === 'YEAR_1')?.period ?? info.plans[0]?.period;
  const [period, setPeriod] = useState<PlanPeriod | undefined>(defaultPeriod);

  if (info.openPayment && info.openPayment.status !== 'PENDING') {
    const review = info.openPayment.status === 'PENDING_REVIEW';
    return (
      <div className="grid gap-3">
        <p className={review ? 'notice' : 'notice notice-error'} role="status">
          {review
            ? `Your payment for the ${info.openPayment.planLabel} plan is being checked. We email you when the course unlocks.`
            : 'Your last payment needs a fix before we can approve it.'}
        </p>
        <Link href={`/w/${slug}/pay/bank/${info.openPayment.id}`} className="btn btn-primary w-full justify-center">
          {review ? 'See payment status' : 'Fix and resubmit'}
        </Link>
      </div>
    );
  }
  if (info.plans.length === 0) return null;
  if (!info.bank.available) return <p className="notice">{info.bank.reason ?? 'This course cannot be bought online yet.'}</p>;

  const renewFrom = info.owned && info.accessEndsAt && new Date(info.accessEndsAt) > new Date() ? new Date(info.accessEndsAt) : new Date();
  const year = info.plans.find((plan) => plan.period === 'YEAR_1');
  const month = info.plans.find((plan) => plan.period === 'MONTH_1');
  const yearSaving = year && month ? Math.round(100 - (100 * (perMonthMinor(year) ?? 0)) / month.priceMinor) : 0;

  return (
    <form id="plans" action={action} className="grid scroll-mt-4 gap-3">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="courseId" value={courseId} />
      <fieldset className="grid gap-2">
        <legend className="field-label">{info.owned ? 'Renew or extend your access' : 'Choose a plan'}</legend>
        {info.plans.map((plan) => {
          const end = planEnd(plan.period, renewFrom);
          const monthly = perMonthMinor(plan);
          const selected = period === plan.period;
          return (
            <label
              key={plan.id}
              className={`card cut-sm grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 ${selected ? 'border-[var(--ox-color-brand)]' : ''}`}
            >
              <input type="radio" name="period" value={plan.period} checked={selected} onChange={() => setPeriod(plan.period)} />
              <span className="grid gap-0.5">
                <span className="font-semibold">
                  {plan.label}
                  {plan.period === 'YEAR_1' && yearSaving > 0 ? <span className="hud-label ml-2">// {yearSaving}% less per month</span> : null}
                </span>
                <span className="text-sm opacity-80">
                  {monthly !== null && plan.period !== 'MONTH_1' ? `${formatNpr(monthly)} a month · ` : ''}
                  {end ? `until ${formatDate(end, timeZone)}` : 'one payment, no end date'}
                </span>
              </span>
              <span className="font-semibold">{formatNpr(plan.priceMinor)}</span>
            </label>
          );
        })}
      </fieldset>
      <label className="grid gap-1">
        <span className="field-label">Coupon code (optional)</span>
        <input name="couponCode" className="field" autoComplete="off" maxLength={40} placeholder="For example DASHAIN25" />
      </label>
      <button type="submit" className="btn btn-primary w-full justify-center" disabled={pending || !period}>
        {pending ? 'Preparing your payment…' : 'Continue to payment'}
      </button>
      <p className="text-sm opacity-80">Pay with your bank app&apos;s QR. {info.bank.reviewTimeText}. Lessons play inside Oxinov; downloads are not offered.</p>
      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
