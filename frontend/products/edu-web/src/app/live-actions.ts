'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { FormState } from '@/app/actions';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi } from '@/lib/edu-api.ts';
import { nepalTimeToIso } from '@/lib/content.ts';

/** Live classes (ADR-028 point 8): teachers schedule and cancel them; the Edu API enforces who may. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const STALE = 'This page is out of date. Reload and try again.';
const field = (form: FormData, name: string): string => String(form.get(name) ?? '').trim();
const message = (error: unknown): string => (error instanceof EduApiError ? error.message : 'Oxinov Edu is unavailable. Try again shortly.');

async function token(returnTo: string): Promise<string> {
  const session = await auth.currentSession(returnTo);
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  return session.accessToken;
}

export async function scheduleLiveClass(_: FormState, form: FormData): Promise<FormState> {
  const [slug, tenantId, courseId] = [field(form, 'slug'), field(form, 'tenantId'), field(form, 'courseId')];
  if (!SLUG.test(slug) || !UUID.test(tenantId) || !UUID.test(courseId)) return { error: STALE };
  const title = field(form, 'title');
  const startsAt = nepalTimeToIso(field(form, 'startsAt'));
  const durationMin = Number(field(form, 'durationMin'));
  const joinUrl = field(form, 'joinUrl');
  const visibility = field(form, 'visibility') === 'FREE' ? 'FREE' : 'SUBSCRIBERS';
  if (!title) return { error: 'Give the class a title.' };
  if (!startsAt) return { error: 'Choose the date and start time.' };
  if (new Date(startsAt).getTime() < Date.now() - 60 * 60 * 1000) return { error: 'That time has already passed.' };
  if (!Number.isInteger(durationMin) || durationMin < 5 || durationMin > 600) return { error: 'Length must be between 5 and 600 minutes.' };
  const here = `/w/${slug}/teach/${courseId}`;
  try {
    await eduApi.createLiveSession(await token(here), tenantId, courseId, { title, startsAt, durationMin, joinUrl, visibility });
  } catch (error) {
    return { error: message(error) };
  }
  revalidatePath(here);
  revalidatePath(`/w/${slug}/courses/${courseId}`);
  return { error: undefined };
}

export async function cancelLiveClass(form: FormData): Promise<void> {
  const [slug, tenantId, courseId, sessionId] = [field(form, 'slug'), field(form, 'tenantId'), field(form, 'courseId'), field(form, 'sessionId')];
  if (!SLUG.test(slug) || !UUID.test(tenantId) || !UUID.test(courseId) || !UUID.test(sessionId)) return;
  const here = `/w/${slug}/teach/${courseId}`;
  try {
    await eduApi.updateLiveSession(await token(here), tenantId, sessionId, { cancelled: true });
  } catch {
    // The list shows the class's real state after the refresh below.
  }
  revalidatePath(here);
  revalidatePath(`/w/${slug}/courses/${courseId}`);
}
