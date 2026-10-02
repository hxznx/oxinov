'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { FormState } from '@/app/actions';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi, type TenantRole } from '@/lib/edu-api.ts';
import { ROLES } from '@/lib/team.ts';

/** Team and roles (FR-AUTH-102): the Edu API decides who may change whom; these check input shape only. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const field = (form: FormData, name: string): string => String(form.get(name) ?? '').trim();

export async function changeMember(_: FormState, form: FormData): Promise<FormState & { saved?: boolean }> {
  const [slug, tenantId, userId] = [field(form, 'slug'), field(form, 'tenantId'), field(form, 'userId')];
  if (!SLUG.test(slug) || !UUID.test(tenantId) || !UUID.test(userId)) return { error: 'This page is out of date. Reload and try again.' };
  const role = ROLES.find((value) => value === field(form, 'role')) as TenantRole | undefined;
  const statusField = field(form, 'status');
  const status = statusField === 'ACTIVE' || statusField === 'SUSPENDED' ? statusField : undefined;
  if (!role && !status) return { error: 'Choose a new role or access.' };
  const here = `/w/${slug}/studio/team`;
  const session = await auth.currentSession(here);
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(here)}`);
  try {
    await eduApi.updateMember(session.accessToken, tenantId, userId, { ...(role ? { role } : {}), ...(status ? { status } : {}) });
  } catch (error) {
    return { error: error instanceof EduApiError ? error.message : 'Oxinov Edu is unavailable. Try again shortly.' };
  }
  revalidatePath(`/w/${slug}/studio`, 'layout');
  return { error: undefined, saved: true };
}
