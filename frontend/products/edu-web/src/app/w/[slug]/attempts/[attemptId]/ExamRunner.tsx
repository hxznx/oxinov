'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import type { FormState } from '@/app/actions';
import { saveExamAnswers, submitExam } from '@/app/exam-actions';
import type { AnswerResponse, Attempt } from '@/lib/edu-api.ts';
import { formatClock, isAnswered, selectChoice } from '@/lib/exam.ts';

const SAVE_DELAY_MS = 1500;
type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'retrying';

/**
 * Timed exam (FR-ASSESS-501/502). Answers autosave shortly after each change; the server keeps the real
 * deadline, re-checks access on every save, and grades on submission. At zero the attempt submits itself.
 */
export function ExamRunner({ slug, tenantId, attempt }: { slug: string; tenantId: string; attempt: Attempt }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerResponse | null>>(() =>
    Object.fromEntries(attempt.items.map((item) => [item.id, item.response])),
  );
  const dirty = useRef(new Set<string>());
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const [status, setStatus] = useState<SaveStatus>('saved');

  // Count down against a fixed end time so a sleeping tab never gains time.
  const endsAt = useRef(Date.now() + attempt.remainingSec * 1000);
  const [remaining, setRemaining] = useState(attempt.remainingSec);
  const submitted = useRef(false);

  const flush = useCallback(async (): Promise<boolean> => {
    const ids = [...dirty.current];
    const payload = ids
      .map((itemId) => ({ itemId, response: answersRef.current[itemId] }))
      .filter((answer): answer is { itemId: string; response: AnswerResponse } => answer.response !== null && answer.response !== undefined);
    if (payload.length === 0) {
      dirty.current.clear();
      return true;
    }
    setStatus('saving');
    const result = await saveExamAnswers(tenantId, attempt.id, payload);
    if (result.ok) {
      ids.forEach((id) => dirty.current.delete(id));
      if (typeof result.remainingSec === 'number') endsAt.current = Date.now() + result.remainingSec * 1000;
      setStatus(dirty.current.size ? 'unsaved' : 'saved');
      return true;
    }
    if (result.closed) {
      router.refresh();
      return false;
    }
    setStatus('retrying');
    return false;
  }, [attempt.id, router, tenantId]);

  const [state, submitAction, submitting] = useActionState<FormState, FormData>(async (previous, form) => {
    submitted.current = true;
    await flush();
    return submitExam(previous, form);
  }, {});

  // Debounced autosave, with a retry every few seconds while offline.
  useEffect(() => {
    if (status !== 'unsaved' && status !== 'retrying') return;
    const timer = setTimeout(() => void flush(), status === 'retrying' ? 5000 : SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [answers, status, flush]);

  useEffect(() => {
    const tick = setInterval(() => {
      const left = Math.max(0, Math.round((endsAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0 && !submitted.current) {
        submitted.current = true;
        formRef.current?.requestSubmit();
      }
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current.size > 0) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  function answer(itemId: string, response: AnswerResponse) {
    dirty.current.add(itemId);
    setAnswers((current) => ({ ...current, [itemId]: response }));
    setStatus('unsaved');
  }

  const answeredCount = attempt.items.filter((item) => isAnswered(answers[item.id])).length;
  const unanswered = attempt.items.length - answeredCount;
  const [confirming, setConfirming] = useState(false);
  let lastSection = '';

  return (
    <div className="grid gap-6">
      <div className="card sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3">
        <p>
          <span className="hud-label">Time left</span>{' '}
          <span role="timer" aria-live="off" className={`font-display text-2xl ${remaining <= 60 ? 'text-danger' : ''}`}>
            {formatClock(remaining)}
          </span>
        </p>
        <p className="hud-label" aria-live="polite">
          {answeredCount}/{attempt.items.length} answered ·{' '}
          {{ saved: 'All answers saved', saving: 'Saving…', unsaved: 'Saving soon…', retrying: 'Offline — retrying' }[status]}
        </p>
        <p className="sr-only" aria-live="assertive">
          {remaining === 300 ? 'Five minutes left.' : remaining === 60 ? 'One minute left.' : ''}
        </p>
      </div>

      <ol className="grid gap-6">
        {attempt.items.map((item) => {
          const heading = item.sectionKey !== lastSection ? item.sectionKey : null;
          lastSection = item.sectionKey;
          const current = answers[item.id];
          const selected = current && 'choiceIds' in current ? current.choiceIds : [];
          return (
            <li key={item.id} className="grid gap-3">
              {heading ? <h2 className="hud-label">// Section {heading}</h2> : null}
              <fieldset className="card grid gap-3">
                <legend className="sr-only">Question {item.position}</legend>
                <p className="hud-label">
                  Question {item.position} · {item.marks} {item.marks === 1 ? 'mark' : 'marks'}
                  {item.type === 'MULTIPLE_CHOICE' ? ' · choose all that apply' : ''}
                </p>
                {item.passage ? <blockquote className="whitespace-pre-line border-l-2 border-line pl-4">{item.passage}</blockquote> : null}
                <p className="text-lg whitespace-pre-line">{item.prompt}</p>
                {item.type === 'FILL_BLANK' ? (
                  <input
                    className="field"
                    aria-label={`Answer to question ${item.position}`}
                    maxLength={500}
                    defaultValue={current && 'text' in current ? current.text : ''}
                    onChange={(event) => answer(item.id, { text: event.target.value })}
                  />
                ) : (
                  <div className="grid gap-2">
                    {item.choices.map((choice) => (
                      <label key={choice.id} className="flex cursor-pointer items-start gap-3 border border-line p-3 hover:border-brand">
                        <input
                          type={item.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                          name={`q-${item.id}`}
                          value={choice.id}
                          checked={selected.includes(choice.id)}
                          onChange={() => answer(item.id, selectChoice(item.type, current ?? null, choice.id))}
                          className="mt-1"
                        />
                        <span>{choice.text}</span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>

      <form ref={formRef} action={submitAction} className="card grid gap-3">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="tenantId" value={tenantId} />
        <input type="hidden" name="attemptId" value={attempt.id} />
        {state.error ? (
          <p role="alert" className="notice notice-error">
            {state.error}
          </p>
        ) : null}
        {confirming ? (
          <>
            <p role="alert" className="notice">
              {unanswered > 0
                ? `${unanswered} ${unanswered === 1 ? 'question is' : 'questions are'} unanswered. Submit anyway? You cannot change answers afterwards.`
                : 'Submit your answers? You cannot change them afterwards.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Yes, submit'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirming(false)} disabled={submitting}>
                Keep working
              </button>
            </div>
          </>
        ) : (
          <button type="button" className="btn btn-primary justify-self-start" onClick={() => setConfirming(true)}>
            Finish and submit
          </button>
        )}
      </form>
    </div>
  );
}
