'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useActionState } from 'react';
import type { FormState } from '@/app/actions';
import { saveQuizSettings } from '@/app/quiz-actions';
import type { Quiz } from '@/lib/edu-api.ts';

export function QuizSettingsForm({ hidden, quiz }: { hidden: Record<string, string>; quiz: Quiz }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, action, pending] = useActionState<FormState & { saved?: boolean }, FormData>(async (previous, form) => {
    const result = await saveQuizSettings(previous, form);
    // Drop an earlier error message carried in the address; keep the selected question.
    const params = new URLSearchParams(window.location.search);
    if (result.saved && params.has('error')) {
      params.delete('error');
      router.replace(params.size > 0 ? `${pathname}?${params}` : pathname, { scroll: false });
    }
    return result;
  }, {});
  const locked = !quiz.editable;
  return (
    <form action={action} className="grid gap-4" noValidate>
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <fieldset disabled={locked} className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="sm:col-span-3 lg:col-span-2">
          <label htmlFor="title" className="field-label">
            Title
          </label>
          <input id="title" name="title" className="field" defaultValue={quiz.title} maxLength={200} required />
        </div>
        <div>
          <label htmlFor="kind" className="field-label">
            Type
          </label>
          <select id="kind" name="kind" className="field" defaultValue={quiz.kind}>
            <option value="PRACTICE">Practice quiz</option>
            <option value="MOCK">Mock exam</option>
          </select>
        </div>
        <div>
          <label htmlFor="timeLimitMin" className="field-label">
            Time limit (min)
          </label>
          <input id="timeLimitMin" name="timeLimitMin" type="number" min={1} max={600} className="field" defaultValue={quiz.timeLimitMin} />
        </div>
        <div>
          <label htmlFor="passPercent" className="field-label">
            Pass mark (%)
          </label>
          <input id="passPercent" name="passPercent" type="number" min={0} max={100} className="field" defaultValue={quiz.passPercent} />
        </div>
        <div>
          <label htmlFor="maxAttempts" className="field-label">
            Attempts
          </label>
          <input id="maxAttempts" name="maxAttempts" type="number" min={1} max={100} className="field" defaultValue={quiz.maxAttempts ?? ''} placeholder="Unlimited" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="answerRelease" className="field-label">
            Show correct answers
          </label>
          <select id="answerRelease" name="answerRelease" className="field" defaultValue={quiz.answerRelease}>
            <option value="AFTER_SUBMIT">After the learner submits</option>
            <option value="NEVER">Never (score only)</option>
          </select>
        </div>
        <label className="flex items-center gap-2 self-end pb-2 sm:col-span-2">
          <input type="checkbox" name="shuffleQuestions" defaultChecked={quiz.shuffleQuestions} />
          Pick questions in random order
        </label>
      </fieldset>
      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : state.saved ? (
        <p role="status" className="notice">
          Settings saved.
        </p>
      ) : null}
      {locked ? null : (
        <button type="submit" className="btn btn-secondary justify-self-start font-studio" disabled={pending}>
          {pending ? 'Saving…' : 'Save settings'}
        </button>
      )}
    </form>
  );
}
