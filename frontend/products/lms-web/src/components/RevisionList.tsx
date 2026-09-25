import { formatBytes, STATUS_LABEL, STATUS_TONE } from '@/lib/assignment.ts';
import type { Revision } from '@/lib/edu-api.ts';
import { formatDate } from '@/lib/format.ts';

/** Submitted versions, newest first, each with the teacher's decision and feedback (FR-ASSESS-503). */
export function RevisionList({ revisions, timeZone, maxPoints }: { revisions: Revision[]; timeZone: string; maxPoints: number | null }) {
  if (revisions.length === 0) return <p className="text-muted">Nothing submitted yet.</p>;
  return (
    <ol className="grid gap-4">
      {revisions.map((revision) => (
        <li key={revision.revision} className="card grid gap-2">
          <p className="hud-label">
            Version {revision.revision} · submitted {formatDate(revision.submittedAt, timeZone)}
            {revision.late ? ' · late' : ''}
          </p>
          {revision.text ? <p className="whitespace-pre-line">{revision.text}</p> : null}
          {revision.url ? (
            <p>
              Link:{' '}
              <a href={revision.url} rel="noopener noreferrer nofollow" target="_blank">
                {revision.url}
              </a>
            </p>
          ) : null}
          {revision.file ? (
            <p>
              File:{' '}
              {revision.file.downloadUrl ? <a href={revision.file.downloadUrl}>{revision.file.name}</a> : revision.file.name} · {formatBytes(revision.file.sizeBytes)}
            </p>
          ) : null}
          {revision.outcome ? (
            <div className="notice grid gap-1">
              <p className={`font-semibold ${STATUS_TONE[revision.outcome]}`}>
                {STATUS_LABEL[revision.outcome]}
                {revision.score !== null ? ` · ${revision.score}${maxPoints ? ` / ${maxPoints}` : ''} points` : ''}
              </p>
              {revision.feedback ? <p className="whitespace-pre-line">{revision.feedback}</p> : null}
            </div>
          ) : (
            <p className="text-muted">Not graded yet.</p>
          )}
        </li>
      ))}
    </ol>
  );
}
