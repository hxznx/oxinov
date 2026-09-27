'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi, type AnswerResponse } from '@/lib/edu-api.ts';
import type { FormState } from './actions';

const SLUG = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const START_MESSAGES: Record<string, string> = {
  ATTEMPT_LIMIT_REACHED: 'You have used every attempt for this exam. Ask your instructor if you need another.',
  NOT_ENTITLED: 'Enroll in the course to take this exam.',
  EXAM_NOT_AVAILABLE: 'This exam is not open right now.',
};

function ids(form: FormData, ...names: string[]): string[] | null {
  const values = names.map((name) => String(form.get(name) ?? ''));
  return values.every((value) => UUID.test(value)) ? values : null;
}

async function token(returnTo: string): Promise<string> {
  const session = await auth.currentSession(returnTo);
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  return session.accessToken;
}

/** Starts a new attempt or resumes the unexpired one (FR-ASSESS-501), then opens it. */
export async function startExam(_: FormState, form: FormData): Promise<FormState> {
  const slug = String(form.get('slug') ?? '');
  const parsed = ids(form, 'tenantId', 'examId');
  if (!SLUG.test(slug) || !parsed) return { error: 'This exam link is not valid.' };
  const [tenantId, examId] = parsed as [string, string];
  const access = await token(`/w/${slug}`);

  let attemptId: string;
  try {
    attemptId = (await eduApi.startAttempt(access, tenantId, examId)).id;
  } catch (error) {
    if (error instanceof EduApiError) return { error: START_MESSAGES[error.code] ?? error.message };
    return { error: 'Oxinov Edu is unavailable. Try again shortly.' };
  }
  redirect(`/w/${slug}/attempts/${attemptId}`);
}

export interface SaveResult {
  ok: boolean;
  remainingSec?: number;
  closed?: boolean;
}

/** Autosave from the exam screen; the server re-checks the deadline and course access on every save. */
export async function saveExamAnswers(
  tenantId: string,
  attemptId: string,
  answers: { itemId: string; response: AnswerResponse }[],
): Promise<SaveResult> {
  if (!UUID.test(tenantId) || !UUID.test(attemptId) || answers.length === 0 || answers.length > 200) return { ok: false };
  const session = await auth.currentSession('/');
  if (!session) return { ok: false };
  try {
    const attempt = await eduApi.saveAnswers(session.accessToken, tenantId, attemptId, answers);
    return { ok: true, remainingSec: attempt.remainingSec, closed: attempt.status !== 'IN_PROGRESS' };
  } catch (error) {
    const closed = error instanceof EduApiError && ['ATTEMPT_EXPIRED', 'ATTEMPT_CLOSED'].includes(error.code);
    return { ok: false, closed };
  }
}

/** Final submission (FR-ASSESS-502); the server grades and stores the result. */
export async function submitExam(_: FormState, form: FormData): Promise<FormState> {
  const slug = String(form.get('slug') ?? '');
  const parsed = ids(form, 'tenantId', 'attemptId');
  if (!SLUG.test(slug) || !parsed) return { error: 'This exam link is not valid.' };
  const [tenantId, attemptId] = parsed as [string, string];
  const here = `/w/${slug}/attempts/${attemptId}`;
  const access = await token(here);
  try {
    await eduApi.submitAttempt(access, tenantId, attemptId);
  } catch (error) {
    // An attempt that already closed (deadline passed or submitted elsewhere) just shows its result.
    if (!(error instanceof EduApiError && error.code === 'ATTEMPT_CLOSED')) {
      return { error: error instanceof EduApiError ? error.message : 'Oxinov Edu is unavailable. Your answers are saved; try again.' };
    }
  }
  redirect(here);
}
