import type { Metadata } from 'next';
import Link from 'next/link';
import { EduHeader } from '@/components/EduHeader';
import { eduApi } from '@/lib/edu-api.ts';
import { formatPrice } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string }> };

export const metadata: Metadata = { title: 'Courses' };

/** Workspace home: the learner's courses (FR-ANALYTICS-801) and the course catalogue (FR-CATALOG-301). */
export default async function WorkspacePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const q = (await searchParams).q?.trim().slice(0, 100) || undefined;
  const here = `/w/${slug}`;
  const { token, workspace } = await workspaceContext(slug, here);
  const [courses, enrollments] = await Promise.all([
    load(here, () => eduApi.courses(token, workspace.id, q)),
    load(here, () => eduApi.myEnrollments(token, workspace.id)),
  ]);
  const active = enrollments.filter((enrollment) => enrollment.hasAccess);

  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <main id="main" className="mx-auto grid max-w-6xl gap-10 px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="hud-label">// {workspace.name}</p>
            <h1 className="mt-2 text-4xl">Learn</h1>
          </div>
          {workspace.role === 'ADMIN' || workspace.role === 'OWNER' ? (
            <Link href={`${here}/people`} className="btn btn-secondary">
              People and join codes
            </Link>
          ) : null}
        </div>

        {active.length > 0 ? (
          <section aria-labelledby="mine-heading">
            <h2 id="mine-heading" className="text-2xl">
              Continue learning
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((enrollment) => (
                <li key={enrollment.id}>
                  <Link href={`${here}/courses/${enrollment.courseId}`} className="card card-link block h-full">
                    <span className="text-xl">{enrollment.courseTitle}</span>
                    <span className="hud-label mt-1 block">// Enrolled</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="catalog-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="catalog-heading" className="text-2xl">
              Courses
            </h2>
            <form role="search" className="flex gap-2" action={here}>
              <label htmlFor="q" className="sr-only">
                Search courses
              </label>
              <input id="q" name="q" type="search" className="field" placeholder="Search courses" defaultValue={q} maxLength={100} />
              <button type="submit" className="btn btn-secondary">
                Search
              </button>
            </form>
          </div>

          {courses.length === 0 ? (
            <p className="card mt-4 text-muted">
              {q ? `No courses match “${q}”.` : 'No courses are published in this space yet.'}{' '}
              {q ? <Link href={here}>Show all courses</Link> : null}
            </p>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <li key={course.id}>
                  <Link href={`${here}/courses/${course.id}`} className="card card-link flex h-full flex-col">
                    <span className="text-xl">{course.title}</span>
                    <span className="mt-2 flex-1 text-muted">{course.summary}</span>
                    <span className="hud-label mt-3 block">// {formatPrice(course.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
