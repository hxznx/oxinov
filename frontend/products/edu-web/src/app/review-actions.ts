'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { FormState } from '@/app/actions';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi } from '@/lib/edu-api.ts';
import { reviewFromForm } from '@/lib/reviews.ts';

/** Ratings and reviews (FR-CATALOG-304). The Edu API checks access, roles, and the workspace. */

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

/** Learner: write or change their review; it waits for the store's approval. */
export async function saveReview(_: FormState, form: FormData): Promise<FormState & { saved?: boolean }> {
  const [slug, tenantId, courseId] = [field(form, 'slug'), field(form, 'tenantId'), field(form, 'courseId')];
  if (!SLUG.test(slug) || !UUID.test(tenantId) || !UUID.test(courseId)) return { error: STALE };
  const review = reviewFromForm(form);
  if ('error' in review) return { error: review.error };
  const here = `/w/${slug}/courses/${courseId}`;
  try {
    await eduApi.saveReview(await token(here), tenantId, courseId, review);
  } catch (error) {
    return { error: failure(error) };
  }
  revalidatePath(here);
  return { error: undefined, saved: true };
}

export async function withdrawReview(_: FormState, form: FormData): Promise<FormState> {
  const [slug, tenantId, courseId] = [field(form, 'slug'), field(form, 'tenantId'), field(form, 'courseId')];
  if (!SLUG.test(slug) || !UUID.test(tenantId) || !UUID.test(courseId)) return { error: STALE };
  const here = `/w/${slug}/courses/${courseId}`;
  try {
    await eduApi.withdrawReview(await token(here), tenantId, courseId);
  } catch (error) {
    return { error: failure(error) };
  }
  revalidatePath(here);
  return { error: undefined };
}

/** Administrators: approve a waiting review, or hide one with a reason only administrators see. */
export async function moderateReview(_: FormState, form: FormData): Promise<FormState> {
  const [slug, tenantId, reviewId, step] = [field(form, 'slug'), field(form, 'tenantId'), field(form, 'reviewId'), field(form, 'step')];
  if (!SLUG.test(slug) || !UUID.test(tenantId) || !UUID.test(reviewId) || !['approve', 'hide'].includes(step)) return { error: STALE };
  const reason = field(form, 'reason');
  if (step === 'hide' && reason.length < 3) return { error: 'Write why you are hiding it (only administrators see this).' };
  const here = `/w/${slug}/studio/reviews`;
  try {
    const access = await token(here);
    if (step === 'approve') await eduApi.approveReview(access, tenantId, reviewId);
    else await eduApi.hideReview(access, tenantId, reviewId, reason);
  } catch (error) {
    return { error: failure(error) };
  }
  revalidatePath(`/w/${slug}/studio`, 'layout');
  return { error: undefined };
}
