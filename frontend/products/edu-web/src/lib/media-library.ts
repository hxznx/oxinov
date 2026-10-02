/**
 * Media library helpers (FR-COURSE-210; design screen 9): filters, counts, and labels for the list of
 * every YouTube video, Google Drive file, and upload in use. Pure functions, unit-tested without the API.
 */
import type { LibraryItem, LibraryKind } from './edu-api.ts';

export type LibraryFilter = 'ALL' | LibraryKind | 'UNUSED';

export const LIBRARY_FILTERS: readonly { value: LibraryFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'GOOGLE_DRIVE', label: 'Google Drive' },
  { value: 'UPLOAD', label: 'Uploads' },
  { value: 'UNUSED', label: 'Not used' },
];

export const KIND_LABEL: Record<LibraryKind, string> = { YOUTUBE: 'YouTube video', GOOGLE_DRIVE: 'Google Drive file', UPLOAD: 'Upload' };

/** Reads the `?show=` value; anything unknown shows everything. */
export function parseLibraryFilter(value: string | string[] | undefined): LibraryFilter {
  const text = Array.isArray(value) ? value[0] : value;
  return LIBRARY_FILTERS.find((filter) => filter.value === text)?.value ?? 'ALL';
}

/** Items for one filter and an optional search over lesson, offering, and file names. */
export function filterLibrary(items: readonly LibraryItem[], filter: LibraryFilter, query = ''): LibraryItem[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    if (filter === 'UNUSED' ? item.uses.length > 0 : filter !== 'ALL' && item.kind !== filter) return false;
    if (words.length === 0) return true;
    const text = [item.upload?.fileName ?? '', item.id, ...item.uses.flatMap((use) => [use.lessonTitle, use.courseTitle])].join(' ').toLowerCase();
    return words.every((word) => text.includes(word));
  });
}

export function libraryCounts(items: readonly LibraryItem[]): Record<LibraryFilter, number> {
  const counts: Record<LibraryFilter, number> = { ALL: items.length, YOUTUBE: 0, GOOGLE_DRIVE: 0, UPLOAD: 0, UNUSED: 0 };
  for (const item of items) {
    counts[item.kind] += 1;
    if (item.uses.length === 0) counts.UNUSED += 1;
  }
  return counts;
}

/** A name people recognise: the upload's file name, or the first lesson that uses the link. */
export function itemName(item: LibraryItem): string {
  return item.upload?.fileName ?? item.uses[0]?.lessonTitle ?? KIND_LABEL[item.kind];
}

/** 1536 → "1.5 KB"; 734003200 → "700 MB". */
export function formatBytes(bytes: number): string {
  const units = ['bytes', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return unit === 0 ? `${value} bytes` : `${value >= 10 ? Math.round(value) : Math.round(value * 10) / 10} ${units[unit]}`;
}

/** Uploads ready to reuse in a lesson of this kind, newest first as the API returns them. */
export function reusableUploads(items: readonly LibraryItem[], kind: 'VIDEO' | 'AUDIO'): { id: string; fileName: string; uses: number }[] {
  return items.flatMap((item) =>
    item.kind === 'UPLOAD' && item.upload?.kind === kind && item.upload.status === 'READY' ? [{ id: item.id, fileName: item.upload.fileName, uses: item.uses.length }] : [],
  );
}
