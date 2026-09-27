'use client';

import { useActionState } from 'react';
import type { FormState } from '@/app/actions';
import { saveDetails } from '@/app/teach-actions';
import type { Draft } from '@/lib/edu-api.ts';
import { CURRENCIES, LANGUAGES, majorUnits } from '@/lib/teach.ts';

type Hidden = { slug: string; tenantId: string; courseId: string };

export function DetailsForm({ hidden, draft, locked }: { hidden: Hidden; draft: Draft; locked: boolean }) {
  const [state, action, pending] = useActionState<FormState & { saved?: boolean }, FormData>(async (previous, form) => {
    const result = await saveDetails(previous, form);
    return { ...result, saved: !result.error };
  }, {});

  return (
    <form action={action} className="grid gap-4" noValidate>
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <fieldset disabled={locked} className="grid gap-4">
        <div>
          <label htmlFor="title" className="field-label">
            Title
          </label>
          <input id="title" name="title" className="field" defaultValue={draft.title} maxLength={200} required />
        </div>
        <div>
          <label htmlFor="summary" className="field-label">
            Summary
          </label>
          <input id="summary" name="summary" className="field" defaultValue={draft.summary} maxLength={500} required />
        </div>
        <div>
          <label htmlFor="description" className="field-label">
            Description
          </label>
          <textarea id="description" name="description" className="field min-h-28" defaultValue={draft.description} maxLength={20000} />
        </div>
        <div>
          <label htmlFor="outcomes" className="field-label">
            What learners will learn <span className="text-muted">(one per line)</span>
          </label>
          <textarea id="outcomes" name="outcomes" className="field min-h-24" defaultValue={draft.outcomes.join('\n')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="language" className="field-label">
              Taught in
            </label>
            <select id="language" name="language" className="field" defaultValue={draft.language}>
              {LANGUAGES.some(([code]) => code === draft.language) ? null : <option value={draft.language}>{draft.language}</option>}
              {LANGUAGES.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="price" className="field-label">
              Price <span className="text-muted">(0 = free)</span>
            </label>
            <input id="price" name="price" type="number" min={0} step="0.01" className="field" defaultValue={majorUnits(draft.priceMinor, draft.currency)} />
          </div>
          <div>
            <label htmlFor="currency" className="field-label">
              Currency
            </label>
            <select id="currency" name="currency" className="field" defaultValue={draft.currency}>
              {CURRENCIES.includes(draft.currency) ? null : <option>{draft.currency}</option>}
              {CURRENCIES.map((currency) => (
                <option key={currency}>{currency}</option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>
      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : state.saved ? (
        <p role="status" className="notice">
          Saved to the draft.
        </p>
      ) : null}
      {locked ? null : (
        <button type="submit" className="btn btn-primary justify-self-start" disabled={pending}>
          {pending ? 'Saving…' : 'Save details'}
        </button>
      )}
    </form>
  );
}
