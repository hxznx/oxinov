'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi, type UploadTicket } from '@/lib/edu-api.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

async function token(): Promise<string | null> {
  return (await auth.currentSession('/'))?.accessToken ?? null;
}

const failure = (error: unknown): { ok: false; error: string } => ({
  ok: false,
  error: error instanceof EduApiError ? error.message : 'Oxinov Edu is unavailable. Try again shortly.',
});

/** Step 1 of an upload: a signed URL the browser sends the file to directly. */
export async function requestUpload(input: {
  tenantId: string;
  kind: 'VIDEO' | 'AUDIO';
  contentType: string;
  sizeBytes: number;
  fileName: string;
}): Promise<Result<UploadTicket>> {
  if (!UUID.test(input.tenantId) || !['VIDEO', 'AUDIO'].includes(input.kind)) return { ok: false, error: 'This page is out of date. Reload and try again.' };
  const access = await token();
  if (!access) return { ok: false, error: 'Your session ended. Sign in again.' };
  try {
    const { tenantId, ...body } = input;
    return { ok: true, value: await eduApi.createUpload(access, tenantId, body) };
  } catch (error) {
    return failure(error);
  }
}

/** Step 2: the API checks the stored file, then the lesson is linked to it. */
export async function finishUpload(input: {
  slug: string;
  tenantId: string;
  courseId: string;
  lessonId: string;
  mediaId: string;
  durationSec: number;
}): Promise<Result<{ fileName: string }>> {
  const ids = [input.tenantId, input.courseId, input.lessonId, input.mediaId];
  if (!SLUG.test(input.slug) || !ids.every((id) => UUID.test(id))) return { ok: false, error: 'This page is out of date. Reload and try again.' };
  const access = await token();
  if (!access) return { ok: false, error: 'Your session ended. Sign in again.' };
  try {
    const media = await eduApi.completeUpload(access, input.tenantId, input.mediaId, Math.max(1, Math.round(input.durationSec)));
    await eduApi.draftCall(access, input.tenantId, input.courseId, 'PATCH', `/lessons/${input.lessonId}`, { mediaId: media.id });
    revalidatePath(`/w/${input.slug}/teach/${input.courseId}`, 'layout');
    return { ok: true, value: { fileName: media.fileName } };
  } catch (error) {
    return failure(error);
  }
}

/** Playback progress for resume and completion (FR-PLAYER-402). Failures are silent; the next save retries. */
export async function savePlayback(input: { tenantId: string; mediaId: string; positionSec: number; playedSec: number }): Promise<{ completed: boolean } | null> {
  if (!UUID.test(input.tenantId) || !UUID.test(input.mediaId)) return null;
  const access = await token();
  if (!access) return null;
  try {
    const saved = await eduApi.saveProgress(access, input.tenantId, input.mediaId, {
      positionSec: Math.max(0, Math.floor(input.positionSec)),
      playedSec: Math.max(0, Math.min(3600, Math.round(input.playedSec))),
    });
    return { completed: saved.completed };
  } catch {
    return null;
  }
}
