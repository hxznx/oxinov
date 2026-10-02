import type { LiveSession } from '@/lib/edu-api.ts';
import { LIVE_PROVIDER_LABELS, formatLiveTime, liveState } from '@/lib/content.ts';

const STATE_LABEL = { cancelled: 'Cancelled', ended: 'Ended', live: 'Live now', soon: 'Starting soon', upcoming: 'Upcoming' } as const;

/**
 * Live classes for a learner (ADR-028 point 8). Join opens 15 minutes before the start; subscribers-only
 * classes show the time but no link until the learner has access.
 */
export function LiveClassList({ sessions }: { sessions: LiveSession[] }) {
  if (sessions.length === 0) return null;
  return (
    <section aria-labelledby="live-classes-heading" className="card grid gap-3">
      <h2 id="live-classes-heading" className="hud-label" style={{ color: 'var(--ox-color-highlight)' }}>
        // Live classes
      </h2>
      <ul className="grid gap-3">
        {sessions.map((session) => {
          const state = liveState(session);
          const open = (state === 'live' || state === 'soon') && session.joinUrl;
          return (
            <li key={session.id} className="grid gap-1 border-b border-dashed border-line pb-3 last:border-b-0 last:pb-0">
              <span className="font-studio text-lg font-bold">{session.title}</span>
              <span className="text-sm text-muted">
                {formatLiveTime(session.startsAt)} · {session.durationMin} min · {LIVE_PROVIDER_LABELS[session.provider]}
              </span>
              <span className="flex flex-wrap items-center gap-3">
                <span className={`studio-status ${state === 'live' ? 'tone-success' : state === 'cancelled' ? 'tone-danger' : 'tone-muted'}`}>
                  {STATE_LABEL[state]} · {session.visibility === 'FREE' ? 'Free' : 'Subscribers'}
                </span>
                {open ? (
                  <a href={session.joinUrl!} target="_blank" rel="noreferrer noopener" className="btn btn-primary text-sm">
                    Join class
                  </a>
                ) : session.locked && state !== 'ended' && state !== 'cancelled' ? (
                  <span className="text-sm text-muted">Choose a plan to join</span>
                ) : session.joinUrl && state === 'upcoming' ? (
                  <span className="text-sm text-muted">The join button appears 15 minutes before the start</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
