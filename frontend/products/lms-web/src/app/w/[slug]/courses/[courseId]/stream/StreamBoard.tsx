'use client';

import { useState } from 'react';
import { Byline, EditBox, QuestionThread, useStream } from '@/components/QuestionThread';
import type { Announcement, Announcements, Questions } from '@/lib/edu-api.ts';
import { filterQuestions, MAX_POST_LENGTH, type QuestionFilter } from '@/lib/stream.ts';

type Props = {
  tenantId: string;
  courseId: string;
  announcements: Announcements;
  questions: Questions;
  path: string;
  timeZone: string;
  lessonBase: string;
};

const FILTERS: { value: QuestionFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unanswered', label: 'Unanswered' },
  { value: 'mine', label: 'My questions' },
];

function AnnouncementItem({ announcement, canPost, stream, timeZone }: { announcement: Announcement; canPost: boolean; stream: ReturnType<typeof useStream>; timeZone: string }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { run, pending } = stream;
  return (
    <li className="card grid gap-2">
      <Byline author={announcement.author} createdAt={announcement.createdAt} edited={announcement.edited} timeZone={timeZone} />
      {editing ? (
        <EditBox
          id={`edit-announcement-${announcement.id}`}
          initial={announcement.body}
          label="Edit announcement"
          pending={pending}
          onSave={(body) => run({ kind: 'edit-announcement', announcementId: announcement.id, body }, () => setEditing(false))}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <p className="whitespace-pre-line break-words">{announcement.body}</p>
      )}
      {canPost && !editing ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary text-sm" onClick={() => setEditing(true)}>
            Edit
          </button>
          {confirming ? (
            <>
              <button type="button" className="btn btn-primary text-sm" disabled={pending} onClick={() => run({ kind: 'delete-announcement', announcementId: announcement.id })}>
                Yes, delete
              </button>
              <button type="button" className="btn btn-secondary text-sm" onClick={() => setConfirming(false)}>
                Keep
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-secondary text-sm" onClick={() => setConfirming(true)}>
              Delete
            </button>
          )}
        </div>
      ) : null}
    </li>
  );
}

/** Announcements (teachers post, everyone reads) and the course's questions with filters. */
export function StreamBoard({ tenantId, courseId, announcements, questions, path, timeZone, lessonBase }: Props) {
  const stream = useStream(tenantId, path);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState<QuestionFilter>('all');
  const shown = filterQuestions(questions.questions, filter);

  return (
    <>
      <section aria-labelledby="announcements-heading" className="grid gap-3">
        <h2 id="announcements-heading" className="text-2xl">
          Announcements
        </h2>
        {announcements.canPost ? (
          <form
            className="card grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              stream.run({ kind: 'announce', courseId, body: text }, () => setText(''));
            }}
          >
            <label htmlFor="announce" className="field-label">
              Post to the class
            </label>
            <textarea
              id="announce"
              className="field min-h-24"
              value={text}
              maxLength={MAX_POST_LENGTH}
              onChange={(event) => setText(event.target.value)}
              placeholder="Live class on Friday at 7 pm. Bring your workbook."
            />
            <button type="submit" className="btn btn-primary justify-self-start" disabled={stream.pending || !text.trim()}>
              Post announcement
            </button>
          </form>
        ) : null}
        {stream.error ? (
          <p role="alert" className="notice notice-error">
            {stream.error}
          </p>
        ) : null}
        {announcements.announcements.length > 0 ? (
          <ul className="grid gap-3">
            {announcements.announcements.map((announcement) => (
              <AnnouncementItem key={announcement.id} announcement={announcement} canPost={announcements.canPost} stream={stream} timeZone={timeZone} />
            ))}
          </ul>
        ) : (
          <p className="text-muted">No announcements yet.</p>
        )}
      </section>

      <section aria-labelledby="questions-heading" className="grid gap-3">
        <h2 id="questions-heading" className="text-2xl">
          Questions
        </h2>
        <p className="text-sm text-muted">Ask questions from inside a lesson so everyone knows which part you mean.</p>
        <div role="group" aria-label="Show questions" className="flex flex-wrap gap-2">
          {FILTERS.map((option) => (
            <button key={option.value} type="button" className={`btn text-sm ${filter === option.value ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={filter === option.value} onClick={() => setFilter(option.value)}>
              {option.label}
            </button>
          ))}
        </div>
        {shown.length > 0 ? (
          shown.map((question) => (
            <QuestionThread
              key={question.id}
              tenantId={tenantId}
              question={question}
              canModerate={questions.canModerate}
              path={path}
              timeZone={timeZone}
              lessonHref={question.lessonId ? `${lessonBase}/${question.lessonId}` : null}
            />
          ))
        ) : (
          <p className="text-muted">{filter === 'all' ? 'No questions yet.' : 'Nothing here.'}</p>
        )}
      </section>
    </>
  );
}
