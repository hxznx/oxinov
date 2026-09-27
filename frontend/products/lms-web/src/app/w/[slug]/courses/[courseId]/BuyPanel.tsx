'use client';

import { useActionState, useEffect, useRef } from 'react';
import { startCheckout, type CheckoutState } from '@/app/actions';
import type { CheckoutOptions, PaymentProvider } from '@/lib/edu-api.ts';

const LABEL: Record<PaymentProvider, string> = { KHALTI: 'Pay with Khalti', ESEWA: 'Pay with eSewa' };

/**
 * Buy a paid course with Khalti or eSewa (FR-CATALOG-303, ADR-023). Khalti is a redirect from the server;
 * eSewa needs a signed form posted by the browser, which this component submits as soon as it arrives.
 */
export function BuyPanel({ tenantId, courseId, returnTo, options }: { tenantId: string; courseId: string; returnTo: string; options: CheckoutOptions }) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(startCheckout, {});
  const esewaForm = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.form) esewaForm.current?.submit();
  }, [state.form]);

  if (!options.available) {
    return <p className="notice">{options.reason ?? 'This course cannot be bought online yet.'}</p>;
  }
  return (
    <div className="grid gap-3">
      {options.providers.map((provider) => (
        <form key={provider} action={action}>
          <input type="hidden" name="tenantId" value={tenantId} />
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <input type="hidden" name="provider" value={provider} />
          <button type="submit" className="btn btn-primary w-full justify-center" disabled={pending || Boolean(state.form)}>
            {pending || state.form ? 'Opening payment…' : LABEL[provider]}
          </button>
        </form>
      ))}
      {options.mode === 'sandbox' ? (
        <p className="hud-label">// Test payments: no real money moves.</p>
      ) : null}
      <p className="text-sm opacity-80">The course opens as soon as your payment is confirmed.</p>
      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : null}
      {state.form ? (
        <form ref={esewaForm} method="POST" action={state.form.url} className="grid gap-2">
          {Object.entries(state.form.fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          {/* The form submits itself; the button is there if the browser blocks that. */}
          <button type="submit" className="btn btn-secondary w-full justify-center">
            Continue to eSewa
          </button>
        </form>
      ) : null}
    </div>
  );
}
