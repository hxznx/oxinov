import type { Metadata } from 'next';
import Link from 'next/link';
import { EduHeader } from '@/components/EduHeader';
import { eduApi } from '@/lib/edu-api.ts';
import { formatDate } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { courseState } from '@/lib/teach.ts';
import { CreateCourseForm } from './CreateCourseForm';

export const metadata: Metadata = { title: 'Teach' };

type Props = { params: Promise<{ slug: string }> };

/** Teacher home (FR-COURSE-201): the courses this person can edit, and a new course form. */
export default async function TeachPage({ params }: Props) {
  const { slug } = await params;
  const here = `/w/${slug}/teach`;
  const { token, workspace } = await workspaceContext(slug, here);

  if (workspace.role === 'LEARNER') {
    return (
      <>
        <EduHeader signedIn workspace={workspace} />
        <main id="main" className="mx-auto max-w-3xl px-4 py-12">
          <h1 className="text-4xl">Teach</h1>
          <p className="notice mt-6">Teacher tools are for instructors of {workspace.name}. Ask an administrator for a teacher join code.</p>
        </main>
      </>
    );
  }

  const courses = await load(here, () => eduApi.authoredCourses(token, workspace.id));
  const reviewer = workspace.role === 'ADMIN' || workspace.role === 'OWNER';
  const waiting = courses.filter((course) => course.draftStatus === 'IN_REVIEW');

  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <main id="main" className="mx-auto grid max-w-6xl gap-10 px-4 py-10">
        <div>
          <p className="hud-label">
            <Link href={`/w/${slug}`}>// {workspace.name}</Link>
          </p>
          <h1 className="mt-2 text-4xl">Teach</h1>
          <p className="mt-2 text-muted">
            {reviewer ? 'All courses in this space. Approve drafts to publish them.' : 'Your courses. An administrator reviews each version before learners see it.'}
          </p>
        </div>

        {reviewer && waiting.length > 0 ? (
          <p className="notice" role="status">
            {waiting.length} {waiting.length === 1 ? 'course is' : 'courses are'} waiting for your review.
          </p>
        ) : null}

        <section aria-labelledby="courses-heading">
          <h2 id="courses-heading" className="text-2xl">
            Courses
          </h2>
          {courses.length === 0 ? (
            <p className="card mt-4 text-muted">No courses yet. Create the first one below.</p>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <li key={course.courseId}>
                  <Link href={`${here}/${course.courseId}`} className="card card-link flex h-full flex-col">
                    <span className="text-xl">{course.title}</span>
                    <span className={`hud-label mt-2 block ${course.draftStatus === 'IN_REVIEW' ? 'text-warning' : ''}`}>// {courseState(course)}</span>
                    <span className="mt-2 text-sm text-muted">
                      {reviewer && !course.mine ? 'By another teacher · ' : ''}Updated {formatDate(course.updatedAt, workspace.timeZone)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="new-heading" className="card max-w-3xl">
          <h2 id="new-heading" className="text-2xl">
            New course
          </h2>
          <p className="mt-1 mb-4 text-muted">You can change everything later. Add chapters and lessons on the next screen.</p>
          <CreateCourseForm slug={slug} tenantId={workspace.id} />
        </section>
      </main>
    </>
  );
}
