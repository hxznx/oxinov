'use server';

import { safeReturnTo } from '@oxinov/web-auth';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi } from '@/lib/edu-api.ts';

export interface FormState {
  error?: string;
}

const WORKSPACE_MESSAGES: Record<string, string> = {
  SLUG_UNAVAILABLE: 'That address is already taken. Try another one.',
  EMAIL_NOT_VERIFIED: 'Verify your email address before creating a learning space.',
  VALIDATION_FAILED: 'Use 3–63 lowercase letters, digits, or hyphens for the address, and a name of 2–120 characters.',
};

/** FR-TENANT: any verified member can create a workspace and becomes its owner. */
export async function createWorkspace(_: FormState, form: FormData): Promise<FormState> {
  const session = await auth.currentSession('/');
  if (!session) redirect('/auth/login');

  const name = String(form.get('name') ?? '').trim();
  const slug = String(form.get('slug') ?? '').trim().toLowerCase();
  if (name.length < 2) return { error: 'Enter the name of your school or training centre.' };
  if (!/^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])$/.test(slug)) return { error: WORKSPACE_MESSAGES.VALIDATION_FAILED };

  let created: { slug: string };
  try {
    created = await eduApi.createWorkspace(session.accessToken, { name, slug });
  } catch (error) {
    if (error instanceof EduApiError) return { error: WORKSPACE_MESSAGES[error.code] ?? error.message };
    return { error: 'Oxinov Edu is unavailable. Try again shortly.' };
  }
  redirect(`/w/${created.slug}`);
}

/** FR-CATALOG-303: free courses enroll immediately; paid courses wait for checkout. */
export async function enroll(_: FormState, form: FormData): Promise<FormState> {
  const tenantId = String(form.get('tenantId') ?? '');
  const courseId = String(form.get('courseId') ?? '');
  const returnTo = safeReturnTo(String(form.get('returnTo') ?? '/'));
  const session = await auth.currentSession(returnTo);
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);

  try {
    await eduApi.enroll(session.accessToken, tenantId, courseId);
  } catch (error) {
    if (error instanceof EduApiError && error.code === 'PAYMENT_REQUIRED') {
      return { error: 'This is a paid course. Online payment with Khalti and eSewa is coming soon.' };
    }
    if (error instanceof EduApiError) return { error: error.message };
    return { error: 'Oxinov Edu is unavailable. Try again shortly.' };
  }
  redirect(returnTo);
}
