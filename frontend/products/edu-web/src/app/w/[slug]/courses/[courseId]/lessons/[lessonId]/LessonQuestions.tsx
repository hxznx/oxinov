'use client';

import { useState } from 'react';
import { QuestionThread, useStream } from '@/components/QuestionThread';
import type { Questions } from '@/lib/edu-api.ts';
import { MAX_POST_LENGTH } from '@/lib/stream.ts';

type Props = { tenantId: string; courseId: string; lessonId: string; thread: Questions; path: string; timeZone: string; streamPage: string };

/** Questions and answers on this lesson (FR-COMM-701), for people with course access. */
export function LessonQuestions({ tenantId, courseId, lessonId, thread, path, timeZone, streamPage }: Props) {
  const { run, pending, error } = useStream(tenantId, path);
  const [text, setText] = useState('');

  return (
    <section aria-labelledby="questions-heading" className="grid gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="questions-heading" className="text-2xl">
          Questions and answers
        </h2>
        <a href={streamPage} className="text-sm">
          Class stream
        </a>
      </div>

      <form
        className="card grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          run({ kind: 'ask', courseId, lessonId, body: text }, () => setText(''));
        }}
      >
        <label htmlFor="ask-question" className="field-label">
          Ask about this lesson
        </label>
        <textarea
          id="ask-question"
          className="field min-h-20"
          value={text}
          maxLength={MAX_POST_LENGTH}
          onChange={(event) => setText(event.target.value)}
          placeholder="What is unclear? Your classmates and teacher can answer."
        />
        <button type="submit" className="btn btn-primary justify-self-start" disabled={pending || !text.trim()}>
          Ask question
        </button>
        {error ? (
          <p role="alert" className="notice notice-error">
            {error}
          </p>
        ) : null}
      </form>

      {thread.questions.length > 0 ? (
        thread.questions.map((question) => (
          <QuestionThread key={question.id} tenantId={tenantId} question={question} canModerate={thread.canModerate} path={path} timeZone={timeZone} />
        ))
      ) : (
        <p className="text-muted">No questions on this lesson yet.</p>
      )}
    </section>
  );
}
