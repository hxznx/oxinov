'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { FormState } from '@/app/actions';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi, type GrantLength } from '@/lib/edu-api.ts';

/** Free access grants (FR-MGMT-1404). The Edu API checks the role, the member, and the offering. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const LENGTHS: readonly GrantLength[] = ['DAYS_7', 'MONTH_1', 'MONTH_6', 'YEAR_1', 'LIFETIME'];
const field = (form: FormData, name: string): string => String(form.get(name) ?? '').trim();
const STALE = 'This page is out of date. Reload and try again.';

async function token(returnTo: string): Promise<string> {
  const session = await auth.currentSession(returnTo);
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  return session.accessToken;
}

export async function giveAccess(_: FormState, form: FormData): Promise<FormState & { saved?: string }> {
  const [slug, tenantId, courseId] = [field(form, 'slug'), field(form, 'tenantId'), field(form, 'courseId')];
  if (!SLUG.test(slug) || !UUID.test(tenantId)) return { error: STALE };
  if (!UUID.test(courseId)) return { error: 'Choose an offering.' };
  const email = field(form, 'email');
  const reason = field(form, 'reason');
  const length = LENGTHS.find((value) => value === field(form, 'length'));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter the learner’s email address.' };
  if (!length) return { error: 'Choose how long the access lasts.' };
  if (reason.length < 3) return { error: 'Write a reason (kept in the audit log), for example "Scholarship".' };
  const here = `/w/${slug}/studio/access`;
  try {
    const grant = await eduApi.grantAccess(await token(here), tenantId, { email, courseId, length, reason });
    revalidatePath(here);
    return { error: undefined, saved: `Access given to ${grant.learnerEmail ?? email} for ${grant.courseTitle}. They were notified.` };
  } catch (error) {
    return { error: error instanceof EduApiError ? (error.status === 404 ? 'No member with that email, or that offering is not published. The learner must have joined this workspace.' : error.message) : 'Oxinov Edu is unavailable. Try again shortly.' };
  }
}

export async function revokeAccess(_: FormState, form: FormData): Promise<FormState> {
  const [slug, tenantId, grantId] = [field(form, 'slug'), field(form, 'tenantId'), field(form, 'grantId')];
  if (!SLUG.test(slug) || !UUID.test(tenantId) || !UUID.test(grantId)) return { error: STALE };
  const reason = field(form, 'reason');
  if (reason.length < 3) return { error: 'Write why you are ending this access.' };
  const here = `/w/${slug}/studio/access`;
  try {
    await eduApi.revokeGrant(await token(here), tenantId, grantId, reason);
  } catch (error) {
    return { error: error instanceof EduApiError ? error.message : 'Oxinov Edu is unavailable. Try again shortly.' };
  }
  revalidatePath(here);
  return { error: undefined };
}
