import type { Metadata } from 'next';
import Link from 'next/link';
import { EduHeader } from '@/components/EduHeader';
import { eduApi } from '@/lib/edu-api.ts';
import { formatDuration, formatPrice } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { EnrollButton } from './EnrollButton';
import { StartExamButton } from './StartExamButton';

type Props = { params: Promise<{ slug: string; courseId: string }>; searchParams: Promise<{ locked?: string }> };

export const metadata: Metadata = { title: 'Course' };

/** Course page (FR-CATALOG-302): outcomes, curriculum, price, and enrollment or access. */
export default async function CoursePage({ params, searchParams }: Props) {
  const { slug, courseId } = await params;
  const lockedNotice = (await searchParams).locked === '1';
  const here = `/w/${slug}/courses/${courseId}`;
  const { token, workspace } = await workspaceContext(slug, here);
  const course = await load(here, () => eduApi.course(token, workspace.id, courseId));
  const { entitled } = course.access;
  // The API lists exams only to people with course access (FR-ASSESS-501).
  const exams = entitled ? await load(here, () => eduApi.exams(token, workspace.id, courseId)) : [];
  const lessons = course.curriculum.flatMap((section) => section.lessons);
  const firstLesson = lessons.find((lesson) => entitled || lesson.isPreview);

  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <main id="main" className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_20rem]">
        <div className="grid gap-8">
          <div>
            <p className="hud-label">
              <Link href={`/w/${slug}`}>// Courses</Link>
            </p>
            <h1 className="mt-2 text-4xl">{course.title}</h1>
            <p className="mt-3 text-lg text-muted">{course.summary}</p>
          </div>

          {course.outcomes.length > 0 ? (
            <section aria-labelledby="outcomes-heading" className="card">
              <h2 id="outcomes-heading" className="text-2xl">
                What you will learn
              </h2>
              <ul className="mt-3 grid list-disc gap-1 pl-6">
                {course.outcomes.map((outcome) => (
                  <li key={outcome}>{outcome}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {course.description ? <p className="whitespace-pre-line">{course.description}</p> : null}

          <section aria-labelledby="curriculum-heading">
            <h2 id="curriculum-heading" className="text-2xl">
              Curriculum
            </h2>
            <ol className="mt-4 grid gap-4">
              {course.curriculum.map((section, index) => (
                <li key={section.id} className="card">
                  <h3 className="text-xl">
                    <span className="hud-label mr-2">{String(index + 1).padStart(2, '0')}</span>
                    {section.title}
                  </h3>
                  <ul className="mt-3 grid gap-2">
                    {section.lessons.map((lesson) => {
                      const open = entitled || lesson.isPreview;
                      const duration = formatDuration(lesson.durationSec);
                      return (
                        <li key={lesson.id} className="flex flex-wrap items-baseline justify-between gap-2">
                          {open ? (
                            <Link href={`${here}/lessons/${lesson.id}`}>{lesson.title}</Link>
                          ) : (
                            <span className="text-muted">
                              <span aria-hidden="true">🔒 </span>
                              {lesson.title}
                              <span className="sr-only"> (locked)</span>
                            </span>
                          )}
                          <span className="hud-label">
                            {[lesson.isPreview && !entitled ? 'Preview' : null, lesson.isRequired ? null : 'Optional', duration]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          </section>

          {exams.length > 0 ? (
            <section aria-labelledby="exams-heading">
              <h2 id="exams-heading" className="text-2xl">
                Practice exams
              </h2>
              <p className="mt-1 text-sm text-muted">Practice scores are not official exam results.</p>
              <ul className="mt-4 grid gap-4">
                {exams.map((exam) => {
                  const questions = exam.sections.reduce((sum, section) => sum + section.questionCount, 0);
                  const attemptsLeft = exam.maxAttempts === null ? null : Math.max(exam.maxAttempts - exam.attemptsUsed, 0);
                  return (
                    <li key={exam.id} className="card grid gap-3">
                      <div>
                        <h3 className="text-xl">{exam.title}</h3>
                        <p className="hud-label mt-1">
                          // {questions} questions · {formatDuration(exam.timeLimitSec) ?? 'untimed'} · pass {exam.passPercent}%
                          {attemptsLeft === null ? '' : ` · ${attemptsLeft} of ${exam.maxAttempts} attempts left`}
                        </p>
                      </div>
                      {exam.inProgressAttemptId || attemptsLeft !== 0 ? (
                        <StartExamButton slug={slug} tenantId={workspace.id} examId={exam.id} resume={Boolean(exam.inProgressAttemptId)} />
                      ) : (
                        <p className="text-muted">You have used every attempt for this exam.</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="card h-fit lg:sticky lg:top-6" aria-label="Enrollment">
          <p className="font-display text-3xl">{formatPrice(course.price)}</p>
          <p className="hud-label mt-1">
            // {lessons.length} lessons · {course.language.toUpperCase()}
          </p>
          <div className="mt-5 grid gap-3">
            {lockedNotice && !entitled ? (
              <p role="alert" className="notice">
                That lesson is for enrolled learners. Enroll to open it.
              </p>
            ) : null}
            {entitled ? (
              <>
                <p className="notice">You are enrolled.</p>
                {firstLesson ? (
                  <Link href={`${here}/lessons/${firstLesson.id}`} className="btn btn-primary justify-center">
                    Start learning
                  </Link>
                ) : null}
              </>
            ) : (
              <>
                <EnrollButton tenantId={workspace.id} courseId={course.id} returnTo={here} free={course.price.amountMinor === 0} />
                {firstLesson ? (
                  <Link href={`${here}/lessons/${firstLesson.id}`} className="btn btn-secondary justify-center">
                    Try a free lesson
                  </Link>
                ) : null}
              </>
            )}
          </div>
        </aside>
      </main>
    </>
  );
}
