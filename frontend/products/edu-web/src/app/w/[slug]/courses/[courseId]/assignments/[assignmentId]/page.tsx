import type { Metadata } from 'next';
import Link from 'next/link';
import { EduHeader } from '@/components/EduHeader';
import { LessonMarkdown } from '@/components/LessonMarkdown';
import { RevisionList } from '@/components/RevisionList';
import { dueLabel, STATUS_LABEL, STATUS_TONE } from '@/lib/assignment.ts';
import { eduApi } from '@/lib/edu-api.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { MyWork } from './MyWork';

export const metadata: Metadata = { title: 'Assignment' };

type Props = { params: Promise<{ slug: string; courseId: string; assignmentId: string }>; searchParams: Promise<{ error?: string }> };

/** A learner's view of an assignment: instructions, their work, and every graded version (FR-ASSESS-503). */
export default async function AssignmentPage({ params, searchParams }: Props) {
  const { slug, courseId, assignmentId } = await params;
  const { error } = await searchParams;
  const courseHref = `/w/${slug}/courses/${courseId}`;
  const here = `${courseHref}/assignments/${assignmentId}`;
  const { token, workspace } = await workspaceContext(slug, here);
  const mine = await load(here, () => eduApi.mySubmission(token, workspace.id, assignmentId), `${courseHref}?locked=1`);
  const { assignment } = mine;
  const lateBlocked = assignment.dueAt !== null && new Date(assignment.dueAt) < new Date() && !assignment.allowLate;

  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <main id="main" className="mx-auto grid max-w-3xl gap-6 px-4 py-10">
        <div>
          <p className="hud-label">
            <Link href={courseHref}>// Back to the course</Link>
          </p>
          <h1 className="mt-2 text-4xl">{assignment.title}</h1>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <span className={STATUS_TONE[mine.status]}>{STATUS_LABEL[mine.status]}</span>
            <span className="text-muted">{dueLabel(assignment.dueAt, workspace.timeZone)}</span>
            {assignment.dueAt && assignment.allowLate ? <span className="text-muted">Late work accepted</span> : null}
            {assignment.maxPoints ? <span className="text-muted">{assignment.maxPoints} points</span> : null}
          </p>
        </div>

        {error ? (
          <p role="alert" className="notice notice-error">
            {error}
          </p>
        ) : null}

        {assignment.instructions.trim() ? (
          <article className="prose-ox card" aria-label="Instructions">
            <LessonMarkdown>{assignment.instructions}</LessonMarkdown>
          </article>
        ) : null}

        <section aria-labelledby="work-heading" className="grid gap-3">
          <h2 id="work-heading" className="text-2xl">
            Your work
          </h2>
          {mine.canEdit && !lateBlocked ? (
            <>
              {mine.status === 'REVISION_REQUESTED' ? <p className="notice">Your teacher asked for changes. Update your work and submit it again.</p> : null}
              <MyWork ids={{ slug, tenantId: workspace.id, courseId, assignmentId }} mine={mine} />
            </>
          ) : (
            <p className="notice">
              {assignment.status === 'CLOSED'
                ? 'This assignment is closed.'
                : lateBlocked && mine.canEdit
                  ? 'The deadline has passed and this assignment does not accept late work.'
                  : mine.status === 'SUBMITTED'
                    ? 'Submitted. You can change your work if the teacher asks for a revision.'
                    : 'This assignment has been graded.'}
            </p>
          )}
        </section>

        <section aria-labelledby="history-heading" className="grid gap-3">
          <h2 id="history-heading" className="text-2xl">
            Submitted versions
          </h2>
          <RevisionList revisions={mine.revisions} timeZone={workspace.timeZone} maxPoints={assignment.maxPoints} />
        </section>
      </main>
    </>
  );
}
