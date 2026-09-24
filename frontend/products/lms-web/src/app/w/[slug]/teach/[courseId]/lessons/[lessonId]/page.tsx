import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { EduHeader } from '@/components/EduHeader';
import { eduApi } from '@/lib/edu-api.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { LessonEditor } from './LessonEditor';

export const metadata: Metadata = { title: 'Edit lesson' };

type Props = { params: Promise<{ slug: string; courseId: string; lessonId: string }> };

/** Lesson editor for a draft (FR-COURSE-202, text lessons). */
export default async function LessonEditorPage({ params }: Props) {
  const { slug, courseId, lessonId } = await params;
  const editor = `/w/${slug}/teach/${courseId}`;
  const here = `${editor}/lessons/${lessonId}`;
  const { token, workspace } = await workspaceContext(slug, here);
  if (workspace.role === 'LEARNER') notFound();

  const draft = await load(here, () => eduApi.draft(token, workspace.id, courseId));
  if (draft.status !== 'DRAFT') redirect(editor);
  const section = draft.sections.find((item) => item.lessons.some((lesson) => lesson.id === lessonId));
  const lesson = section?.lessons.find((item) => item.id === lessonId);
  if (!section || !lesson) notFound();

  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <main id="main" className="mx-auto grid max-w-4xl gap-6 px-4 py-10">
        <div>
          <p className="hud-label">
            <Link href={editor}>// {draft.title}</Link> / {section.title}
          </p>
          <h1 className="mt-2 text-4xl">Edit lesson</h1>
        </div>
        <LessonEditor hidden={{ slug, tenantId: workspace.id, courseId, lessonId }} lesson={lesson} />
        <p>
          <Link href={editor}>← Back to the course</Link>
        </p>
      </main>
    </>
  );
}
