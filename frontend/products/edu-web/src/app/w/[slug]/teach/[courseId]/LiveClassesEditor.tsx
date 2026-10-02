'use client';

import { useActionState } from 'react';
import type { FormState } from '@/app/actions';
import { cancelLiveClass, scheduleLiveClass } from '@/app/live-actions';
import type { LiveSession } from '@/lib/edu-api.ts';
import { LIVE_PROVIDER_LABELS, formatLiveTime, liveState } from '@/lib/content.ts';

/** Teachers schedule live classes as links with a time, free or for subscribers (ADR-028 point 8). */
export function LiveClassesEditor({ ids, sessions }: { ids: { slug: string; tenantId: string; courseId: string }; sessions: LiveSession[] }) {
  const [state, action, pending] = useActionState<FormState & { saved?: boolean }, FormData>(async (previous, form) => {
    const result = await scheduleLiveClass(previous, form);
    return { ...result, saved: !result.error };
  }, {});
  const hidden = Object.entries(ids).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />);

  return (
    <section aria-labelledby="live-heading" className="card grid gap-4">
      <div>
        <h2 id="live-heading" className="text-2xl">
          Live classes
        </h2>
        <p className="mt-1 text-sm text-muted">Google Meet, Zoom, or Microsoft Teams. Learners see the time; the link appears only for people allowed to join.</p>
      </div>
      {sessions.length === 0 ? (
        <p className="text-sm text-muted">No live classes scheduled.</p>
      ) : (
        <ul className="grid gap-2">
          {sessions.map((session) => {
            const status = liveState(session);
            return (
              <li key={session.id} className="flex flex-wrap items-center justify-between gap-2 border border-line p-3">
                <span className="grid">
                  <span className="font-semibold">
                    {session.title}
                    {session.cancelled ? <span className="hud-label ml-2 text-danger">// Cancelled</span> : null}
                  </span>
                  <span className="text-sm text-muted">
                    {formatLiveTime(session.startsAt)} · {session.durationMin} min · {LIVE_PROVIDER_LABELS[session.provider]} · {session.visibility === 'FREE' ? 'Free' : 'Subscribers'}
                  </span>
                </span>
                {status === 'cancelled' || status === 'ended' ? null : (
                  <form action={cancelLiveClass}>
                    {hidden}
                    <input type="hidden" name="sessionId" value={session.id} />
                    <button type="submit" className="btn btn-secondary text-sm">
                      Cancel class
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <form action={action} className="grid gap-3 border-t border-line pt-4">
        {hidden}
        <h3 className="text-xl">Schedule a class</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="field-label">Title</span>
            <input name="title" className="field" maxLength={200} required placeholder="Weekly speaking practice" />
          </label>
          <label className="grid gap-1">
            <span className="field-label">Starts (Nepal time)</span>
            <input name="startsAt" type="datetime-local" className="field" required />
          </label>
          <label className="grid gap-1">
            <span className="field-label">Length (minutes)</span>
            <input name="durationMin" type="number" min={5} max={600} defaultValue={60} className="field" required />
          </label>
          <label className="grid gap-1">
            <span className="field-label">Who can join</span>
            <select name="visibility" className="field" defaultValue="SUBSCRIBERS">
              <option value="SUBSCRIBERS">Subscribers only</option>
              <option value="FREE">Free: anyone signed in</option>
            </select>
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className="field-label">Meeting link (https)</span>
            <input name="joinUrl" type="url" inputMode="url" className="field" maxLength={500} required placeholder="https://meet.google.com/abc-defg-hij" />
          </label>
        </div>
        {state.error ? (
          <p role="alert" className="notice notice-error">
            {state.error}
          </p>
        ) : state.saved ? (
          <p role="status" className="notice">
            Class scheduled.
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary justify-self-start" disabled={pending}>
          {pending ? 'Saving…' : 'Schedule class'}
        </button>
      </form>
    </section>
  );
}
