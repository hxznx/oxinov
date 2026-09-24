import type { Metadata } from 'next';
import Link from 'next/link';
import { EduHeader } from '@/components/EduHeader';
import { eduApi, type Attempt, type AttemptItem } from '@/lib/edu-api.ts';
import { percent } from '@/lib/exam.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { ExamRunner } from './ExamRunner';

type Props = { params: Promise<{ slug: string; attemptId: string }> };

export const metadata: Metadata = { title: 'Exam' };

/** An exam attempt: the timed exam while in progress, the graded result afterwards (FR-ASSESS-502). */
export default async function AttemptPage({ params }: Props) {
  const { slug, attemptId } = await params;
  const here = `/w/${slug}/attempts/${attemptId}`;
  const { token, workspace } = await workspaceContext(slug, here);
  const attempt = await load(here, () => eduApi.attempt(token, workspace.id, attemptId));
  const inProgress = attempt.status === 'IN_PROGRESS';

  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <main id="main" className="mx-auto grid max-w-3xl gap-6 px-4 py-10">
        <div>
          <p className="hud-label">
            // Attempt {attempt.attemptNumber}
            {inProgress ? ' · in progress' : attempt.status === 'EXPIRED' ? ' · time ran out' : ' · submitted'}
          </p>
          <h1 className="mt-2 text-4xl">{attempt.examTitle}</h1>
        </div>
        {inProgress ? <ExamRunner slug={slug} tenantId={workspace.id} attempt={attempt} /> : <Result attempt={attempt} slug={slug} />}
      </main>
    </>
  );
}

function Result({ attempt, slug }: { attempt: Attempt; slug: string }) {
  const { result } = attempt;
  if (!result) {
    return <p className="notice">This attempt is closed. Its result is being prepared; refresh in a moment.</p>;
  }
  const released = attempt.items.some((item) => item.isCorrect !== undefined);
  return (
    <>
      <section aria-labelledby="score-heading" className="card grid gap-4">
        <h2 id="score-heading" className="sr-only">
          Score
        </h2>
        <div className="flex flex-wrap items-baseline gap-4">
          <p className="font-display text-5xl">{percent(result.score, result.maxScore)}%</p>
          <p className={`text-xl ${result.passed ? 'text-success' : 'text-danger'}`}>{result.passed ? 'Passed' : 'Not passed yet'}</p>
        </div>
        <p className="text-muted">
          {result.score} of {result.maxScore} marks
          {attempt.status === 'EXPIRED' ? ' · submitted automatically when time ran out' : ''}
        </p>
        {result.sectionBreakdown.length > 1 ? (
          <table className="w-full text-left">
            <caption className="sr-only">Score by section</caption>
            <thead>
              <tr className="hud-label">
                <th className="py-1 font-normal">Section</th>
                <th className="py-1 text-right font-normal">Score</th>
              </tr>
            </thead>
            <tbody>
              {result.sectionBreakdown.map((section) => (
                <tr key={section.sectionKey} className="border-t border-line">
                  <td className="py-2">{section.title}</td>
                  <td className="py-2 text-right">
                    {section.score}/{section.maxScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        <p className="notice text-sm">{result.notice}</p>
      </section>

      {released ? (
        <section aria-labelledby="review-heading" className="grid gap-4">
          <h2 id="review-heading" className="text-2xl">
            Review your answers
          </h2>
          <ol className="grid gap-4">
            {attempt.items.map((item) => (
              <ReviewItem key={item.id} item={item} />
            ))}
          </ol>
        </section>
      ) : (
        <p className="text-muted">Your instructor will release the correct answers later.</p>
      )}

      <p>
        <Link href={`/w/${slug}`} className="btn btn-secondary">
          Back to courses
        </Link>
      </p>
    </>
  );
}

function ReviewItem({ item }: { item: AttemptItem }) {
  const chosen = item.response && 'choiceIds' in item.response ? item.response.choiceIds : [];
  const text = item.response && 'text' in item.response ? item.response.text : null;
  const key = new Set(item.answerKey ?? []);
  return (
    <li className="card grid gap-2">
      <p className="hud-label">
        Question {item.position} · {item.isCorrect ? '✓ correct' : '✗ incorrect'} · {item.marksAwarded ?? 0}/{item.marks}
      </p>
      {item.passage ? <blockquote className="whitespace-pre-line border-l-2 border-line pl-4">{item.passage}</blockquote> : null}
      <p className="whitespace-pre-line">{item.prompt}</p>
      {item.type === 'FILL_BLANK' ? (
        <p>
          Your answer: <strong>{text?.trim() ? text : 'no answer'}</strong>
          {item.answerKey?.length ? <> · Accepted: {item.answerKey.join(', ')}</> : null}
        </p>
      ) : (
        <ul className="grid gap-1">
          {item.choices.map((choice) => (
            <li key={choice.id} className={key.has(choice.id) ? 'text-success' : chosen.includes(choice.id) ? 'text-danger' : 'text-muted'}>
              {key.has(choice.id) ? '✓ ' : chosen.includes(choice.id) ? '✗ ' : '· '}
              {choice.text}
              {chosen.includes(choice.id) ? <span className="sr-only"> (your answer)</span> : null}
              {key.has(choice.id) ? <span className="sr-only"> (correct answer)</span> : null}
            </li>
          ))}
        </ul>
      )}
      {item.explanation ? <p className="text-muted">{item.explanation}</p> : null}
    </li>
  );
}
