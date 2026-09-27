import type { Metadata } from 'next';
import Link from 'next/link';
import { EduHeader } from '@/components/EduHeader';
import { LessonMarkdown } from '@/components/LessonMarkdown';
import { EduApiError, eduApi } from '@/lib/edu-api.ts';
import { formatDuration } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { formatBytes } from '@/lib/assignment.ts';
import { resourceLabel } from '@/lib/resources.ts';
import { CompleteLessonButton } from './CompleteLessonButton';
import { LessonQuestions } from './LessonQuestions';
import { MediaPlayer } from './MediaPlayer';
import { NotesPanel } from './NotesPanel';

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
  const [course, lesson, notes] = await Promise.all([
    load(here, () => eduApi.course(token, workspace.id, courseId)),
    load(here, () => eduApi.lesson(token, workspace.id, courseId, lessonId), `${courseHref}?locked=1`),
    load(here, () => eduApi.lessonNotes(token, workspace.id, courseId, lessonId), `${courseHref}?locked=1`),
  ]);

  // Discussion is for people with course access; free previews show none (FR-COMM-701). A teacher
  // who does not teach this course gets 403, so the panel is simply left out.
  const questions =
    course.access.entitled || course.access.canAuthor
      ? await eduApi.lessonQuestions(token, workspace.id, courseId, lesson.id).catch((error: unknown) => {
          if (error instanceof EduApiError && (error.status === 403 || error.status === 404)) return null;
          throw error;
        })
      : null;

  // Completion (FR-PLAYER-402) is tracked for learners with access; a failure here only hides the control.
  const progress = course.access.entitled ? await eduApi.progress(token, workspace.id, courseId).catch(() => null) : null;
  const completed = progress?.lessons.find((item) => item.id === lesson.id)?.completed ?? false;

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

        {lesson.resources.length > 0 ? (
          <section aria-labelledby="resources-heading" className="card grid gap-3">
            <h2 id="resources-heading" className="text-2xl">
              Books and resources
            </h2>
            <ul className="grid gap-2">
              {lesson.resources.map((resource) => (
                <li key={resource.id} className="flex flex-wrap items-center justify-between gap-2 border border-line p-3">
                  <span>
                    <span className="hud-label mr-2">{resource.kind === 'LINK' ? 'Link' : resourceLabel(resource.file?.contentType ?? '')}</span>
                    {resource.title}
                    {resource.file ? <span className="ml-2 text-sm text-muted">{formatBytes(resource.file.sizeBytes)}</span> : null}
                  </span>
                  <span className="flex flex-wrap gap-2">
                    {resource.kind === 'LINK' && resource.url ? (
                      <a href={resource.url} className="btn btn-secondary text-sm" rel="noopener noreferrer" target="_blank">
                        Open link
                      </a>
                    ) : null}
                    {resource.file?.viewUrl ? (
                      <a href={resource.file.viewUrl} className="btn btn-secondary text-sm" rel="noopener noreferrer" target="_blank">
                        Read
                      </a>
                    ) : null}
                    {resource.file ? (
                      <a href={resource.file.downloadUrl} className="btn btn-secondary text-sm">
                        Download
                      </a>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <NotesPanel
          tenantId={workspace.id}
          courseId={courseId}
          lessonId={lesson.id}
          notes={notes}
          mediaKind={lesson.media ? lesson.media.kind : null}
          path={here}
          notesPage={`${courseHref}/notes`}
        />

        {questions ? (
          <LessonQuestions
            tenantId={workspace.id}
            courseId={courseId}
            lessonId={lesson.id}
            thread={questions}
            path={here}
            timeZone={workspace.timeZone}
            streamPage={`${courseHref}/stream`}
          />
        ) : null}

        {progress ? (
          <section aria-label="Lesson completion" className="flex flex-wrap items-center gap-3">
            {completed ? (
              <p className="notice" role="status">
                Lesson complete.
              </p>
            ) : lesson.kind === 'TEXT' ? (
              <CompleteLessonButton tenantId={workspace.id} courseId={courseId} lessonId={lesson.id} returnTo={here} />
            ) : (
              <p className="text-sm opacity-80">This lesson is complete once you have played at least 90% of it.</p>
            )}
            {progress.certificate ? (
              <Link href={`/w/${slug}/certificates/${progress.certificate.code}`} className="btn btn-primary">
                View certificate
              </Link>
            ) : null}
          </section>
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
