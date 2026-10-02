'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { FormState } from '@/app/actions';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi } from '@/lib/edu-api.ts';

/** Account deletion with a 14-day wait (FR-PRIV-3202). The Edu API checks the confirmation and ownership. */

const HERE = '/account/privacy';
const failure = (error: unknown) => (error instanceof EduApiError ? error.message : 'Oxinov Edu is unavailable. Try again shortly.');

async function token(): Promise<string> {
  const session = await auth.currentSession(HERE);
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(HERE)}`);
  return session.accessToken;
}

export async function requestDeletion(_: FormState, form: FormData): Promise<FormState> {
  const confirm = String(form.get('confirm') ?? '').trim();
  if (confirm !== 'DELETE') return { error: 'Type DELETE to confirm.' };
  try {
    await eduApi.requestDeletion(await token(), confirm);
  } catch (error) {
    return { error: failure(error) };
  }
  revalidatePath('/account', 'layout');
  return { error: undefined };
}

export async function cancelDeletion(_: FormState): Promise<FormState> {
  try {
    await eduApi.cancelDeletion(await token());
  } catch (error) {
    return { error: failure(error) };
  }
  revalidatePath('/account', 'layout');
  return { error: undefined };
}
