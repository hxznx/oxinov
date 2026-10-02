'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { FormState } from '@/app/actions';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi, type OxiAnswer } from '@/lib/edu-api.ts';
import { handoffMessage, messageProblem } from '@/lib/messages.ts';

/** Messages (FR-CHAT-1301) and OXI (FR-AI-1705). The Edu API checks membership, roles, and the workspace. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const field = (form: FormData, name: string): string => String(form.get(name) ?? '').trim();
const STALE = 'This page is out of date. Reload and try again.';
const failure = (error: unknown) => (error instanceof EduApiError ? error.message : 'Oxinov Edu is unavailable. Try again shortly.');

async function token(returnTo: string): Promise<string> {
  const session = await auth.currentSession(returnTo);
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  return session.accessToken;
}

/** OXI answers one question; nothing is stored. */
export async function askOxi(question: string): Promise<{ answer?: OxiAnswer; error?: string }> {
  const text = question.trim().slice(0, 500);
  try {
    return { answer: await eduApi.askOxi(await token('/account/messages'), text) };
  } catch (error) {
    return { error: failure(error) };
  }
}

/** Learner: a message to Oxinov support. */
export async function sendSupport(_: FormState, form: FormData): Promise<FormState & { sent?: number }> {
  const tenantId = field(form, 'tenantId');
  if (!UUID.test(tenantId)) return { error: STALE };
  const body = field(form, 'body');
  const problem = messageProblem(body);
  if (problem) return { error: problem };
  try {
    await eduApi.sendSupport(await token('/account/messages?c=support'), tenantId, body);
  } catch (error) {
    return { error: failure(error) };
  }
  revalidatePath('/account', 'layout');
  return { error: undefined, sent: Date.now() };
}

/** "Talk to a human": pass the learner's last question to support and open that conversation. */
export async function handToSupport(tenantId: string, question: string): Promise<{ error?: string }> {
  if (!UUID.test(tenantId)) return { error: STALE };
  try {
    await eduApi.sendSupport(await token('/account/messages'), tenantId, handoffMessage(question));
  } catch (error) {
    return { error: failure(error) };
  }
  revalidatePath('/account', 'layout');
  redirect('/account/messages?c=support');
}

/** Administrators: reply to a learner from the Studio inbox. */
export async function replySupport(_: FormState, form: FormData): Promise<FormState & { sent?: number }> {
  const [slug, tenantId, threadId] = [field(form, 'slug'), field(form, 'tenantId'), field(form, 'threadId')];
  if (!SLUG.test(slug) || !UUID.test(tenantId) || !UUID.test(threadId)) return { error: STALE };
  const body = field(form, 'body');
  const problem = messageProblem(body);
  if (problem) return { error: problem };
  try {
    await eduApi.replySupport(await token(`/w/${slug}/studio/inbox`), tenantId, threadId, body);
  } catch (error) {
    return { error: failure(error) };
  }
  revalidatePath(`/w/${slug}/studio`, 'layout');
  return { error: undefined, sent: Date.now() };
}
