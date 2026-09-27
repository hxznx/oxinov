'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { streamAction } from '@/app/stream-actions';
import type { Answer, HiddenPost, Question, StreamAuthor } from '@/lib/edu-api.ts';
import { formatDate } from '@/lib/format.ts';
import { MAX_POST_LENGTH, questionStatus, type StreamAction } from '@/lib/stream.ts';

type Props = {
  tenantId: string;
  question: Question;
  canModerate: boolean;
  path: string;
  timeZone: string;
  /** Link to the lesson (on the stream page); omitted on the lesson page itself. */
  lessonHref?: string | null;
};

/** Runs stream actions with shared pending and error state, then refreshes the page. */
export function useStream(tenantId: string, path: string) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (action: StreamAction, after?: () => void) =>
    start(async () => {
      const result = await streamAction({ tenantId, action, path });
      if (!result.ok) return setError(result.error);
      setError(null);
      after?.();
      router.refresh();
    });
  return { run, pending, error };
}

export function Byline({ author, createdAt, edited, timeZone }: { author: StreamAuthor; createdAt: string; edited: boolean; timeZone: string }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-muted">
      <span className="font-semibold text-ink">{author.name}</span>
      {author.teacher ? <span className="hud-label">Teacher</span> : null}
      <span>{formatDate(createdAt, timeZone)}</span>
      {edited ? <span>(edited)</span> : null}
    </p>
  );
}

function HiddenNotice({ hidden }: { hidden: HiddenPost }) {
  return (
    <p className="notice notice-error text-sm">
      Hidden by a teacher: {hidden.reason}. Only you and the course teachers can see this.
    </p>
  );
}

/** Edit-in-place text box used for questions, answers, and announcements. */
export function EditBox({ id, initial, label, pending, onSave, onCancel }: { id: string; initial: string; label: string; pending: boolean; onSave: (body: string) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(initial);
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <textarea id={id} className="field min-h-20" value={draft} maxLength={MAX_POST_LENGTH} onChange={(event) => setDraft(event.target.value)} />
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary text-sm" disabled={pending || !draft.trim()} onClick={() => onSave(draft)}>
          Save
        </button>
        <button type="button" className="btn btn-secondary text-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Teacher moderation: hiding asks for a reason the author will see; restoring is one click. */
function Moderate({ target, id, hidden, run, pending }: { target: 'question' | 'answer'; id: string; hidden: boolean; run: ReturnType<typeof useStream>['run']; pending: boolean }) {
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState('');
  if (hidden) {
    return (
      <button type="button" className="btn btn-secondary text-sm" disabled={pending} onClick={() => run({ kind: 'restore', target, id })}>
        Show again
      </button>
    );
  }
  if (!asking) {
    return (
      <button type="button" className="btn btn-secondary text-sm" onClick={() => setAsking(true)}>
        Hide
      </button>
    );
  }
  return (
    <form
      className="flex w-full flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        run({ kind: 'hide', target, id, reason }, () => setAsking(false));
      }}
    >
      <div className="min-w-48 flex-1">
        <label htmlFor={`hide-${id}`} className="field-label">
          Reason (the author sees this)
        </label>
        <input id={`hide-${id}`} className="field" value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} placeholder="Off topic" />
      </div>
      <button type="submit" className="btn btn-primary text-sm" disabled={pending || reason.trim().length < 3}>
        Hide {target}
      </button>
      <button type="button" className="btn btn-secondary text-sm" onClick={() => setAsking(false)}>
        Cancel
      </button>
    </form>
  );
}

function AnswerItem({ answer, question, canModerate, timeZone, stream }: { answer: Answer; question: Question; canModerate: boolean; timeZone: string; stream: ReturnType<typeof useStream> }) {
  const [editing, setEditing] = useState(false);
  const { run, pending } = stream;
  return (
    <li className={`grid gap-2 border p-3 ${answer.accepted ? 'border-success' : 'border-line'}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Byline author={answer.author} createdAt={answer.createdAt} edited={answer.edited} timeZone={timeZone} />
        {answer.accepted ? <span className="hud-label text-success">✓ Best answer</span> : null}
      </div>
      {answer.hidden ? <HiddenNotice hidden={answer.hidden} /> : null}
      {editing ? (
        <EditBox
          id={`edit-answer-${answer.id}`}
          initial={answer.body}
          label="Edit your answer"
          pending={pending}
          onSave={(body) => run({ kind: 'edit-answer', answerId: answer.id, body }, () => setEditing(false))}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <p className="whitespace-pre-line break-words">{answer.body}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-secondary text-sm"
          aria-pressed={answer.voted}
          disabled={pending || answer.mine || Boolean(answer.hidden)}
          title={answer.mine ? 'You cannot vote for your own answer' : undefined}
          onClick={() => run({ kind: 'vote', answerId: answer.id, up: !answer.voted })}
        >
          ▲ {answer.voted ? 'Voted' : 'Helpful'} · {answer.votes}
        </button>
        {question.canAccept && !answer.hidden ? (
          <button type="button" className="btn btn-secondary text-sm" disabled={pending} onClick={() => run({ kind: 'accept', questionId: question.id, answerId: answer.accepted ? null : answer.id })}>
            {answer.accepted ? 'Unmark best answer' : 'Mark as best answer'}
          </button>
        ) : null}
        {answer.mine && !answer.hidden && !editing ? (
          <button type="button" className="btn btn-secondary text-sm" onClick={() => setEditing(true)}>
            Edit
          </button>
        ) : null}
        {canModerate ? <Moderate target="answer" id={answer.id} hidden={Boolean(answer.hidden)} run={run} pending={pending} /> : null}
      </div>
    </li>
  );
}

/** One lesson question with its answers (FR-COMM-701). Text is shown as plain text, never as HTML. */
export function QuestionThread({ tenantId, question, canModerate, path, timeZone, lessonHref }: Props) {
  const stream = useStream(tenantId, path);
  const { run, pending, error } = stream;
  const [editing, setEditing] = useState(false);
  const [reply, setReply] = useState('');
  const headingId = `question-${question.id}`;

  return (
    <article aria-labelledby={headingId} className="card grid gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Byline author={question.author} createdAt={question.createdAt} edited={question.edited} timeZone={timeZone} />
        <span className="hud-label">{questionStatus(question)}</span>
      </div>
      {lessonHref !== undefined ? (
        <p className="hud-label">
          {lessonHref ? <Link href={lessonHref}>// {question.lessonTitle}</Link> : <>// {question.lessonTitle} (removed lesson)</>}
        </p>
      ) : null}
      {question.hidden ? <HiddenNotice hidden={question.hidden} /> : null}
      {editing ? (
        <EditBox
          id={`edit-question-${question.id}`}
          initial={question.body}
          label="Edit your question"
          pending={pending}
          onSave={(body) => run({ kind: 'edit-question', questionId: question.id, body }, () => setEditing(false))}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <h3 id={headingId} className="whitespace-pre-line break-words text-lg">
          {question.body}
        </h3>
      )}
      {(question.mine && !question.hidden && !editing) || canModerate ? (
        <div className="flex flex-wrap gap-2">
          {question.mine && !question.hidden && !editing ? (
            <button type="button" className="btn btn-secondary text-sm" onClick={() => setEditing(true)}>
              Edit question
            </button>
          ) : null}
          {canModerate ? <Moderate target="question" id={question.id} hidden={Boolean(question.hidden)} run={run} pending={pending} /> : null}
        </div>
      ) : null}

      {question.answers.length > 0 ? (
        <ul className="grid gap-2 pl-3" aria-label="Answers">
          {question.answers.map((answer) => (
            <AnswerItem key={answer.id} answer={answer} question={question} canModerate={canModerate} timeZone={timeZone} stream={stream} />
          ))}
        </ul>
      ) : null}

      {!question.hidden ? (
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            run({ kind: 'answer', questionId: question.id, body: reply }, () => setReply(''));
          }}
        >
          <label htmlFor={`reply-${question.id}`} className="sr-only">
            Your answer
          </label>
          <textarea
            id={`reply-${question.id}`}
            className="field min-h-16"
            value={reply}
            maxLength={MAX_POST_LENGTH}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Write an answer…"
          />
          <button type="submit" className="btn btn-secondary justify-self-start text-sm" disabled={pending || !reply.trim()}>
            Post answer
          </button>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="notice notice-error">
          {error}
        </p>
      ) : null}
    </article>
  );
}
