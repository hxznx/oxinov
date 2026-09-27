import type { Metadata } from 'next';
import Link from 'next/link';
import { EduHeader } from '@/components/EduHeader';
import { eduApi } from '@/lib/edu-api.ts';
import { formatClock } from '@/lib/exam.ts';
import { formatDate } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { groupByLesson } from '@/lib/notes.ts';
import { PrintButton } from './PrintButton';

export const metadata: Metadata = { title: 'My notes' };

type Props = { params: Promise<{ slug: string; courseId: string }> };

/** Every note the learner wrote in a course, with Markdown and PDF export (FR-PLAYER-403). */
export default async function CourseNotesPage({ params }: Props) {
  const { slug, courseId } = await params;
  const courseHref = `/w/${slug}/courses/${courseId}`;
  const here = `${courseHref}/notes`;
  const { token, workspace } = await workspaceContext(slug, here);
  const [course, notes] = await Promise.all([
    load(here, () => eduApi.course(token, workspace.id, courseId)),
    load(here, () => eduApi.courseNotes(token, workspace.id, courseId)),
  ]);
  const groups = groupByLesson(notes);

  return (
    <>
      <div className="print:hidden">
        <EduHeader signedIn workspace={workspace} />
      </div>
      <main id="main" className="mx-auto grid max-w-3xl gap-6 px-4 py-10 print:max-w-none print:py-0">
        <div>
          <p className="hud-label print:hidden">
            <Link href={courseHref}>// Back to the course</Link>
          </p>
          <h1 className="mt-2 text-4xl">My notes</h1>
          <p className="mt-1 text-lg">{course.title}</p>
          <p className="mt-1 text-sm text-muted">Private to you · {notes.length} {notes.length === 1 ? 'note' : 'notes'}</p>
        </div>

        <div className="flex flex-wrap gap-3 print:hidden">
          <a href={`${here}/export`} className="btn btn-secondary" download>
            Download as Markdown
          </a>
          <PrintButton />
        </div>

        {groups.length === 0 ? (
          <p className="card text-muted">No notes yet. Open a lesson and use “My notes” below it.</p>
        ) : (
          groups.map((group) => (
            <section key={`${group.lessonId ?? 'removed'}-${group.title}`} className="card grid gap-3 print:break-inside-avoid print:border-0 print:p-0">
              <h2 className="text-2xl">
                {group.lessonId ? (
                  <Link href={`${courseHref}/lessons/${group.lessonId}`} className="no-underline">
                    {group.title}
                  </Link>
                ) : (
                  <>
                    {group.title} <span className="text-sm text-muted">(lesson removed)</span>
                  </>
                )}
              </h2>
              <ul className="grid gap-2">
                {group.notes.map((note) => (
                  <li key={note.id} className="grid gap-1 border-l-2 border-line pl-3">
                    <p className="whitespace-pre-line">
                      {note.timestampSec !== null ? <span className="hud-label mr-2">{formatClock(note.timestampSec)}</span> : null}
                      {note.body}
                    </p>
                    <p className="text-xs text-muted">{formatDate(note.updatedAt, workspace.timeZone)}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </main>
    </>
  );
}
