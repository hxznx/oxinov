'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi, type TenantRole } from '@/lib/edu-api.ts';
import type { FormState } from './actions';

const SLUG = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLES: TenantRole[] = ['LEARNER', 'INSTRUCTOR', 'ADMIN'];

async function token(returnTo: string): Promise<string> {
  const session = await auth.currentSession(returnTo);
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  return session.accessToken;
}

/** Joins a learning space with a code from its administrator (FR-AUTH-102). */
export async function joinWithCode(_: FormState, form: FormData): Promise<FormState> {
  const code = String(form.get('code') ?? '').trim();
  if (code.replace(/[\s-]/g, '').length !== 8) return { error: 'Enter the 8-character code from your school, for example K7PX-9QMD.' };
  const access = await token(`/join?code=${encodeURIComponent(code)}`);
  let slug: string;
  try {
    slug = (await eduApi.redeemInvite(access, code)).slug;
  } catch (error) {
    if (error instanceof EduApiError && error.code === 'INVITE_INVALID') {
      return { error: 'That code is not valid or has expired. Check it with your school.' };
    }
    if (error instanceof EduApiError) return { error: error.message };
    return { error: 'Oxinov Edu is unavailable. Try again shortly.' };
  }
  redirect(`/w/${slug}`);
}

export interface CreateInviteState extends FormState {
  created?: { code: string; role: TenantRole };
}

export async function createInvite(_: CreateInviteState, form: FormData): Promise<CreateInviteState> {
  const slug = String(form.get('slug') ?? '');
  const tenantId = String(form.get('tenantId') ?? '');
  const role = String(form.get('role') ?? '') as TenantRole;
  const days = Number(form.get('expiresInDays') ?? 14);
  const maxUsesRaw = String(form.get('maxUses') ?? '').trim();
  const maxUses = maxUsesRaw ? Number(maxUsesRaw) : undefined;
  if (!SLUG.test(slug) || !UUID.test(tenantId) || !ROLES.includes(role)) return { error: 'Choose who the code is for.' };
  if (!Number.isInteger(days) || days < 1 || days > 90) return { error: 'Choose how long the code works (1–90 days).' };
  if (maxUses !== undefined && (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 1000)) {
    return { error: 'The limit must be a whole number from 1 to 1000, or empty for no limit.' };
  }
  const access = await token(`/w/${slug}/people`);
  try {
    const invite = await eduApi.createInvite(access, tenantId, { role, expiresInDays: days, ...(maxUses ? { maxUses } : {}) });
    revalidatePath(`/w/${slug}/people`);
    return { created: { code: invite.code, role: invite.role } };
  } catch (error) {
    return { error: error instanceof EduApiError ? error.message : 'Oxinov Edu is unavailable. Try again shortly.' };
  }
}

export async function revokeInvite(form: FormData): Promise<void> {
  const slug = String(form.get('slug') ?? '');
  const tenantId = String(form.get('tenantId') ?? '');
  const inviteId = String(form.get('inviteId') ?? '');
  if (!SLUG.test(slug) || !UUID.test(tenantId) || !UUID.test(inviteId)) return;
  const access = await token(`/w/${slug}/people`);
  await eduApi.revokeInvite(access, tenantId, inviteId).catch(() => undefined);
  revalidatePath(`/w/${slug}/people`);
}
