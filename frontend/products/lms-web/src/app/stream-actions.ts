'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi } from '@/lib/edu-api.ts';
import { type StreamAction, streamRequest } from '@/lib/stream.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Result = { ok: true } | { ok: false; error: string };

/** One entry point for class stream changes (FR-COMM-701/702). `path` is the page to refresh afterwards. */
export async function streamAction(input: { tenantId: string; action: StreamAction; path: string }): Promise<Result> {
  if (!UUID.test(input.tenantId)) return { ok: false, error: 'This page is out of date. Reload and try again.' };
  const request = streamRequest(input.action);
  if ('error' in request) return { ok: false, error: request.error };
  const access = (await auth.currentSession('/'))?.accessToken;
  if (!access) return { ok: false, error: 'Your session ended. Sign in again.' };
  try {
    await eduApi.streamCall(access, input.tenantId, request.method, request.path, request.body);
  } catch (error) {
    return { ok: false, error: error instanceof EduApiError ? error.message : 'Oxinov Edu is unavailable. Try again shortly.' };
  }
  if (input.path.startsWith('/w/')) revalidatePath(input.path);
  return { ok: true };
}
