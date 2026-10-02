/**
 * Publish checklist (FR-COURSE-209): what a draft still needs before review, shown beside "Approve and
 * publish". `block` items are the ones the Edu API refuses (FR-COURSE-202, ADR-028 point 5); `warn` items are
 * what learners and the store notice. Pure functions, unit-tested without the API.
 */
import type { Draft } from './edu-api.ts';

export type ChecklistLevel = 'ok' | 'warn' | 'block';

export interface ChecklistItem {
  level: ChecklistLevel;
  text: string;
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
const names = (titles: string[]) => {
  const shown = titles.slice(0, 3).map((title) => `“${title}”`).join(', ');
  return titles.length > 3 ? `${shown} and ${titles.length - 3} more` : shown;
};

export function publishChecklist(draft: Pick<Draft, 'sections' | 'description' | 'outcomes'>, options: { sellsPlans: boolean | null }): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const lessons = draft.sections.flatMap((section) => section.lessons);

  const emptyChapters = draft.sections.filter((section) => section.lessons.length === 0).map((section) => section.title);
  if (draft.sections.length === 0) items.push({ level: 'block', text: 'Add a chapter and its lessons' });
  else if (emptyChapters.length > 0) items.push({ level: 'block', text: `Empty chapters: ${names(emptyChapters)}` });
  else items.push({ level: 'ok', text: `${plural(draft.sections.length, 'chapter')} with ${plural(lessons.length, 'lesson')}` });

  const media = lessons.filter((lesson) => lesson.kind === 'VIDEO' || lesson.kind === 'AUDIO');
  const noFile = media.filter((lesson) => lesson.external === null && lesson.media?.status !== 'READY').map((lesson) => lesson.title);
  if (noFile.length > 0) items.push({ level: 'block', text: `Add the video or audio (upload, YouTube, or Drive) to ${names(noFile)}` });
  const noText = media.filter((lesson) => !lesson.bodyMarkdown.trim()).map((lesson) => lesson.title);
  if (noText.length > 0) items.push({ level: 'block', text: `Add a transcript or short text version to ${names(noText)} (for learners who cannot listen)` });
  const noDocument = lessons.filter((lesson) => lesson.kind === 'DOCUMENT' && lesson.external === null).map((lesson) => lesson.title);
  if (noDocument.length > 0) items.push({ level: 'block', text: `Add the Google Drive link to ${names(noDocument)}` });
  if (media.length > 0 && noFile.length === 0 && noText.length === 0 && noDocument.length === 0) items.push({ level: 'ok', text: 'Every video and audio lesson has its file and text' });

  if (lessons.length > 0 && !lessons.some((lesson) => lesson.isPreview)) {
    items.push({ level: 'warn', text: 'No free preview lesson: mark one or two lessons as free so visitors can try before buying' });
  }
  if (!draft.description.trim()) items.push({ level: 'warn', text: 'No description for the offering page' });
  if (draft.outcomes.length === 0) items.push({ level: 'warn', text: 'No "By the end" outcomes for the offering page' });
  if (options.sellsPlans === false) items.push({ level: 'warn', text: 'No plans and prices yet: it will show as free' });
  return items;
}

/** True while something the API would refuse is still missing. */
export function hasBlockers(items: readonly ChecklistItem[]): boolean {
  return items.some((item) => item.level === 'block');
}
