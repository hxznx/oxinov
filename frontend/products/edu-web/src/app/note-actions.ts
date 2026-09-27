'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi } from '@/lib/edu-api.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Result = { ok: true } | { ok: false; error: string };

async function token(): Promise<string | null> {
  return (await auth.currentSession('/'))?.accessToken ?? null;
}

const failure = (error: unknown): Result => ({ ok: false, error: error instanceof EduApiError ? error.message : 'Oxinov Edu is unavailable. Try again shortly.' });

/** Private notes (FR-PLAYER-403). `path` is the page to refresh afterwards. */
export async function addNote(input: { tenantId: string; courseId: string; lessonId: string; body: string; timestampSec: number | null; path: string }): Promise<Result> {
  if (![input.tenantId, input.courseId, input.lessonId].every((id) => UUID.test(id))) return { ok: false, error: 'This page is out of date. Reload and try again.' };
  if (!input.body.trim()) return { ok: false, error: 'Write something first.' };
  const access = await token();
  if (!access) return { ok: false, error: 'Your session ended. Sign in again.' };
  try {
    const timestampSec = input.timestampSec === null ? null : Math.max(0, Math.floor(input.timestampSec));
    await eduApi.addNote(access, input.tenantId, input.courseId, input.lessonId, { body: input.body.slice(0, 5000), timestampSec });
  } catch (error) {
    return failure(error);
  }
  if (input.path.startsWith('/w/')) revalidatePath(input.path);
  return { ok: true };
}

export async function editNote(input: { tenantId: string; noteId: string; body: string; path: string }): Promise<Result> {
  if (!UUID.test(input.tenantId) || !UUID.test(input.noteId)) return { ok: false, error: 'This page is out of date. Reload and try again.' };
  if (!input.body.trim()) return { ok: false, error: 'A note cannot be empty. Delete it instead.' };
  const access = await token();
  if (!access) return { ok: false, error: 'Your session ended. Sign in again.' };
  try {
    await eduApi.updateNote(access, input.tenantId, input.noteId, { body: input.body.slice(0, 5000) });
  } catch (error) {
    return failure(error);
  }
  if (input.path.startsWith('/w/')) revalidatePath(input.path);
  return { ok: true };
}

export async function removeNote(input: { tenantId: string; noteId: string; path: string }): Promise<Result> {
  if (!UUID.test(input.tenantId) || !UUID.test(input.noteId)) return { ok: false, error: 'This page is out of date. Reload and try again.' };
  const access = await token();
  if (!access) return { ok: false, error: 'Your session ended. Sign in again.' };
  try {
    await eduApi.deleteNote(access, input.tenantId, input.noteId);
  } catch (error) {
    return failure(error);
  }
  if (input.path.startsWith('/w/')) revalidatePath(input.path);
  return { ok: true };
}
