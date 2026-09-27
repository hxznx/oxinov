import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { assignmentStatus } from '@/app/assignment-actions';
import { EduHeader } from '@/components/EduHeader';
import { dueLabel, STATUS_LABEL, STATUS_TONE } from '@/lib/assignment.ts';
import { eduApi } from '@/lib/edu-api.ts';
import { formatDate } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { AssignmentSettingsForm } from './AssignmentSettingsForm';

export const metadata: Metadata = { title: 'Assignment' };

type Props = { params: Promise<{ slug: string; courseId: string; assignmentId: string }>; searchParams: Promise<{ error?: string }> };

/** Teacher view of an assignment: settings, opening and closing, and learners' submissions (FR-ASSESS-503). */
export default async function TeachAssignmentPage({ params, searchParams }: Props) {
  const { slug, courseId, assignmentId } = await params;
  const { error } = await searchParams;
  const editor = `/w/${slug}/teach/${courseId}`;
  const here = `${editor}/assignments/${assignmentId}`;
  const { token, workspace } = await workspaceContext(slug, here);
  if (workspace.role === 'LEARNER') notFound();
  const [assignments, submissions] = await Promise.all([
    load(here, () => eduApi.manageAssignments(token, workspace.id, courseId)),
    load(here, () => eduApi.assignmentSubmissions(token, workspace.id, assignmentId)),
  ]);
  const assignment = assignments.find((item) => item.id === assignmentId);
  if (!assignment) notFound();
  const hidden = { slug, tenantId: workspace.id, courseId, assignmentId };
  const Step = ({ step, label, primary = false }: { step: 'publish' | 'close'; label: string; primary?: boolean }) => (
    <form action={assignmentStatus}>
      {Object.entries({ ...hidden, step }).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" className={`btn ${primary ? 'btn-primary' : 'btn-secondary'}`}>
        {label}
      </button>
    </form>
  );

  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <main id="main" className="mx-auto grid max-w-5xl gap-8 px-4 py-10">
        <div>
          <p className="hud-label">
            <Link href={editor}>// Back to the course</Link>
          </p>
          <h1 className="mt-2 text-4xl">{assignment.title}</h1>
          <p className="hud-label mt-2">
            // {assignment.status === 'DRAFT' ? 'Draft, hidden from learners' : assignment.status === 'PUBLISHED' ? 'Open' : 'Closed'} · {dueLabel(assignment.dueAt, workspace.timeZone)}
          </p>
        </div>

        {error ? (
          <p role="alert" className="notice notice-error">
            {error}
          </p>
        ) : null}

        <section aria-labelledby="status-heading" className="card grid gap-3">
          <h2 id="status-heading" className="text-2xl">
            Status
          </h2>
          <p className="text-muted">
            {assignment.status === 'DRAFT'
              ? 'Learners enrolled in the course see the assignment once you open it.'
              : assignment.status === 'PUBLISHED'
                ? 'Open: learners can work on it and hand it in.'
                : 'Closed: learners can read it and their feedback, but cannot hand in work.'}
          </p>
          <div className="flex flex-wrap gap-3">
            {assignment.status !== 'PUBLISHED' ? <Step step="publish" label={assignment.status === 'CLOSED' ? 'Reopen' : 'Open for learners'} primary /> : null}
            {assignment.status === 'PUBLISHED' ? <Step step="close" label="Close" /> : null}
          </div>
        </section>

        <section aria-labelledby="submissions-heading" className="grid gap-3">
          <h2 id="submissions-heading" className="text-2xl">
            Submissions <span className="text-muted">({submissions.length})</span>
          </h2>
          {submissions.length === 0 ? (
            <p className="card text-muted">Nothing handed in yet. Drafts stay private to each learner.</p>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left">
                <thead>
                  <tr className="hud-label">
                    <th className="py-2 font-normal">Learner</th>
                    <th className="py-2 font-normal">Status</th>
                    <th className="py-2 font-normal">Versions</th>
                    <th className="py-2 font-normal">Last handed in</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="border-t border-line">
                      <td className="py-2">
                        <Link href={`${here}/submissions/${submission.id}`}>{submission.learner.name ?? submission.learner.email ?? 'Learner'}</Link>
                      </td>
                      <td className={`py-2 ${STATUS_TONE[submission.status]}`}>
                        {submission.status === 'SUBMITTED' ? 'To grade' : STATUS_LABEL[submission.status]}
                        {submission.late ? <span className="text-muted"> · late</span> : null}
                      </td>
                      <td className="py-2">{submission.revisions}</td>
                      <td className="py-2">{submission.lastSubmittedAt ? formatDate(submission.lastSubmittedAt, workspace.timeZone) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="settings-heading" className="card grid gap-4">
          <h2 id="settings-heading" className="text-2xl">
            Settings
          </h2>
          <AssignmentSettingsForm hidden={hidden} assignment={assignment} />
        </section>
      </main>
    </>
  );
}
