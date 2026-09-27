'use client';

import { useActionState } from 'react';
import type { FormState } from '@/app/actions';
import { gradeSubmission } from '@/app/assignment-actions';

export function GradeForm({ hidden, maxPoints }: { hidden: Record<string, string>; maxPoints: number | null }) {
  const [state, action, pending] = useActionState<FormState & { saved?: boolean }, FormData>(gradeSubmission, {});
  if (state.saved) return <p role="status" className="notice">Saved. The learner can see your decision and feedback.</p>;
  return (
    <form action={action} className="grid gap-4" noValidate>
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <fieldset className="grid gap-2">
        <legend className="field-label">Result</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="outcome" value="PASSED" /> Passed
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="outcome" value="REVISION_REQUESTED" /> Ask for a revision
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="outcome" value="FAILED" /> Not passed (final)
        </label>
      </fieldset>
      {maxPoints ? (
        <div>
          <label htmlFor="score" className="field-label">
            Points (out of {maxPoints})
          </label>
          <input id="score" name="score" type="number" min={0} max={maxPoints} className="field w-32" />
        </div>
      ) : null}
      <div>
        <label htmlFor="feedback" className="field-label">
          Feedback <span className="text-muted">(required when asking for a revision)</span>
        </label>
        <textarea id="feedback" name="feedback" className="field min-h-28" maxLength={10000} />
      </div>
      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary justify-self-start" disabled={pending}>
        {pending ? 'Saving…' : 'Save result'}
      </button>
    </form>
  );
}
