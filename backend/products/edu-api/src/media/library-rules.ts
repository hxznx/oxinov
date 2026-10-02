/**
 * Media library (FR-COURSE-210): every YouTube video, Google Drive file, and upload used by the workspace's
 * offerings, grouped so one item lists every lesson that uses it. Pure functions, unit-tested.
 */
import { authorUrl, type ContentSource } from '../authoring/external-content';

export type LibraryKind = ContentSource | 'UPLOAD';

/** One lesson that uses an item, in the course version authors and learners see today. */
export interface LibraryUse {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  /** True when the lesson is in an unpublished draft or a version waiting for review. */
  draft: boolean;
}

/** A lesson row as the service reads it. */
export interface LessonRow extends LibraryUse {
  /** Stable lesson identity across course versions. */
  lineageId: string;
  externalSource: ContentSource | null;
  externalId: string | null;
  mediaAssetId: string | null;
}

export interface UploadRow {
  id: string;
  kind: string;
  status: string;
  fileName: string;
  sizeBytes: number;
  durationSec: number | null;
  createdAt: Date;
}

export interface LibraryItem {
  kind: LibraryKind;
  /** The provider ID for links, the media ID for uploads. */
  id: string;
  /** The ordinary link for authors to open or paste into another lesson; null for uploads. */
  url: string | null;
  upload: Omit<UploadRow, 'id' | 'createdAt'> | null;
  uses: LibraryUse[];
}

const ORDER: Record<LibraryKind, number> = { YOUTUBE: 0, GOOGLE_DRIVE: 1, UPLOAD: 2 };

/**
 * Groups lessons by the item they use. Uploads with no lessons are listed too (when the caller passes
 * them), so an administrator can find and reuse them. Items are ordered by kind, then most-used first.
 */
export function groupLibrary(lessons: readonly LessonRow[], uploads: readonly UploadRow[]): LibraryItem[] {
  const items = new Map<string, LibraryItem>();
  const uploadById = new Map(uploads.map((upload) => [upload.id, upload]));
  const item = (key: string, make: () => LibraryItem) => items.get(key) ?? items.set(key, make()).get(key)!;

  const lineage = new Map<string, string>();
  for (const lesson of lessons) {
    lineage.set(lesson.lessonId, lesson.lineageId);
    const use: LibraryUse = { courseId: lesson.courseId, courseTitle: lesson.courseTitle, lessonId: lesson.lessonId, lessonTitle: lesson.lessonTitle, draft: lesson.draft };
    if (lesson.externalSource && lesson.externalId) {
      const ref = { source: lesson.externalSource, id: lesson.externalId };
      item(`${ref.source}:${ref.id}`, () => ({ kind: ref.source, id: ref.id, url: authorUrl(ref), upload: null, uses: [] })).uses.push(use);
    } else if (lesson.mediaAssetId) {
      const id = lesson.mediaAssetId;
      item(`UPLOAD:${id}`, () => ({ kind: 'UPLOAD', id, url: null, upload: uploadFields(uploadById.get(id)), uses: [] })).uses.push(use);
    }
  }
  for (const upload of uploads) item(`UPLOAD:${upload.id}`, () => ({ kind: 'UPLOAD', id: upload.id, url: null, upload: uploadFields(upload), uses: [] }));

  return [...items.values()]
    .map((entry) => ({ ...entry, uses: dedupe(entry.uses, lineage) }))
    .sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || b.uses.length - a.uses.length || a.id.localeCompare(b.id));
}

function uploadFields(upload: UploadRow | undefined): LibraryItem['upload'] {
  if (!upload) return null;
  return { kind: upload.kind, status: upload.status, fileName: upload.fileName, sizeBytes: upload.sizeBytes, durationSec: upload.durationSec };
}

/**
 * A course can show the same lesson twice (its published version and a newer draft). Keep one use per
 * lesson lineage, preferring the published one, so the list says where learners see it.
 */
function dedupe(uses: LibraryUse[], lineage: ReadonlyMap<string, string>): LibraryUse[] {
  const seen = new Map<string, LibraryUse>();
  for (const use of uses) {
    const key = lineage.get(use.lessonId) ?? use.lessonId;
    const current = seen.get(key);
    if (!current || (current.draft && !use.draft)) seen.set(key, use);
  }
  return [...seen.values()].sort((a, b) => a.courseTitle.localeCompare(b.courseTitle) || a.lessonTitle.localeCompare(b.lessonTitle));
}
