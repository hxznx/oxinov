import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EduHeader } from '@/components/EduHeader';
import { RevisionList } from '@/components/RevisionList';
import { STATUS_LABEL, STATUS_TONE } from '@/lib/assignment.ts';
import { eduApi } from '@/lib/edu-api.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { GradeForm } from './GradeForm';

export const metadata: Metadata = { title: 'Grade submission' };

type Props = { params: Promise<{ slug: string; courseId: string; assignmentId: string; submissionId: string }> };

/** Grading one learner's work: every version, and the decision on the latest (FR-ASSESS-503). */
export default async function GradeSubmissionPage({ params }: Props) {
  const { slug, courseId, assignmentId, submissionId } = await params;
  const assignmentHref = `/w/${slug}/teach/${courseId}/assignments/${assignmentId}`;
  const here = `${assignmentHref}/submissions/${submissionId}`;
  const { token, workspace } = await workspaceContext(slug, here);
  if (workspace.role === 'LEARNER') notFound();
  const submission = await load(here, () => eduApi.submission(token, workspace.id, submissionId));
  if (submission.assignment.id !== assignmentId) notFound();

  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <main id="main" className="mx-auto grid max-w-3xl gap-6 px-4 py-10">
        <div>
          <p className="hud-label">
            <Link href={assignmentHref}>// {submission.assignment.title}</Link>
          </p>
          <h1 className="mt-2 text-4xl">{submission.learner.name ?? submission.learner.email ?? 'Learner'}</h1>
          <p className={`mt-2 ${STATUS_TONE[submission.status]}`}>{submission.status === 'SUBMITTED' ? 'Waiting for your decision' : STATUS_LABEL[submission.status]}</p>
        </div>

        {submission.status === 'SUBMITTED' ? (
          <section aria-labelledby="grade-heading" className="card grid gap-4">
            <h2 id="grade-heading" className="text-2xl">
              Grade version {submission.revisions[0]?.revision}
            </h2>
            <GradeForm hidden={{ slug, tenantId: workspace.id, courseId, assignmentId, submissionId }} maxPoints={submission.assignment.maxPoints} />
          </section>
        ) : null}

        <section aria-labelledby="versions-heading" className="grid gap-3">
          <h2 id="versions-heading" className="text-2xl">
            Versions
          </h2>
          <RevisionList revisions={submission.revisions} timeZone={workspace.timeZone} maxPoints={submission.assignment.maxPoints} />
        </section>
      </main>
    </>
  );
}
