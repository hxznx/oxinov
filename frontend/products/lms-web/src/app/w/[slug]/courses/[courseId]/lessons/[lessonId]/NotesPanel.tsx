'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { addNote, editNote, removeNote } from '@/app/note-actions';
import type { Note } from '@/lib/edu-api.ts';
import { formatClock } from '@/lib/exam.ts';

type Props = { tenantId: string; courseId: string; lessonId: string; notes: Note[]; mediaKind: 'VIDEO' | 'AUDIO' | null; path: string; notesPage: string };

/** The lesson's media element, if any (the player renders one <video> or <audio>). */
const media = () => document.querySelector<HTMLMediaElement>('main video, main audio');

/** Private notes on this lesson (FR-PLAYER-403): only the learner sees them. */
export function NotesPanel({ tenantId, courseId, lessonId, notes, mediaKind, path, notesPage }: Props) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [atMoment, setAtMoment] = useState(mediaKind !== null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (work: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) =>
    start(async () => {
      const result = await work();
      if (!result.ok) return setError(result.error ?? 'Something went wrong.');
      setError(null);
      after?.();
      router.refresh();
    });

  return (
    <section aria-labelledby="notes-heading" className="card grid gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="notes-heading" className="text-2xl">
          My notes
        </h2>
        <a href={notesPage} className="text-sm">
          All notes for this course
        </a>
      </div>
      <p className="text-sm text-muted">Only you can see your notes.</p>

      {notes.length > 0 ? (
        <ul className="grid gap-3">
          {notes.map((note) => (
            <li key={note.id} className="border border-line p-3">
              {editing === note.id ? (
                <div className="grid gap-2">
                  <label htmlFor={`edit-${note.id}`} className="sr-only">
                    Edit note
                  </label>
                  <textarea id={`edit-${note.id}`} className="field min-h-20" value={draft} maxLength={5000} onChange={(event) => setDraft(event.target.value)} />
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-primary text-sm" disabled={pending} onClick={() => run(() => editNote({ tenantId, noteId: note.id, body: draft, path }), () => setEditing(null))}>
                      Save
                    </button>
                    <button type="button" className="btn btn-secondary text-sm" onClick={() => setEditing(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="whitespace-pre-line">
                    {note.timestampSec !== null ? (
                      <button
                        type="button"
                        className="hud-label mr-2 underline"
                        aria-label={`Play from ${formatClock(note.timestampSec)}`}
                        onClick={() => {
                          const element = media();
                          if (element) {
                            element.currentTime = note.timestampSec ?? 0;
                            void element.play().catch(() => undefined);
                            element.scrollIntoView({ block: 'center', behavior: 'smooth' });
                          }
                        }}
                      >
                        {formatClock(note.timestampSec)}
                      </button>
                    ) : null}
                    {note.body}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary text-sm"
                      onClick={() => {
                        setEditing(note.id);
                        setDraft(note.body);
                      }}
                    >
                      Edit
                    </button>
                    <button type="button" className="btn btn-secondary text-sm" disabled={pending} onClick={() => run(() => removeNote({ tenantId, noteId: note.id, path }))}>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <form
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const timestampSec = atMoment ? (media()?.currentTime ?? null) : null;
          run(() => addNote({ tenantId, courseId, lessonId, body: text, timestampSec, path }), () => setText(''));
        }}
      >
        <label htmlFor="new-note" className="field-label">
          New note
        </label>
        <textarea id="new-note" className="field min-h-20" value={text} maxLength={5000} onChange={(event) => setText(event.target.value)} placeholder="Write what you want to remember…" />
        {mediaKind ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={atMoment} onChange={(event) => setAtMoment(event.target.checked)} />
            Link the note to the current moment in the {mediaKind === 'AUDIO' ? 'recording' : 'video'}
          </label>
        ) : null}
        {error ? (
          <p role="alert" className="notice notice-error">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary justify-self-start" disabled={pending || !text.trim()}>
          {pending ? 'Saving…' : 'Add note'}
        </button>
      </form>
    </section>
  );
}
