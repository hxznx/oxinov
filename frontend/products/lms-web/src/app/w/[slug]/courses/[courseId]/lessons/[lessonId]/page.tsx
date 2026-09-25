import type { Metadata } from 'next';
import Link from 'next/link';
import { EduHeader } from '@/components/EduHeader';
import { LessonMarkdown } from '@/components/LessonMarkdown';
import { eduApi } from '@/lib/edu-api.ts';
import { formatDuration } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { MediaPlayer } from './MediaPlayer';

type Props = { params: Promise<{ slug: string; courseId: string; lessonId: string }> };

export const metadata: Metadata = { title: 'Lesson' };

/**
 * Lesson reader (FR-PLAYER-401 text lessons). The API enforces entitlement and preview rules; lesson text is
 * rendered by LessonMarkdown (no raw HTML, unsafe link protocols dropped).
 */
export default async function LessonPage({ params }: Props) {
  const { slug, courseId, lessonId } = await params;
  const courseHref = `/w/${slug}/courses/${courseId}`;
  const here = `${courseHref}/lessons/${lessonId}`;
  const { token, workspace } = await workspaceContext(slug, here);
  const [course, lesson] = await Promise.all([
    load(here, () => eduApi.course(token, workspace.id, courseId)),
    load(here, () => eduApi.lesson(token, workspace.id, courseId, lessonId), `${courseHref}?locked=1`),
  ]);

  const open = course.curriculum.flatMap((section) => section.lessons).filter((item) => course.access.entitled || item.isPreview);
  const index = open.findIndex((item) => item.id === lesson.id);
  const previous = index > 0 ? open[index - 1] : undefined;
  const next = index >= 0 && index < open.length - 1 ? open[index + 1] : undefined;
  const duration = formatDuration(lesson.durationSec);

  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <main id="main" className="mx-auto grid max-w-3xl gap-6 px-4 py-10">
        <div>
          <p className="hud-label">
            <Link href={courseHref}>// {course.title}</Link>
          </p>
          <h1 className="mt-2 text-4xl">{lesson.title}</h1>
          {duration || (lesson.isPreview && !course.access.entitled) ? (
            <p className="hud-label mt-2">
              {[lesson.isPreview && !course.access.entitled ? 'Free preview' : null, duration].filter(Boolean).join(' · ')}
            </p>
          ) : null}
        </div>

        {lesson.media ? <MediaPlayer media={lesson.media} tenantId={workspace.id} title={lesson.title} /> : null}
        {lesson.kind !== 'TEXT' && !lesson.media ? (
          <p className="notice">This {lesson.kind === 'VIDEO' ? 'video' : 'recording'} is not available right now. The transcript is below.</p>
        ) : null}

        {lesson.bodyMarkdown.trim() ? (
          <article className="prose-ox card" aria-label={lesson.kind === 'TEXT' ? undefined : 'Transcript'}>
            {lesson.kind === 'TEXT' ? null : <p className="hud-label">// Transcript</p>}
            <LessonMarkdown>{lesson.bodyMarkdown}</LessonMarkdown>
          </article>
        ) : null}

        <nav aria-label="Lessons" className="flex flex-wrap justify-between gap-3">
          {previous ? (
            <Link href={`${courseHref}/lessons/${previous.id}`} className="btn btn-secondary">
              ← {previous.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`${courseHref}/lessons/${next.id}`} className="btn btn-primary">
              {next.title} →
            </Link>
          ) : (
            <Link href={courseHref} className="btn btn-secondary">
              Back to course
            </Link>
          )}
        </nav>

        {!course.access.entitled ? (
          <p className="notice">
            This is a free preview. <Link href={courseHref}>Enroll in the course</Link> to open every lesson.
          </p>
        ) : null}
      </main>
    </>
  );
}
