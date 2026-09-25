'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi } from '@/lib/edu-api.ts';
import { questionFromForm } from '@/lib/quiz.ts';
import type { FormState } from './actions';

const SLUG = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Target {
  tenantId: string;
  courseId: string;
  quizId: string;
  page: string;
  token: string;
}

async function target(form: FormData): Promise<Target> {
  const slug = String(form.get('slug') ?? '');
  const tenantId = String(form.get('tenantId') ?? '');
  const courseId = String(form.get('courseId') ?? '');
  const quizId = String(form.get('quizId') ?? '');
  if (!SLUG.test(slug) || !UUID.test(tenantId) || !UUID.test(courseId) || (quizId && !UUID.test(quizId))) redirect('/');
  const page = quizId ? `/w/${slug}/teach/${courseId}/quizzes/${quizId}` : `/w/${slug}/teach/${courseId}`;
  const session = await auth.currentSession(page);
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(page)}`);
  return { tenantId, courseId, quizId, page, token: session.accessToken };
}

const message = (error: unknown) => (error instanceof EduApiError ? error.message : 'Oxinov Edu is unavailable. Your change was not saved; try again.');

/** Button actions: run, then return to the quiz page carrying any error for display. */
async function act(form: FormData, change: (t: Target) => Promise<unknown>, done?: (t: Target) => string): Promise<never> {
  const t = await target(form);
  let error: string | undefined;
  try {
    await change(t);
  } catch (caught) {
    error = message(caught);
  }
  revalidatePath(t.page, 'layout');
  redirect(error ? `${t.page}?error=${encodeURIComponent(error.slice(0, 300))}` : (done?.(t) ?? t.page));
}

/** Form actions: errors show next to the form instead of leaving the page. */
async function formAct(form: FormData, change: (t: Target) => Promise<unknown>): Promise<FormState & { saved?: boolean }> {
  const t = await target(form);
  try {
    await change(t);
  } catch (caught) {
    return { error: message(caught) };
  }
  revalidatePath(t.page, 'layout');
  return { saved: true };
}

function settingsFromForm(form: FormData) {
  const maxAttempts = String(form.get('maxAttempts') ?? '').trim();
  return {
    title: String(form.get('title') ?? '').trim(),
    kind: form.get('kind') === 'MOCK' ? 'MOCK' : 'PRACTICE',
    timeLimitMin: Number(form.get('timeLimitMin') ?? 10) || 10,
    passPercent: Number(form.get('passPercent') ?? 60),
    maxAttempts: maxAttempts ? Number(maxAttempts) : null,
    answerRelease: form.get('answerRelease') === 'NEVER' ? 'NEVER' : 'AFTER_SUBMIT',
    shuffleQuestions: form.get('shuffleQuestions') === 'on',
  };
}

export async function createQuiz(form: FormData) {
  let quizId = '';
  return act(
    form,
    async (t) => {
      quizId = (await eduApi.createQuiz(t.token, t.tenantId, t.courseId, { ...settingsFromForm(form), shuffleQuestions: true })).id;
    },
    (t) => `${t.page}/quizzes/${quizId}`,
  );
}

export async function saveQuizSettings(_: FormState, form: FormData) {
  return formAct(form, (t) => eduApi.quizCall(t.token, t.tenantId, t.quizId, 'PATCH', '', settingsFromForm(form)));
}

export async function addQuizSection(form: FormData) {
  const body = { title: String(form.get('title') ?? '').trim() || 'Section', questionCount: Number(form.get('questionCount') ?? 1) || 1 };
  return act(form, (t) => eduApi.quizCall(t.token, t.tenantId, t.quizId, 'POST', '/sections', body));
}

export async function updateQuizSection(form: FormData) {
  const body = { title: String(form.get('title') ?? '').trim() || 'Section', questionCount: Number(form.get('questionCount') ?? 1) || 1 };
  const sectionId = String(form.get('sectionId') ?? '');
  return act(form, (t) => eduApi.quizCall(t.token, t.tenantId, t.quizId, 'PATCH', `/sections/${UUID.test(sectionId) ? sectionId : 'x'}`, body));
}

export async function deleteQuizSection(form: FormData) {
  const sectionId = String(form.get('sectionId') ?? '');
  return act(form, (t) => eduApi.quizCall(t.token, t.tenantId, t.quizId, 'DELETE', `/sections/${UUID.test(sectionId) ? sectionId : 'x'}`));
}

export async function saveQuestion(_: FormState, form: FormData) {
  const sectionId = String(form.get('sectionId') ?? '');
  const questionId = String(form.get('questionId') ?? '');
  const body = questionFromForm(form);
  return formAct(form, (t) =>
    UUID.test(questionId)
      ? eduApi.quizCall(t.token, t.tenantId, t.quizId, 'PATCH', `/questions/${questionId}`, body)
      : eduApi.quizCall(t.token, t.tenantId, t.quizId, 'POST', `/sections/${UUID.test(sectionId) ? sectionId : 'x'}/questions`, body),
  );
}

export async function removeQuestion(form: FormData) {
  const questionId = String(form.get('questionId') ?? '');
  return act(form, (t) => eduApi.quizCall(t.token, t.tenantId, t.quizId, 'DELETE', `/questions/${UUID.test(questionId) ? questionId : 'x'}`));
}

export async function quizLifecycle(form: FormData) {
  const step = String(form.get('step') ?? '');
  if (!['publish', 'unpublish', 'close', 'duplicate'].includes(step)) return target(form).then((t) => redirect(t.page));
  let copyId = '';
  return act(
    form,
    async (t) => {
      const quiz = await eduApi.quizCall(t.token, t.tenantId, t.quizId, 'POST', `/${step}`);
      if (step === 'duplicate') copyId = quiz.id;
    },
    (t) => (copyId ? t.page.replace(t.quizId, copyId) : t.page),
  );
}
