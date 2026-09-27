'use server';

import { safeReturnTo } from '@oxinov/web-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi, type PaymentProvider } from '@/lib/edu-api.ts';

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
      return { error: 'This is a paid course. Buy it with Khalti or eSewa below.' };
    }
    if (error instanceof EduApiError) return { error: error.message };
    return { error: 'Oxinov Edu is unavailable. Try again shortly.' };
  }
  redirect(returnTo);
}

export interface CheckoutState {
  error?: string;
  /** eSewa takes a signed form posted by the browser; Khalti is a plain redirect done on the server. */
  form?: { url: string; fields: Record<string, string> };
}

const PROVIDER_HOSTS: Record<PaymentProvider, RegExp> = {
  KHALTI: /^https:\/\/([a-z0-9-]+\.)*khalti\.com\//,
  ESEWA: /^https:\/\/([a-z0-9-]+\.)*esewa\.com\.np\//,
};

/**
 * Starts a Khalti or eSewa checkout (FR-CATALOG-303, ADR-023). The API creates the pending payment and
 * says where to send the learner; access is granted only after the return page has the API verify it.
 */
export async function startCheckout(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const tenantId = String(form.get('tenantId') ?? '');
  const courseId = String(form.get('courseId') ?? '');
  const provider = String(form.get('provider') ?? '') as PaymentProvider;
  const returnTo = safeReturnTo(String(form.get('returnTo') ?? '/'));
  if (provider !== 'KHALTI' && provider !== 'ESEWA') return { error: 'Choose Khalti or eSewa.' };
  const session = await auth.currentSession(returnTo);
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);

  let redirectTo;
  try {
    ({ redirect: redirectTo } = await eduApi.startCheckout(session.accessToken, tenantId, courseId, provider));
  } catch (error) {
    if (error instanceof EduApiError) return { error: error.message };
    return { error: 'Payment could not be started. Try again shortly.' };
  }
  // Only ever send people to the provider's own site.
  if (!PROVIDER_HOSTS[provider].test(redirectTo.url)) return { error: 'Payment could not be started. Try again shortly.' };
  if (redirectTo.method === 'POST') return { form: { url: redirectTo.url, fields: redirectTo.fields } };
  redirect(redirectTo.url);
}

/** FR-PLAYER-402: the learner confirms a text lesson as done; the page then shows the new progress. */
export async function completeLesson(_: FormState, form: FormData): Promise<FormState> {
  const tenantId = String(form.get('tenantId') ?? '');
  const courseId = String(form.get('courseId') ?? '');
  const lessonId = String(form.get('lessonId') ?? '');
  const returnTo = safeReturnTo(String(form.get('returnTo') ?? '/'));
  const session = await auth.currentSession(returnTo);
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  try {
    await eduApi.completeLesson(session.accessToken, tenantId, courseId, lessonId);
  } catch (error) {
    if (error instanceof EduApiError) return { error: error.message };
    return { error: 'Oxinov Edu is unavailable. Try again shortly.' };
  }
  revalidatePath(returnTo);
  return {};
}

/** FR-CERT-602: school administrators revoke a certificate with a recorded reason. */
export async function revokeCertificate(_: FormState, form: FormData): Promise<FormState> {
  const tenantId = String(form.get('tenantId') ?? '');
  const code = String(form.get('code') ?? '');
  const reason = String(form.get('reason') ?? '').trim();
  const returnTo = safeReturnTo(String(form.get('returnTo') ?? '/'));
  if (reason.length < 3) return { error: 'Give a reason of at least 3 characters.' };
  const session = await auth.currentSession(returnTo);
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  try {
    await eduApi.revokeCertificate(session.accessToken, tenantId, code, reason);
  } catch (error) {
    if (error instanceof EduApiError) return { error: error.message };
    return { error: 'Oxinov Edu is unavailable. Try again shortly.' };
  }
  revalidatePath(returnTo);
  return {};
}
