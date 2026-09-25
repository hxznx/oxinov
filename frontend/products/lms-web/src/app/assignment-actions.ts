'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi } from '@/lib/edu-api.ts';
import type { FormState } from './actions';

const SLUG = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Ids = { slug: string; tenantId: string; courseId: string; assignmentId?: string; submissionId?: string };

function ids(form: FormData | Record<string, unknown>): Ids | null {
  const get = (name: string) => String((form instanceof FormData ? form.get(name) : form[name]) ?? '');
  const result: Ids = { slug: get('slug'), tenantId: get('tenantId'), courseId: get('courseId') };
  if (!SLUG.test(result.slug) || !UUID.test(result.tenantId) || !UUID.test(result.courseId)) return null;
  for (const name of ['assignmentId', 'submissionId'] as const) {
    const value = get(name);
    if (value) {
      if (!UUID.test(value)) return null;
      result[name] = value;
    }
  }
  return result;
}

async function token(returnTo: string): Promise<string> {
  const session = await auth.currentSession(returnTo);
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  return session.accessToken;
}

const message = (error: unknown) => (error instanceof EduApiError ? error.message : 'Oxinov Edu is unavailable. Your change was not saved; try again.');

const teachPage = (i: Ids) => `/w/${i.slug}/teach/${i.courseId}/assignments/${i.assignmentId}`;
const learnPage = (i: Ids) => `/w/${i.slug}/courses/${i.courseId}/assignments/${i.assignmentId}`;

function settingsFromForm(form: FormData) {
  const maxPoints = String(form.get('maxPoints') ?? '').trim();
  const dueAt = String(form.get('dueAt') ?? '').trim();
  return {
    title: String(form.get('title') ?? '').trim(),
    instructions: String(form.get('instructions') ?? ''),
    dueAt: dueAt || null,
    allowLate: form.get('allowLate') === 'on',
    acceptText: form.get('acceptText') === 'on',
    acceptUrl: form.get('acceptUrl') === 'on',
    acceptFile: form.get('acceptFile') === 'on',
    maxFileMb: Number(form.get('maxFileMb') ?? 25) || 25,
    maxPoints: maxPoints ? Number(maxPoints) : null,
    isRequired: form.get('isRequired') === 'on',
  };
}

// ---- Teachers --------------------------------------------------------------------------------------

export async function createAssignment(form: FormData) {
  const i = ids(form);
  if (!i) redirect('/');
  const editor = `/w/${i.slug}/teach/${i.courseId}`;
  const access = await token(editor);
  let target = editor;
  try {
    const created = await eduApi.createAssignment(access, i.tenantId, i.courseId, {
      title: String(form.get('title') ?? '').trim(),
      acceptText: true,
      acceptFile: true,
    });
    target = teachPage({ ...i, assignmentId: created.id });
  } catch (error) {
    target = `${editor}?error=${encodeURIComponent(message(error))}`;
  }
  redirect(target);
}

export async function saveAssignment(_: FormState, form: FormData): Promise<FormState & { saved?: boolean }> {
  const i = ids(form);
  if (!i?.assignmentId) return { error: 'This page is out of date. Reload and try again.' };
  const access = await token(teachPage(i));
  try {
    await eduApi.assignmentCall(access, i.tenantId, i.assignmentId, 'PATCH', '', settingsFromForm(form));
  } catch (error) {
    return { error: message(error) };
  }
  revalidatePath(teachPage(i));
  return { saved: true };
}

export async function assignmentStatus(form: FormData) {
  const i = ids(form);
  const step = form.get('step') === 'close' ? '/close' : '/publish';
  if (!i?.assignmentId) redirect('/');
  const access = await token(teachPage(i));
  let error: string | undefined;
  try {
    await eduApi.assignmentCall(access, i.tenantId, i.assignmentId, 'POST', step);
  } catch (caught) {
    error = message(caught);
  }
  revalidatePath(teachPage(i));
  redirect(error ? `${teachPage(i)}?error=${encodeURIComponent(error)}` : teachPage(i));
}

export async function gradeSubmission(_: FormState, form: FormData): Promise<FormState & { saved?: boolean }> {
  const i = ids(form);
  if (!i?.assignmentId || !i.submissionId) return { error: 'This page is out of date. Reload and try again.' };
  const outcome = String(form.get('outcome') ?? '');
  if (!['PASSED', 'FAILED', 'REVISION_REQUESTED'].includes(outcome)) return { error: 'Choose a result.' };
  const score = String(form.get('score') ?? '').trim();
  const page = `${teachPage(i)}/submissions/${i.submissionId}`;
  const access = await token(page);
  try {
    await eduApi.gradeSubmission(access, i.tenantId, i.submissionId, {
      outcome,
      feedback: String(form.get('feedback') ?? ''),
      score: score ? Number(score) : null,
    });
  } catch (error) {
    return { error: message(error) };
  }
  revalidatePath(page);
  revalidatePath(teachPage(i));
  return { saved: true };
}

// ---- Learners --------------------------------------------------------------------------------------

export async function saveMyDraft(_: FormState, form: FormData): Promise<FormState & { saved?: boolean }> {
  const i = ids(form);
  if (!i?.assignmentId) return { error: 'This page is out of date. Reload and try again.' };
  const access = await token(learnPage(i));
  const body: Record<string, unknown> = {};
  if (form.has('text')) body.text = String(form.get('text'));
  if (form.has('url')) body.url = String(form.get('url') ?? '').trim() || null;
  try {
    await eduApi.mineCall(access, i.tenantId, i.assignmentId, 'PUT', '/draft', body);
    if (form.get('intent') === 'submit') await eduApi.mineCall(access, i.tenantId, i.assignmentId, 'POST', '/submit');
  } catch (error) {
    return { error: message(error) };
  }
  revalidatePath(learnPage(i));
  return { saved: true };
}

export async function startMyUpload(input: Ids & { fileName: string; contentType: string; sizeBytes: number }) {
  const i = ids(input);
  if (!i?.assignmentId) return { ok: false as const, error: 'This page is out of date. Reload and try again.' };
  const access = await token(learnPage(i));
  try {
    const ticket = await eduApi.mineCall<{ uploadUrl: string; headers: Record<string, string> }>(access, i.tenantId, i.assignmentId, 'POST', '/upload', {
      fileName: input.fileName,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
    });
    return { ok: true as const, ticket };
  } catch (error) {
    return { ok: false as const, error: message(error) };
  }
}

export async function finishMyUpload(input: Ids) {
  const i = ids(input);
  if (!i?.assignmentId) return { ok: false as const, error: 'This page is out of date. Reload and try again.' };
  const access = await token(learnPage(i));
  try {
    await eduApi.mineCall(access, i.tenantId, i.assignmentId, 'POST', '/upload/complete');
  } catch (error) {
    return { ok: false as const, error: message(error) };
  }
  revalidatePath(learnPage(i));
  return { ok: true as const };
}

export async function removeMyFile(form: FormData) {
  const i = ids(form);
  if (!i?.assignmentId) redirect('/');
  const access = await token(learnPage(i));
  let error: string | undefined;
  try {
    await eduApi.mineCall(access, i.tenantId, i.assignmentId, 'DELETE', '/file');
  } catch (caught) {
    error = message(caught);
  }
  revalidatePath(learnPage(i));
  redirect(error ? `${learnPage(i)}?error=${encodeURIComponent(error)}` : learnPage(i));
}
