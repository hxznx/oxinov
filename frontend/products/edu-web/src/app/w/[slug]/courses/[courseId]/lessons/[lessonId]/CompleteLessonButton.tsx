'use client';

import { useActionState } from 'react';
import { completeLesson, type FormState } from '@/app/actions';

/** FR-PLAYER-402: text lessons are completed by the learner's confirmation. */
export function CompleteLessonButton({ tenantId, courseId, lessonId, returnTo }: { tenantId: string; courseId: string; lessonId: string; returnTo: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(completeLesson, {});
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button type="submit" className="btn btn-secondary" disabled={pending}>
        {pending ? 'Saving…' : 'Mark as complete'}
      </button>
      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
