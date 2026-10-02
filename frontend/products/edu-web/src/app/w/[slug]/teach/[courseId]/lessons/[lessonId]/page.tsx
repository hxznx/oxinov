import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { EduHeader } from '@/components/EduHeader';
import { eduApi } from '@/lib/edu-api.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { reusableUploads } from '@/lib/media-library.ts';
import { ExternalLinkForm } from './ExternalLinkForm';
import { LessonEditor } from './LessonEditor';
import { LibraryPicker } from './LibraryPicker';
import { MediaUploader } from './MediaUploader';
import { ResourcesEditor } from './ResourcesEditor';

export const metadata: Metadata = { title: 'Edit lesson' };

type Props = { params: Promise<{ slug: string; courseId: string; lessonId: string }> };

/**
 * Lesson editor for a draft: text, for video and audio lessons the media file (FR-COURSE-202/205), and for
 * video and document lessons a YouTube or Google Drive link (ADR-028 point 5), or an earlier upload from the
 * media library (FR-COURSE-210).
 */
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
  const media = lesson.kind === 'VIDEO' || lesson.kind === 'AUDIO' ? lesson.kind : null;
  // The library is a convenience here: if it cannot load, the editor still works without it.
  const library = media ? await eduApi.mediaLibrary(token, workspace.id).catch(() => []) : [];
  const hidden = { slug, tenantId: workspace.id, courseId, lessonId };

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
        {media ? <MediaUploader kind={media} hidden={hidden} current={lesson.media} /> : null}
        {media ? <LibraryPicker kind={media} hidden={hidden} uploads={reusableUploads(library, media)} currentId={lesson.media?.id ?? null} /> : null}
        {lesson.kind === 'VIDEO' || lesson.kind === 'DOCUMENT' ? <ExternalLinkForm hidden={hidden} lesson={lesson} /> : null}
        <LessonEditor hidden={hidden} lesson={lesson} />
        <ResourcesEditor ids={{ slug, tenantId: workspace.id, courseId, lessonId }} resources={lesson.resources} />
        <p>
          <Link href={editor}>← Back to the course</Link>
        </p>
      </main>
    </>
  );
}
