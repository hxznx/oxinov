'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi } from '@/lib/edu-api.ts';
import { PLAN_PERIODS, type PlanPeriod } from '@/lib/store.ts';
import { CATEGORIES, KINDS } from '@/lib/storefront.ts';

/**
 * Store actions (ADR-028): entering the store from an offering page, and the kind and category of an
 * offering in Oxinov Studio. The Edu API enforces every rule; these only check input shape.
 */

export interface ListingFormState {
  error?: string;
  ok?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OFFERING_SLUG = /^[a-z0-9][a-z0-9-]{0,119}$/;
const WORKSPACE_SLUG = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const field = (form: FormData, name: string): string => String(form.get(name) ?? '').trim();

/**
 * "Continue to payment" or "Start free" on an offering page: signs the visitor in if needed, makes them a
 * learner of the store (no join code), and opens the course with the chosen plan ready to pay.
 */
export async function enterStore(form: FormData): Promise<void> {
  const [offering, courseId] = [field(form, 'offering'), field(form, 'courseId')];
  if (!OFFERING_SLUG.test(offering) || !UUID.test(courseId)) redirect('/');
  const plan = field(form, 'plan') as PlanPeriod;
  const chosen = PLAN_PERIODS.includes(plan) ? plan : undefined;
  const back = `/o/${offering}${chosen ? `?plan=${chosen}` : ''}`;

  const session = await auth.currentSession(back);
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(back)}`);

  let storeSlug: string;
  try {
    ({ slug: storeSlug } = await eduApi.joinStore(session.accessToken));
  } catch (error) {
    const reason = error instanceof EduApiError && error.status === 403 ? 'suspended' : 'unavailable';
    redirect(`/o/${offering}?problem=${reason}`);
  }
  redirect(`/w/${storeSlug}/courses/${courseId}${chosen ? `?plan=${chosen}#plans` : ''}`);
}

/** Studio: an offering's kind and store category (ADR-028 point 1). */
export async function saveListing(_: ListingFormState, form: FormData): Promise<ListingFormState> {
  const [slug, tenantId, courseId] = [field(form, 'slug'), field(form, 'tenantId'), field(form, 'courseId')];
  const kind = KINDS.find((value) => value === field(form, 'kind'));
  const category = CATEGORIES.find((value) => value === field(form, 'category'));
  if (!WORKSPACE_SLUG.test(slug) || !UUID.test(tenantId) || !UUID.test(courseId) || !kind || !category) {
    return { error: 'This page is out of date. Reload and try again.' };
  }
  const returnTo = `/w/${slug}/studio/offerings`;
  const session = await auth.currentSession(returnTo);
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  try {
    await eduApi.setListing(session.accessToken, tenantId, courseId, { kind, category });
  } catch (error) {
    return { error: error instanceof EduApiError ? error.message : 'Oxinov Edu is unavailable. Try again shortly.' };
  }
  revalidatePath(`/w/${slug}/studio`, 'layout');
  revalidatePath('/');
  return { ok: 'Saved' };
}
