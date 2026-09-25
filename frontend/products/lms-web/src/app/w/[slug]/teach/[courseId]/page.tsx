import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  addLesson,
  addSection,
  approveDraft,
  deleteLesson,
  deleteSection,
  move,
  renameSection,
  startEditing,
  submitForReview,
  withdrawFromReview,
} from '@/app/teach-actions';
import { createQuiz } from '@/app/quiz-actions';
import { EduHeader } from '@/components/EduHeader';
import { EduApiError, eduApi, type Draft, type Quiz } from '@/lib/edu-api.ts';
import { formatDuration } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { courseState } from '@/lib/teach.ts';
import { DetailsForm } from './DetailsForm';
import { RejectForm } from './RejectForm';

export const metadata: Metadata = { title: 'Edit course' };

type Props = { params: Promise<{ slug: string; courseId: string }>; searchParams: Promise<{ error?: string; published?: string }> };

/** Course editor (FR-COURSE-201/203): details, chapters, lessons, and the review workflow. */
export default async function CourseEditorPage({ params, searchParams }: Props) {
  const { slug, courseId } = await params;
  const { error, published } = await searchParams;
  const here = `/w/${slug}/teach/${courseId}`;
  const { token, workspace } = await workspaceContext(slug, here);
  if (workspace.role === 'LEARNER') notFound();

  const courses = await load(here, () => eduApi.authoredCourses(token, workspace.id));
  const summary = courses.find((course) => course.courseId === courseId);
  if (!summary) notFound();

  let draft: Draft | null = null;
  try {
    draft = await eduApi.draft(token, workspace.id, courseId);
  } catch (caught) {
    if (!(caught instanceof EduApiError && caught.status === 404)) throw caught;
  }

  const quizzes = await load(here, () => eduApi.quizzes(token, workspace.id, courseId));
  const hidden = { slug, tenantId: workspace.id, courseId };
  const Hidden = ({ extra = {} }: { extra?: Record<string, string> }) => (
    <>
      {Object.entries({ ...hidden, ...extra }).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
    </>
  );

  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <main id="main" className="mx-auto grid max-w-5xl gap-8 px-4 py-10">
        <div>
          <p className="hud-label">
            <Link href={`/w/${slug}/teach`}>// Teach</Link>
          </p>
          <h1 className="mt-2 text-4xl">{draft?.title ?? summary.title}</h1>
          <p className="hud-label mt-2">
            // {courseState(summary)}
            {draft ? ` · version ${draft.version}` : ''}
          </p>
        </div>

        {error ? (
          <p role="alert" className="notice notice-error">
            {error}
          </p>
        ) : null}
        {published ? (
          <p role="status" className="notice">
            Published. Learners now see this version.{' '}
            <Link href={`/w/${slug}/courses/${courseId}`}>View it as a learner</Link>
          </p>
        ) : null}

        {!draft ? (
          <section className="card grid gap-3">
            <p>
              {summary.courseStatus === 'PUBLISHED'
                ? 'This course is published. Editing creates a new draft; learners keep seeing the current version until the draft is approved.'
                : 'This course has no open draft.'}
            </p>
            <form action={startEditing}>
              <Hidden />
              <button type="submit" className="btn btn-primary">
                Edit course
              </button>
            </form>
          </section>
        ) : (
          <Editor draft={draft} slug={slug} hidden={hidden} Hidden={Hidden} />
        )}

        <Quizzes quizzes={quizzes} editor={here} Hidden={Hidden} />
      </main>
    </>
  );
}

function Editor({
  draft,
  slug,
  hidden,
  Hidden,
}: {
  draft: Draft;
  slug: string;
  hidden: { slug: string; tenantId: string; courseId: string };
  Hidden: (props: { extra?: Record<string, string> }) => React.JSX.Element;
}) {
  const locked = draft.status === 'IN_REVIEW';
  const editor = `/w/${slug}/teach/${draft.courseId}`;
  const lessonCount = draft.sections.reduce((sum, section) => sum + section.lessons.length, 0);

  return (
    <>
      <section aria-labelledby="review-heading" className="card grid gap-4">
        <h2 id="review-heading" className="text-2xl">
          Review
        </h2>
        {draft.reviewFeedback ? (
          <div className="notice notice-error">
            <p className="font-semibold">Feedback from the reviewer</p>
            <p className="whitespace-pre-line">{draft.reviewFeedback}</p>
          </div>
        ) : null}
        {locked ? (
          <p>This draft is waiting for review. Editing is paused until it is approved or sent back.</p>
        ) : (
          <p className="text-muted">
            {draft.hasPublishedVersion ? 'Learners see the published version until this draft is approved. ' : ''}
            Every chapter needs at least one lesson before review.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          {locked ? (
            <form action={withdrawFromReview}>
              <Hidden />
              <button type="submit" className="btn btn-secondary">
                Withdraw to keep editing
              </button>
            </form>
          ) : (
            <form action={submitForReview}>
              <Hidden />
              <button type="submit" className="btn btn-secondary" disabled={lessonCount === 0}>
                Send for review
              </button>
            </form>
          )}
          {draft.canReview ? (
            <form action={approveDraft}>
              <Hidden />
              <button type="submit" className="btn btn-primary" disabled={lessonCount === 0}>
                Approve and publish
              </button>
            </form>
          ) : null}
        </div>
        {draft.canReview && locked ? <RejectForm hidden={hidden} /> : null}
      </section>

      <section aria-labelledby="details-heading" className="card grid gap-4">
        <h2 id="details-heading" className="text-2xl">
          Course details
        </h2>
        <DetailsForm hidden={hidden} draft={draft} locked={locked} />
      </section>

      <section aria-labelledby="chapters-heading" className="grid gap-4">
        <h2 id="chapters-heading" className="text-2xl">
          Chapters and lessons
        </h2>
        {draft.sections.length === 0 ? <p className="card text-muted">No chapters yet. Add the first chapter below.</p> : null}
        <ol className="grid gap-4">
          {draft.sections.map((section, sectionIndex) => (
            <li key={section.id} className="card grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="hud-label">{String(sectionIndex + 1).padStart(2, '0')}</span>
                {locked ? (
                  <h3 className="text-xl">{section.title}</h3>
                ) : (
                  <form action={renameSection} className="flex flex-1 flex-wrap gap-2">
                    <Hidden extra={{ sectionId: section.id }} />
                    <label htmlFor={`section-${section.id}`} className="sr-only">
                      Chapter title
                    </label>
                    <input id={`section-${section.id}`} name="title" className="field flex-1" defaultValue={section.title} maxLength={200} />
                    <button type="submit" className="btn btn-secondary text-sm">
                      Rename
                    </button>
                  </form>
                )}
                {locked ? null : (
                  <div className="flex gap-2">
                    <MoveButton kind="section" itemId={section.id} direction="up" disabled={sectionIndex === 0} Hidden={Hidden} label={`Move chapter ${section.title} up`} />
                    <MoveButton
                      kind="section"
                      itemId={section.id}
                      direction="down"
                      disabled={sectionIndex === draft.sections.length - 1}
                      Hidden={Hidden}
                      label={`Move chapter ${section.title} down`}
                    />
                    <form action={deleteSection}>
                      <Hidden extra={{ sectionId: section.id }} />
                      <button type="submit" className="btn btn-secondary text-sm" aria-label={`Delete chapter ${section.title} and its lessons`}>
                        Delete
                      </button>
                    </form>
                  </div>
                )}
              </div>

              <ul className="grid gap-2">
                {section.lessons.map((lesson, lessonIndex) => {
                  const first = sectionIndex === 0 && lessonIndex === 0;
                  const last = sectionIndex === draft.sections.length - 1 && lessonIndex === section.lessons.length - 1;
                  return (
                    <li key={lesson.id} className="flex flex-wrap items-center justify-between gap-2 border border-line p-3">
                      <div>
                        {locked ? lesson.title : <Link href={`${editor}/lessons/${lesson.id}`}>{lesson.title}</Link>}
                        <span className="hud-label ml-2">
                          {[
                            lesson.kind === 'VIDEO' ? 'Video' : lesson.kind === 'AUDIO' ? 'Audio' : null,
                            lesson.kind !== 'TEXT' && lesson.media?.status !== 'READY' ? 'No file yet' : null,
                            lesson.isPreview ? 'Preview' : null,
                            lesson.isRequired ? null : 'Optional',
                            formatDuration(lesson.durationSec ?? lesson.media?.durationSec ?? null),
                            lesson.bodyMarkdown.trim() ? null : lesson.kind === 'TEXT' ? 'Empty' : 'No transcript',
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </div>
                      {locked ? null : (
                        <div className="flex gap-2">
                          <MoveButton kind="lesson" itemId={lesson.id} direction="up" disabled={first} Hidden={Hidden} label={`Move lesson ${lesson.title} up`} />
                          <MoveButton kind="lesson" itemId={lesson.id} direction="down" disabled={last} Hidden={Hidden} label={`Move lesson ${lesson.title} down`} />
                          <form action={deleteLesson}>
                            <Hidden extra={{ lessonId: lesson.id }} />
                            <button type="submit" className="btn btn-secondary text-sm" aria-label={`Delete lesson ${lesson.title}`}>
                              Delete
                            </button>
                          </form>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              {locked ? null : (
                <form action={addLesson} className="flex flex-wrap gap-2">
                  <Hidden extra={{ sectionId: section.id }} />
                  <label htmlFor={`new-lesson-${section.id}`} className="sr-only">
                    New lesson title
                  </label>
                  <input id={`new-lesson-${section.id}`} name="title" className="field flex-1" placeholder="New lesson title" maxLength={200} />
                  <label htmlFor={`new-kind-${section.id}`} className="sr-only">
                    Lesson type
                  </label>
                  <select id={`new-kind-${section.id}`} name="kind" className="field w-auto" defaultValue="TEXT">
                    <option value="TEXT">Text</option>
                    <option value="VIDEO">Video</option>
                    <option value="AUDIO">Audio</option>
                  </select>
                  <button type="submit" className="btn btn-secondary">
                    Add lesson
                  </button>
                </form>
              )}
            </li>
          ))}
        </ol>

        {locked ? null : (
          <form action={addSection} className="card flex flex-wrap gap-2">
            <Hidden />
            <label htmlFor="new-section" className="sr-only">
              New chapter title
            </label>
            <input id="new-section" name="title" className="field flex-1" placeholder="New chapter title, e.g. Chapter 1: Hiragana" maxLength={200} />
            <button type="submit" className="btn btn-primary">
              Add chapter
            </button>
          </form>
        )}
      </section>
    </>
  );
}

function MoveButton({
  kind,
  itemId,
  direction,
  disabled,
  Hidden,
  label,
}: {
  kind: 'section' | 'lesson';
  itemId: string;
  direction: 'up' | 'down';
  disabled: boolean;
  Hidden: (props: { extra?: Record<string, string> }) => React.JSX.Element;
  label: string;
}) {
  return (
    <form action={move}>
      <Hidden extra={{ kind, itemId, direction }} />
      <button type="submit" className="btn btn-secondary text-sm" disabled={disabled} aria-label={label}>
        {direction === 'up' ? '↑' : '↓'}
      </button>
    </form>
  );
}

const QUIZ_STATUS: Record<Quiz['status'], string> = { DRAFT: 'Draft', APPROVED: 'Published', RETIRED: 'Closed' };

/** Practice quizzes and mock exams for this course (FR-ASSESS-501). */
function Quizzes({ quizzes, editor, Hidden }: { quizzes: Quiz[]; editor: string; Hidden: (props: { extra?: Record<string, string> }) => React.JSX.Element }) {
  return (
    <section aria-labelledby="quizzes-heading" className="grid gap-4">
      <h2 id="quizzes-heading" className="text-2xl">
        Quizzes and exams
      </h2>
      {quizzes.length === 0 ? <p className="card text-muted">No quizzes yet. Learners see published quizzes on the course page.</p> : null}
      <ul className="grid gap-3 sm:grid-cols-2">
        {quizzes.map((quiz) => {
          const questions = quiz.sections.reduce((sum, section) => sum + section.questionCount, 0);
          return (
            <li key={quiz.id}>
              <Link href={`${editor}/quizzes/${quiz.id}`} className="card card-link block h-full">
                <span className="text-xl">{quiz.title}</span>
                <span className={`hud-label mt-1 block ${quiz.status === 'APPROVED' ? 'text-success' : ''}`}>
                  // {QUIZ_STATUS[quiz.status]} · {quiz.kind === 'MOCK' ? 'Mock exam' : 'Practice'} · {questions} questions · {quiz.timeLimitMin} min
                  {quiz.attempts > 0 ? ` · ${quiz.attempts} attempts` : ''}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <form action={createQuiz} className="card grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
        <Hidden />
        <div>
          <label htmlFor="quiz-title" className="field-label">
            New quiz title
          </label>
          <input id="quiz-title" name="title" className="field" placeholder="Chapter 1 check" maxLength={200} required minLength={3} />
        </div>
        <div>
          <label htmlFor="quiz-kind" className="field-label">
            Type
          </label>
          <select id="quiz-kind" name="kind" className="field" defaultValue="PRACTICE">
            <option value="PRACTICE">Practice quiz</option>
            <option value="MOCK">Mock exam</option>
          </select>
        </div>
        <div>
          <label htmlFor="quiz-time" className="field-label">
            Minutes
          </label>
          <input id="quiz-time" name="timeLimitMin" type="number" min={1} max={600} defaultValue={10} className="field w-24" />
        </div>
        <input type="hidden" name="passPercent" value="60" />
        <button type="submit" className="btn btn-primary">
          Create quiz
        </button>
      </form>
    </section>
  );
}
