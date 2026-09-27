'use client';

import { useActionState } from 'react';
import type { FormState } from '@/app/actions';
import { rejectDraft } from '@/app/teach-actions';

export function RejectForm({ hidden }: { hidden: { slug: string; tenantId: string; courseId: string } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(rejectDraft, {});
  return (
    <form action={action} className="grid gap-3">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <label htmlFor="reason" className="field-label">
        Send back with feedback
      </label>
      <textarea id="reason" name="reason" className="field min-h-20" maxLength={2000} placeholder="What should the teacher change?" />
      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className="btn btn-secondary justify-self-start" disabled={pending}>
        {pending ? 'Sending…' : 'Send back'}
      </button>
    </form>
  );
}
