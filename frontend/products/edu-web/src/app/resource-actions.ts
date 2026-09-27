'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi } from '@/lib/edu-api.ts';

const SLUG = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Ids = { slug: string; tenantId: string; courseId: string; lessonId: string };
type Result<T = undefined> = { ok: true; value: T } | { ok: false; error: string };

const valid = (ids: Ids) => SLUG.test(ids.slug) && [ids.tenantId, ids.courseId, ids.lessonId].every((id) => UUID.test(id));
const page = (ids: Ids) => `/w/${ids.slug}/teach/${ids.courseId}/lessons/${ids.lessonId}`;
const failure = (error: unknown): { ok: false; error: string } => ({
  ok: false,
  error: error instanceof EduApiError ? error.message : 'Oxinov Edu is unavailable. Try again shortly.',
});

async function token(): Promise<string | null> {
  return (await auth.currentSession('/'))?.accessToken ?? null;
}

async function withToken<T>(ids: Ids, work: (access: string) => Promise<T>): Promise<Result<T>> {
  if (!valid(ids)) return { ok: false, error: 'This page is out of date. Reload and try again.' };
  const access = await token();
  if (!access) return { ok: false, error: 'Your session ended. Sign in again.' };
  try {
    const value = await work(access);
    revalidatePath(page(ids));
    return { ok: true, value };
  } catch (error) {
    return failure(error);
  }
}

/** Step 1: a signed URL for uploading the document straight to storage. */
export async function startResourceUpload(ids: Ids, file: { fileName: string; contentType: string; sizeBytes: number }) {
  return withToken(ids, (access) => eduApi.startResourceUpload(access, ids.tenantId, ids.courseId, file));
}

/** Step 2: the API checks the stored file, then it is attached to the lesson under `title`. */
export async function finishResourceUpload(ids: Ids, fileId: string, title: string) {
  if (!UUID.test(fileId)) return { ok: false as const, error: 'This upload is not valid. Try again.' };
  return withToken(ids, async (access) => {
    await eduApi.completeResourceUpload(access, ids.tenantId, ids.courseId, fileId);
    await eduApi.draftCall(access, ids.tenantId, ids.courseId, 'POST', `/lessons/${ids.lessonId}/resources`, { title: title.trim() || 'Resource', fileId });
  });
}

export async function addLinkResource(ids: Ids, title: string, url: string) {
  return withToken(ids, (access) =>
    eduApi.draftCall(access, ids.tenantId, ids.courseId, 'POST', `/lessons/${ids.lessonId}/resources`, { title: title.trim() || url, url: url.trim() }),
  );
}

export async function renameResource(ids: Ids, resourceId: string, title: string) {
  if (!UUID.test(resourceId)) return { ok: false as const, error: 'This page is out of date. Reload and try again.' };
  return withToken(ids, (access) => eduApi.draftCall(access, ids.tenantId, ids.courseId, 'PATCH', `/resources/${resourceId}`, { title }));
}

export async function removeResource(ids: Ids, resourceId: string) {
  if (!UUID.test(resourceId)) return { ok: false as const, error: 'This page is out of date. Reload and try again.' };
  return withToken(ids, (access) => eduApi.draftCall(access, ids.tenantId, ids.courseId, 'DELETE', `/resources/${resourceId}`));
}
