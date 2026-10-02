'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi, type Draft } from '@/lib/edu-api.ts';
import { suggestSlug } from '@/lib/format.ts';
import type { FormState } from './actions';

const SLUG = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Target {
  slug: string;
  tenantId: string;
  courseId: string;
  editor: string;
  token: string;
}

async function target(form: FormData): Promise<Target> {
  const slug = String(form.get('slug') ?? '');
  const tenantId = String(form.get('tenantId') ?? '');
  const courseId = String(form.get('courseId') ?? '');
  if (!SLUG.test(slug) || !UUID.test(tenantId) || !UUID.test(courseId)) redirect('/');
  const editor = `/w/${slug}/teach/${courseId}`;
  const session = await auth.currentSession(editor);
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(editor)}`);
  return { slug, tenantId, courseId, editor, token: session.accessToken };
}

const message = (error: unknown) =>
  error instanceof EduApiError ? error.message : 'Oxinov Edu is unavailable. Your last change was not saved; try again.';

/** Runs a button action and returns to the editor, carrying any error message for display. */
async function act(form: FormData, change: (t: Target) => Promise<unknown>, next?: (t: Target) => string): Promise<never> {
  const t = await target(form);
  let error: string | undefined;
  try {
    await change(t);
  } catch (caught) {
    error = message(caught);
  }
  revalidatePath(t.editor, 'layout');
  redirect(error ? `${t.editor}?error=${encodeURIComponent(error.slice(0, 300))}` : (next?.(t) ?? t.editor));
}

const id = (form: FormData, name: string) => {
  const value = String(form.get(name) ?? '');
  return UUID.test(value) ? value : '00000000-0000-4000-8000-000000000000';
};

export async function createCourse(_: FormState, form: FormData): Promise<FormState> {
  const slug = String(form.get('slug') ?? '');
  const tenantId = String(form.get('tenantId') ?? '');
  const title = String(form.get('title') ?? '').trim();
  const summary = String(form.get('summary') ?? '').trim();
  const language = String(form.get('language') ?? 'en');
  const currency = String(form.get('currency') ?? 'NPR');
  const price = Number(form.get('price') ?? 0);
  if (!SLUG.test(slug) || !UUID.test(tenantId)) return { error: 'This page is out of date. Reload and try again.' };
  if (title.length < 3) return { error: 'Give the course a title of at least 3 characters.' };
  if (summary.length < 10) return { error: 'Write a one-sentence summary of at least 10 characters.' };
  if (!Number.isFinite(price) || price < 0) return { error: 'Enter a price of 0 or more.' };
  const session = await auth.currentSession(`/w/${slug}/teach`);
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(`/w/${slug}/teach`)}`);

  const courseSlug = `${suggestSlug(title).slice(0, 100) || 'course'}-${Date.now().toString(36)}`;
  // JPY has no minor unit; other supported currencies use two decimals.
  const priceMinor = Math.round(currency === 'JPY' ? price : price * 100);
  let courseId: string;
  try {
    courseId = (await eduApi.createCourse(session.accessToken, tenantId, { slug: courseSlug, title, summary, language, priceMinor, currency })).id;
  } catch (error) {
    return { error: message(error) };
  }
  redirect(`/w/${slug}/teach/${courseId}`);
}

export async function startEditing(form: FormData) {
  return act(form, (t) => eduApi.draftCall(t.token, t.tenantId, t.courseId, 'POST', ''));
}

export async function saveDetails(_: FormState, form: FormData): Promise<FormState> {
  const t = await target(form);
  const currency = String(form.get('currency') ?? 'NPR');
  const price = Number(form.get('price') ?? 0);
  const outcomes = String(form.get('outcomes') ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20);
  try {
    await eduApi.draftCall(t.token, t.tenantId, t.courseId, 'PATCH', '', {
      title: String(form.get('title') ?? '').trim(),
      summary: String(form.get('summary') ?? '').trim(),
      description: String(form.get('description') ?? ''),
      language: String(form.get('language') ?? 'en'),
      outcomes,
      currency,
      priceMinor: Math.round(currency === 'JPY' ? price : price * 100),
    });
  } catch (error) {
    return { error: message(error) };
  }
  revalidatePath(t.editor, 'layout');
  return { error: undefined };
}

export async function addSection(form: FormData) {
  const title = String(form.get('title') ?? '').trim() || 'New chapter';
  return act(form, (t) => eduApi.draftCall(t.token, t.tenantId, t.courseId, 'POST', '/sections', { title }));
}

export async function renameSection(form: FormData) {
  const title = String(form.get('title') ?? '').trim();
  return act(form, (t) => eduApi.draftCall(t.token, t.tenantId, t.courseId, 'PATCH', `/sections/${id(form, 'sectionId')}`, { title }));
}

export async function deleteSection(form: FormData) {
  return act(form, (t) => eduApi.draftCall(t.token, t.tenantId, t.courseId, 'DELETE', `/sections/${id(form, 'sectionId')}`));
}

/** Adds a text, video, audio, or document lesson and opens it in the lesson editor. */
export async function addLesson(form: FormData) {
  const sectionId = id(form, 'sectionId');
  const title = String(form.get('title') ?? '').trim() || 'New lesson';
  const requested = String(form.get('kind') ?? 'TEXT');
  const kind = requested === 'VIDEO' || requested === 'AUDIO' || requested === 'DOCUMENT' ? requested : 'TEXT';
  let lessonId = '';
  return act(
    form,
    async (t) => {
      const draft = await eduApi.draftCall(t.token, t.tenantId, t.courseId, 'POST', `/sections/${sectionId}/lessons`, { title, kind });
      const lessons = draft.sections.find((section) => section.id === sectionId)?.lessons ?? [];
      lessonId = lessons[lessons.length - 1]?.id ?? '';
    },
    (t) => (lessonId ? `${t.editor}/lessons/${lessonId}` : t.editor),
  );
}

export async function saveLesson(_: FormState, form: FormData): Promise<FormState> {
  const t = await target(form);
  const minutes = Number(form.get('minutes') ?? 0);
  try {
    await eduApi.draftCall(t.token, t.tenantId, t.courseId, 'PATCH', `/lessons/${id(form, 'lessonId')}`, {
      title: String(form.get('title') ?? '').trim(),
      bodyMarkdown: String(form.get('bodyMarkdown') ?? ''),
      isPreview: form.get('isPreview') === 'on',
      isRequired: form.get('isRequired') === 'on',
      durationSec: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 60) : null,
    });
  } catch (error) {
    return { error: message(error) };
  }
  revalidatePath(t.editor, 'layout');
  return { error: undefined };
}

/** ADR-028 point 5: sets (or with an empty value, removes) a lesson's YouTube or Google Drive link. */
export async function saveExternalLink(_: FormState, form: FormData): Promise<FormState> {
  const t = await target(form);
  const link = String(form.get('externalUrl') ?? '').trim();
  try {
    await eduApi.draftCall(t.token, t.tenantId, t.courseId, 'PATCH', `/lessons/${id(form, 'lessonId')}`, { externalUrl: link || null });
  } catch (error) {
    return { error: message(error) };
  }
  revalidatePath(t.editor, 'layout');
  return { error: undefined };
}

/** Puts an earlier upload from the media library into this lesson (FR-COURSE-210). */
export async function reuseUpload(_: FormState, form: FormData): Promise<FormState> {
  const t = await target(form);
  const mediaId = String(form.get('mediaId') ?? '');
  if (!UUID.test(mediaId)) return { error: 'Choose a file from the library.' };
  try {
    await eduApi.draftCall(t.token, t.tenantId, t.courseId, 'PATCH', `/lessons/${id(form, 'lessonId')}`, { mediaId });
  } catch (error) {
    return { error: message(error) };
  }
  revalidatePath(t.editor, 'layout');
  return { error: undefined };
}

export async function deleteLesson(form: FormData) {
  return act(form, (t) => eduApi.draftCall(t.token, t.tenantId, t.courseId, 'DELETE', `/lessons/${id(form, 'lessonId')}`));
}

/** Moves a chapter or lesson one step by sending the complete new order (lessons may cross chapters). */
export async function move(form: FormData) {
  const kind = String(form.get('kind'));
  const itemId = id(form, 'itemId');
  const direction = form.get('direction') === 'up' ? -1 : 1;
  return act(form, async (t) => {
    const draft = await eduApi.draft(t.token, t.tenantId, t.courseId);
    await eduApi.draftCall(t.token, t.tenantId, t.courseId, 'PUT', '/order', { sections: reordered(draft, kind, itemId, direction) });
  });
}

function reordered(draft: Draft, kind: string, itemId: string, direction: -1 | 1) {
  const sections = draft.sections.map((section) => ({ id: section.id, lessonIds: section.lessons.map((lesson) => lesson.id) }));
  if (kind === 'section') {
    const index = sections.findIndex((section) => section.id === itemId);
    const swap = index + direction;
    if (index >= 0 && swap >= 0 && swap < sections.length) [sections[index], sections[swap]] = [sections[swap]!, sections[index]!];
    return sections;
  }
  const sectionIndex = sections.findIndex((section) => section.lessonIds.includes(itemId));
  const section = sections[sectionIndex];
  if (!section) return sections;
  const index = section.lessonIds.indexOf(itemId);
  const swap = index + direction;
  if (swap >= 0 && swap < section.lessonIds.length) {
    [section.lessonIds[index], section.lessonIds[swap]] = [section.lessonIds[swap]!, section.lessonIds[index]!];
  } else {
    // Past the first or last lesson: move into the neighbouring chapter.
    const neighbour = sections[sectionIndex + direction];
    if (neighbour) {
      section.lessonIds.splice(index, 1);
      if (direction === -1) neighbour.lessonIds.push(itemId);
      else neighbour.lessonIds.unshift(itemId);
    }
  }
  return sections;
}

export async function submitForReview(form: FormData) {
  return act(form, (t) => eduApi.draftCall(t.token, t.tenantId, t.courseId, 'POST', '/submit'));
}

export async function withdrawFromReview(form: FormData) {
  return act(form, (t) => eduApi.draftCall(t.token, t.tenantId, t.courseId, 'POST', '/withdraw'));
}

export async function approveDraft(form: FormData) {
  return act(form, (t) => eduApi.draftCall(t.token, t.tenantId, t.courseId, 'POST', '/approve'), (t) => `${t.editor}?published=1`);
}

export async function rejectDraft(_: FormState, form: FormData): Promise<FormState> {
  const reason = String(form.get('reason') ?? '').trim();
  if (reason.length < 3) return { error: 'Tell the teacher what to change.' };
  return act(form, (t) => eduApi.draftCall(t.token, t.tenantId, t.courseId, 'POST', '/reject', { reason }));
}

export type PasteState = { error?: string; created?: number; refused?: { line: number; text: string; reason: string }[] };

/** Many YouTube or Google Drive links at once become lessons in a chapter (FR-COURSE-209). */
export async function pasteLinks(_: PasteState, form: FormData): Promise<PasteState> {
  const t = await target(form);
  const text = String(form.get('text') ?? '');
  if (!text.trim()) return { error: 'Paste at least one link.' };
  const driveKind = form.get('driveKind') === 'VIDEO' ? 'VIDEO' : 'DOCUMENT';
  try {
    const result = await eduApi.pasteLessons(t.token, t.tenantId, t.courseId, id(form, 'sectionId'), { text: text.slice(0, 30_000), driveKind });
    revalidatePath(t.editor, 'layout');
    return { created: result.created, refused: result.refused };
  } catch (error) {
    return { error: message(error) };
  }
}

/** Copies an offering as a draft template and opens the copy (FR-COURSE-209). */
export async function duplicateCourse(form: FormData) {
  const t = await target(form);
  let next: string | null = null;
  let error: string | undefined;
  try {
    const copy = await eduApi.duplicateCourse(t.token, t.tenantId, t.courseId, {});
    next = `/w/${t.slug}/teach/${copy.courseId}?copied=1`;
  } catch (caught) {
    error = message(caught);
  }
  revalidatePath(`/w/${t.slug}/teach`, 'layout');
  redirect(next ?? `${t.editor}?error=${encodeURIComponent((error ?? '').slice(0, 300))}`);
}
