'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { FormState } from '@/app/actions';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi } from '@/lib/edu-api.ts';
import { safeLinkPath } from '@/lib/notifications.ts';

/** Notifications (FR-COMM-704): open, mark read, and administrators' notices. The Edu API checks ownership. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const field = (form: FormData, name: string): string => String(form.get(name) ?? '').trim();

async function token(returnTo: string): Promise<string> {
  const session = await auth.currentSession(returnTo);
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  return session.accessToken;
}

/** Marks one notification read and opens where it points, inside Oxinov Edu only. */
export async function openNotification(form: FormData): Promise<void> {
  const [tenantId, id] = [field(form, 'tenantId'), field(form, 'id')];
  const target = safeLinkPath(field(form, 'linkPath')) ?? '/account/notifications';
  if (UUID.test(tenantId) && UUID.test(id)) {
    await eduApi.readNotification(await token('/account/notifications'), tenantId, id).catch(() => undefined);
    revalidatePath('/account', 'layout');
  }
  redirect(target);
}

export async function readAllNotifications(form: FormData): Promise<void> {
  const tenantId = field(form, 'tenantId');
  if (!UUID.test(tenantId)) return;
  await eduApi.readAllNotifications(await token('/account/notifications'), tenantId).catch(() => undefined);
  revalidatePath('/account', 'layout');
}

/** Studio: a notice to every member of the workspace (design screen 8). */
export async function sendNotice(_: FormState, form: FormData): Promise<FormState & { sent?: number; emailedNow?: number; emailWaiting?: number }> {
  const [slug, tenantId] = [field(form, 'slug'), field(form, 'tenantId')];
  if (!SLUG.test(slug) || !UUID.test(tenantId)) return { error: 'This page is out of date. Reload and try again.' };
  const title = field(form, 'title');
  const body = field(form, 'body');
  const link = field(form, 'linkPath');
  const courseId = field(form, 'courseId');
  if (courseId && !UUID.test(courseId)) return { error: 'This page is out of date. Reload and try again.' };
  if (title.length < 3) return { error: 'Give the notice a title of at least 3 characters.' };
  if (!body) return { error: 'Write the message.' };
  const linkPath = link ? safeLinkPath(link) : undefined;
  if (link && !linkPath) return { error: 'The link must be a page on Oxinov Edu, starting with /, for example /o/japanese-n5.' };
  try {
    const email = form.get('email') === 'on';
    const result = await eduApi.sendNotice(await token(`/w/${slug}/studio`), tenantId, {
      title,
      body,
      ...(linkPath ? { linkPath } : {}),
      ...(courseId ? { courseId } : {}),
      ...(email ? { email: true } : {}),
    });
    return { error: undefined, sent: result.recipients, emailedNow: result.emailedNow, emailWaiting: result.emailWaiting };
  } catch (error) {
    return { error: error instanceof EduApiError ? error.message : 'Oxinov Edu is unavailable. Try again shortly.' };
  }
}
