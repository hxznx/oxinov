import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { addQuizSection, deleteQuizSection, quizLifecycle, removeQuestion, updateQuizSection } from '@/app/quiz-actions';
import { EduHeader } from '@/components/EduHeader';
import { eduApi, type Quiz } from '@/lib/edu-api.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { answerSummary, QUESTION_TYPES } from '@/lib/quiz.ts';
import { QuestionForm } from './QuestionForm';
import { QuizSettingsForm } from './QuizSettingsForm';

export const metadata: Metadata = { title: 'Quiz builder' };

type Props = { params: Promise<{ slug: string; courseId: string; quizId: string }>; searchParams: Promise<{ error?: string }> };

const STATUS: Record<Quiz['status'], string> = { DRAFT: 'Draft', APPROVED: 'Published', RETIRED: 'Closed' };
const TYPE_LABEL = Object.fromEntries(QUESTION_TYPES);

/** Quiz builder (FR-ASSESS-501): settings, sections that draw random questions, and each section's questions. */
export default async function QuizBuilderPage({ params, searchParams }: Props) {
  const { slug, courseId, quizId } = await params;
  const { error } = await searchParams;
  const editor = `/w/${slug}/teach/${courseId}`;
  const here = `${editor}/quizzes/${quizId}`;
  const { token, workspace } = await workspaceContext(slug, here);
  if (workspace.role === 'LEARNER') notFound();
  const quiz = await load(here, () => eduApi.quiz(token, workspace.id, quizId));
  if (quiz.courseId !== courseId) notFound();

  const hidden = { slug, tenantId: workspace.id, courseId, quizId };
  const Hidden = ({ extra = {} }: { extra?: Record<string, string> }) => (
    <>
      {Object.entries({ ...hidden, ...extra }).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
    </>
  );
  const Step = ({ step, label, primary = false }: { step: string; label: string; primary?: boolean }) => (
    <form action={quizLifecycle}>
      <Hidden extra={{ step }} />
      <button type="submit" className={`btn ${primary ? 'btn-primary' : 'btn-secondary'}`}>
        {label}
      </button>
    </form>
  );
  const total = quiz.sections.reduce((sum, section) => sum + section.questionCount, 0);
  const short = quiz.sections.filter((section) => section.available < section.questionCount);
  const closed = quiz.status === 'RETIRED';

  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <main id="main" className="mx-auto grid max-w-5xl gap-8 px-4 py-10">
        <div>
          <p className="hud-label">
            <Link href={editor}>// Back to the course</Link>
          </p>
          <h1 className="mt-2 text-4xl">{quiz.title}</h1>
          <p className="hud-label mt-2">
            // {STATUS[quiz.status]} · {quiz.kind === 'MOCK' ? 'Mock exam' : 'Practice quiz'} · {total} questions per attempt · {quiz.timeLimitMin} min
            {quiz.attempts > 0 ? ` · ${quiz.attempts} attempts so far` : ''}
          </p>
        </div>

        {error ? (
          <p role="alert" className="notice notice-error">
            {error}
          </p>
        ) : null}

        <section aria-labelledby="status-heading" className="card grid gap-3">
          <h2 id="status-heading" className="text-2xl">
            Status
          </h2>
          <p className="text-muted">
            {quiz.status === 'DRAFT'
              ? short.length > 0 || quiz.sections.length === 0
                ? 'Draft. Add sections and enough questions to every section, then publish it for enrolled learners.'
                : 'Draft and ready. Publishing shows it to learners enrolled in the course.'
              : quiz.status === 'APPROVED'
                ? quiz.attempts > 0
                  ? 'Published. Learners have taken it, so its settings and sections are fixed; you can still correct and add questions.'
                  : 'Published. Nobody has taken it yet, so you can still unpublish it to change settings.'
                : 'Closed. Learners can no longer start it; their results are kept.'}
          </p>
          <div className="flex flex-wrap gap-3">
            {quiz.status === 'DRAFT' ? <Step step="publish" label="Publish" primary /> : null}
            {quiz.status === 'APPROVED' && quiz.attempts === 0 ? <Step step="unpublish" label="Unpublish" /> : null}
            {quiz.status === 'APPROVED' ? <Step step="close" label="Close quiz" /> : null}
            <Step step="duplicate" label="Make a copy" />
          </div>
        </section>

        <section aria-labelledby="settings-heading" className="card grid gap-4">
          <h2 id="settings-heading" className="text-2xl">
            Settings
          </h2>
          <QuizSettingsForm hidden={hidden} quiz={quiz} />
        </section>

        <section aria-labelledby="sections-heading" className="grid gap-4">
          <h2 id="sections-heading" className="text-2xl">
            Sections and questions
          </h2>
          <p className="text-muted">Each attempt draws the set number of questions at random from each section&apos;s questions. Write more questions than you draw so attempts differ.</p>

          {quiz.sections.map((section, index) => {
            const questions = quiz.questions?.[section.id] ?? [];
            const enough = section.available >= section.questionCount;
            return (
              <article key={section.id} className="card grid gap-4" aria-labelledby={`section-${section.id}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 id={`section-${section.id}`} className="text-xl">
                    <span className="hud-label mr-2">{String(index + 1).padStart(2, '0')}</span>
                    {section.title}
                  </h3>
                  <span className={`hud-label ${enough ? 'text-success' : 'text-warning'}`}>
                    {section.available} written · {section.questionCount} per attempt
                  </span>
                </div>

                {quiz.editable ? (
                  <div className="flex flex-wrap items-end gap-2">
                    <form action={updateQuizSection} className="flex flex-1 flex-wrap items-end gap-2">
                      <Hidden extra={{ sectionId: section.id }} />
                      <div className="flex-1">
                        <label htmlFor={`title-${section.id}`} className="field-label">
                          Section title
                        </label>
                        <input id={`title-${section.id}`} name="title" className="field" defaultValue={section.title} maxLength={160} />
                      </div>
                      <div>
                        <label htmlFor={`count-${section.id}`} className="field-label">
                          Per attempt
                        </label>
                        <input id={`count-${section.id}`} name="questionCount" type="number" min={1} max={200} defaultValue={section.questionCount} className="field w-24" />
                      </div>
                      <button type="submit" className="btn btn-secondary">
                        Save
                      </button>
                    </form>
                    <form action={deleteQuizSection}>
                      <Hidden extra={{ sectionId: section.id }} />
                      <button type="submit" className="btn btn-secondary" aria-label={`Remove section ${section.title}`}>
                        Remove
                      </button>
                    </form>
                  </div>
                ) : null}

                {questions.length === 0 ? <p className="text-muted">No questions yet.</p> : null}
                <ol className="grid gap-3">
                  {questions.map((question, number) => (
                    <li key={question.id} className="border border-line p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="grid gap-1">
                          <p className="hud-label">
                            Q{number + 1} · {TYPE_LABEL[question.type]} · {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                            {question.version > 1 ? ` · edited` : ''}
                          </p>
                          <p className="whitespace-pre-line">{question.prompt}</p>
                          <p className="text-sm text-success">{answerSummary(question)}</p>
                        </div>
                        {closed ? null : (
                          <form action={removeQuestion}>
                            <Hidden extra={{ questionId: question.id }} />
                            <button type="submit" className="btn btn-secondary text-sm" aria-label={`Remove question ${number + 1}`}>
                              Remove
                            </button>
                          </form>
                        )}
                      </div>
                      {closed ? null : (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm">Edit question</summary>
                          <div className="mt-3">
                            <QuestionForm hidden={{ ...hidden, sectionId: section.id }} question={question} />
                          </div>
                        </details>
                      )}
                    </li>
                  ))}
                </ol>

                {closed ? null : (
                  <details open={questions.length === 0}>
                    <summary className="btn btn-secondary cursor-pointer">Add a question</summary>
                    <div className="mt-4">
                      <QuestionForm hidden={{ ...hidden, sectionId: section.id }} />
                    </div>
                  </details>
                )}
              </article>
            );
          })}

          {quiz.editable ? (
            <form action={addQuizSection} className="card flex flex-wrap items-end gap-2">
              <Hidden />
              <div className="flex-1">
                <label htmlFor="new-section-title" className="field-label">
                  New section
                </label>
                <input id="new-section-title" name="title" className="field" placeholder="Vocabulary" maxLength={160} />
              </div>
              <div>
                <label htmlFor="new-section-count" className="field-label">
                  Questions per attempt
                </label>
                <input id="new-section-count" name="questionCount" type="number" min={1} max={200} defaultValue={5} className="field w-28" />
              </div>
              <button type="submit" className="btn btn-primary">
                Add section
              </button>
            </form>
          ) : null}
        </section>
      </main>
    </>
  );
}
