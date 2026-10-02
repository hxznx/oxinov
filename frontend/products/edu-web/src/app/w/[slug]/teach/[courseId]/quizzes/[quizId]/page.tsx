import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { addQuizSection, deleteQuizSection, quizLifecycle, removeQuestion, updateQuizSection } from '@/app/quiz-actions';
import { EduHeader } from '@/components/EduHeader';
import { eduApi, type Quiz } from '@/lib/edu-api.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { answerSummary, QUESTION_TYPES, quizSelection, shortPrompt } from '@/lib/quiz.ts';
import { QuestionForm } from './QuestionForm';
import { QuizSettingsForm } from './QuizSettingsForm';

export const metadata: Metadata = { title: 'Quiz editor' };

type Props = { params: Promise<{ slug: string; courseId: string; quizId: string }>; searchParams: Promise<{ error?: string; q?: string; add?: string }> };

const STATUS: Record<Quiz['status'], { label: string; tone: string }> = {
  DRAFT: { label: 'Draft', tone: 'tone-warning' },
  APPROVED: { label: 'Published', tone: 'tone-success' },
  RETIRED: { label: 'Closed', tone: 'tone-muted' },
};
const TYPE_LABEL = Object.fromEntries(QUESTION_TYPES);
const TYPE_TAG: Record<string, string> = { SINGLE_CHOICE: 'ONE', MULTIPLE_CHOICE: 'MANY', TRUE_FALSE: 'T/F', FILL_BLANK: 'TYPE' };

/**
 * Quiz editor (FR-ASSESS-501; design screen 10): settings across the top, the question list on the left
 * grouped by the sections that draw random questions, and the selected question on the right.
 */
export default async function QuizEditorPage({ params, searchParams }: Props) {
  const { slug, courseId, quizId } = await params;
  const { error, q, add } = await searchParams;
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
      <button type="submit" className={`btn font-studio ${primary ? 'btn-primary' : 'btn-secondary'}`}>
        {label}
      </button>
    </form>
  );
  const total = quiz.sections.reduce((sum, section) => sum + section.questionCount, 0);
  const short = quiz.sections.filter((section) => section.available < section.questionCount);
  const closed = quiz.status === 'RETIRED';
  const selected = quizSelection(quiz, { q, add });
  const selectedSection = selected.mode === 'none' ? undefined : quiz.sections.find((section) => section.id === selected.sectionId);
  let number = 0;

  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <main id="main" className="mx-auto grid max-w-7xl gap-5 px-4 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid min-w-0 flex-1 gap-1">
            <span className="studio-kicker">
              <Link href={editor}>// Back to the course</Link>
            </span>
            <h1 className="studio-title">
              <span className="crumb">Quizzes › </span>
              {quiz.title}
            </h1>
            <p className="studio-sub">
              <span className={`studio-status ${STATUS[quiz.status].tone}`}>{STATUS[quiz.status].label}</span> · {quiz.kind === 'MOCK' ? 'Mock exam' : 'Practice quiz'} · {total}{' '}
              questions per attempt · {quiz.timeLimitMin} min
              {quiz.attempts > 0 ? ` · ${quiz.attempts} attempts so far` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quiz.status === 'DRAFT' ? <Step step="publish" label="Publish" primary /> : null}
            {quiz.status === 'APPROVED' && quiz.attempts === 0 ? <Step step="unpublish" label="Unpublish" /> : null}
            {quiz.status === 'APPROVED' ? <Step step="close" label="Close quiz" /> : null}
            <Step step="duplicate" label="Make a copy" />
          </div>
        </div>

        {error ? (
          <p role="alert" className="notice notice-error">
            {error}
          </p>
        ) : null}

        <p className="studio-sub">
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

        <section aria-labelledby="settings-heading" className="studio-panel grid gap-3 p-4">
          <h2 id="settings-heading" className="sr-only">
            Settings
          </h2>
          <QuizSettingsForm hidden={hidden} quiz={quiz} />
        </section>

        <div className="quiz-layout">
          <section aria-labelledby="questions-heading" className="grid gap-4">
            <div className="flex items-center justify-between gap-2">
              <h2 id="questions-heading" className="studio-h2">
                Questions
              </h2>
              <span className="studio-sub">Each attempt draws at random</span>
            </div>
            {quiz.sections.map((section) => {
              const questions = quiz.questions?.[section.id] ?? [];
              const enough = section.available >= section.questionCount;
              const adding = selected.mode === 'add' && selected.sectionId === section.id;
              return (
                <div key={section.id} className="grid gap-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-studio font-bold">{section.title}</h3>
                    <span className={`studio-status ${enough ? 'tone-success' : 'tone-warning'}`}>
                      {section.available} written · {section.questionCount} drawn
                    </span>
                  </div>
                  <ol className="grid gap-1.5">
                    {questions.map((question) => {
                      number += 1;
                      const current = selected.mode === 'edit' && selected.question.id === question.id;
                      return (
                        <li key={question.id}>
                          <Link href={`${here}?q=${question.id}`} scroll={false} aria-current={current ? 'true' : undefined} className="quiz-pick">
                            <span className="text-hud tone-muted">Q{number}</span>
                            <span className="truncate">{shortPrompt(question.prompt)}</span>
                            <span className="text-hud text-[0.625rem] tone-mid">{TYPE_TAG[question.type]}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                  {closed ? null : (
                    <Link href={`${here}?add=${section.id}`} scroll={false} aria-current={adding ? 'true' : undefined} className="quiz-add">
                      + Add question to {section.title}
                    </Link>
                  )}
                </div>
              );
            })}
            {quiz.sections.length === 0 ? <p className="studio-sub">No sections yet. Add one below, for example &quot;Vocabulary&quot;.</p> : null}

            {quiz.editable ? (
              <details className="studio-panel p-3" open={quiz.sections.length === 0}>
                <summary className="cursor-pointer font-studio text-sm">Sections</summary>
                <div className="mt-3 grid gap-3">
                  {quiz.sections.map((section) => (
                    <div key={section.id} className="grid gap-2 border-b border-line pb-3">
                      <form action={updateQuizSection} className="grid grid-cols-[minmax(0,1fr)_5rem] items-end gap-2">
                        <Hidden extra={{ sectionId: section.id }} />
                        <div>
                          <label htmlFor={`title-${section.id}`} className="field-label">
                            Section title
                          </label>
                          <input id={`title-${section.id}`} name="title" className="field py-1.5 text-sm" defaultValue={section.title} maxLength={160} />
                        </div>
                        <div>
                          <label htmlFor={`count-${section.id}`} className="field-label">
                            Drawn
                          </label>
                          <input id={`count-${section.id}`} name="questionCount" type="number" min={1} max={200} defaultValue={section.questionCount} className="field py-1.5 text-sm" />
                        </div>
                        <button type="submit" className="btn btn-secondary px-3 py-1 text-sm">
                          Save
                        </button>
                      </form>
                      <form action={deleteQuizSection}>
                        <Hidden extra={{ sectionId: section.id }} />
                        <button type="submit" className="btn btn-reject px-3 py-1 text-sm" aria-label={`Remove section ${section.title}`}>
                          Remove section
                        </button>
                      </form>
                    </div>
                  ))}
                  <form action={addQuizSection} className="grid grid-cols-[minmax(0,1fr)_5rem] items-end gap-2">
                    <Hidden />
                    <div>
                      <label htmlFor="new-section-title" className="field-label">
                        New section
                      </label>
                      <input id="new-section-title" name="title" className="field py-1.5 text-sm" placeholder="Vocabulary" maxLength={160} />
                    </div>
                    <div>
                      <label htmlFor="new-section-count" className="field-label">
                        Drawn
                      </label>
                      <input id="new-section-count" name="questionCount" type="number" min={1} max={200} defaultValue={5} className="field py-1.5 text-sm" />
                    </div>
                    <button type="submit" className="btn btn-primary px-3 py-1 text-sm">
                      Add section
                    </button>
                  </form>
                </div>
              </details>
            ) : null}
          </section>

          <section aria-labelledby="editor-heading" className="studio-panel grid gap-4 p-5">
            {selected.mode === 'edit' ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="grid gap-1">
                    <h2 id="editor-heading" className="studio-h2">
                      Question {selected.number}
                    </h2>
                    <span className="studio-sub">
                      {selectedSection?.title} · {TYPE_LABEL[selected.question.type]} · {selected.question.marks} {selected.question.marks === 1 ? 'mark' : 'marks'}
                      {selected.question.version > 1 ? ' · edited' : ''}
                    </span>
                    <span className="text-sm tone-success">{answerSummary(selected.question)}</span>
                  </div>
                  {closed ? null : (
                    <form action={removeQuestion}>
                      <Hidden extra={{ questionId: selected.question.id }} />
                      <button type="submit" className="btn btn-reject px-3 py-1 text-sm" aria-label={`Remove question ${selected.number}`}>
                        Remove
                      </button>
                    </form>
                  )}
                </div>
                {closed ? (
                  <p className="whitespace-pre-line">{selected.question.prompt}</p>
                ) : (
                  <QuestionForm key={selected.question.id} hidden={{ ...hidden, sectionId: selected.sectionId }} question={selected.question} />
                )}
              </>
            ) : selected.mode === 'add' && !closed ? (
              <>
                <h2 id="editor-heading" className="studio-h2">
                  New question · {selectedSection?.title}
                </h2>
                <QuestionForm key={`add-${selected.sectionId}`} hidden={{ ...hidden, sectionId: selected.sectionId }} />
              </>
            ) : (
              <>
                <h2 id="editor-heading" className="studio-h2">
                  Question editor
                </h2>
                <p className="text-muted">{closed ? 'This quiz is closed.' : 'Add a section first; questions belong to a section.'}</p>
              </>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
