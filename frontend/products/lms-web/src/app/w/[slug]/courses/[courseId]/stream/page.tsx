import type { Metadata } from 'next';
import Link from 'next/link';
import { EduHeader } from '@/components/EduHeader';
import { eduApi } from '@/lib/edu-api.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { StreamBoard } from './StreamBoard';

type Props = { params: Promise<{ slug: string; courseId: string }> };

export const metadata: Metadata = { title: 'Class stream' };

/** The class stream (FR-COMM-701/702): teacher announcements and every lesson question in the course. */
export default async function StreamPage({ params }: Props) {
  const { slug, courseId } = await params;
  const courseHref = `/w/${slug}/courses/${courseId}`;
  const here = `${courseHref}/stream`;
  const { token, workspace } = await workspaceContext(slug, here);
  const [course, announcements, questions] = await Promise.all([
    load(here, () => eduApi.course(token, workspace.id, courseId)),
    load(here, () => eduApi.announcements(token, workspace.id, courseId), `${courseHref}?locked=1`),
    load(here, () => eduApi.courseQuestions(token, workspace.id, courseId), `${courseHref}?locked=1`),
  ]);

  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <main id="main" className="mx-auto grid max-w-3xl gap-6 px-4 py-10">
        <div>
          <p className="hud-label">
            <Link href={courseHref}>// {course.title}</Link>
          </p>
          <h1 className="mt-2 text-4xl">Class stream</h1>
          <p className="mt-2 text-muted">Announcements from your teachers and questions from the class.</p>
        </div>
        <StreamBoard
          tenantId={workspace.id}
          courseId={courseId}
          announcements={announcements}
          questions={questions}
          path={here}
          timeZone={workspace.timeZone}
          lessonBase={`${courseHref}/lessons`}
        />
      </main>
    </>
  );
}
