'use client';

import { useActionState } from 'react';
import type { FormState } from '@/app/actions';
import { startExam } from '@/app/exam-actions';

export function StartExamButton({ slug, tenantId, examId, resume }: { slug: string; tenantId: string; examId: string; resume: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(startExam, {});
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="examId" value={examId} />
      <button type="submit" className="btn btn-primary justify-self-start" disabled={pending}>
        {pending ? 'Opening…' : resume ? 'Resume exam' : 'Start exam'}
      </button>
      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
