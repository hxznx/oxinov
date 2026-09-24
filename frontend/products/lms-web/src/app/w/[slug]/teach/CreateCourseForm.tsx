'use client';

import { useActionState } from 'react';
import type { FormState } from '@/app/actions';
import { createCourse } from '@/app/teach-actions';
import { CURRENCIES, LANGUAGES } from '@/lib/teach.ts';

export function CreateCourseForm({ slug, tenantId }: { slug: string; tenantId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createCourse, {});
  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <div>
        <label htmlFor="title" className="field-label">
          Course title
        </label>
        <input id="title" name="title" className="field" maxLength={200} placeholder="JLPT N5 Kanji in 30 days" required />
      </div>
      <div>
        <label htmlFor="summary" className="field-label">
          One-sentence summary
        </label>
        <input id="summary" name="summary" className="field" maxLength={500} placeholder="What learners will be able to do." required />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="language" className="field-label">
            Taught in
          </label>
          <select id="language" name="language" className="field" defaultValue="en">
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
          <input id="price" name="price" type="number" min={0} step="0.01" defaultValue={0} className="field" />
        </div>
        <div>
          <label htmlFor="currency" className="field-label">
            Currency
          </label>
          <select id="currency" name="currency" className="field" defaultValue="NPR">
            {CURRENCIES.map((currency) => (
              <option key={currency}>{currency}</option>
            ))}
          </select>
        </div>
      </div>
      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary justify-self-start" disabled={pending}>
        {pending ? 'Creating…' : 'Create course'}
      </button>
    </form>
  );
}
