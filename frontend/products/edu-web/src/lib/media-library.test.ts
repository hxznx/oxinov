// Unit tests for the media library helpers. Run: pnpm --filter @oxinov/edu-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { LibraryItem } from './edu-api.ts';
import { filterLibrary, formatBytes, itemName, libraryCounts, parseLibraryFilter, reusableUploads } from './media-library.ts';

const use = (lessonTitle: string, courseTitle = 'JLPT N5') => ({ courseId: 'c', courseTitle, lessonId: lessonTitle, lessonTitle, draft: false });
const upload = (fileName: string, kind: 'VIDEO' | 'AUDIO' = 'VIDEO', status: 'READY' | 'FAILED' = 'READY') => ({ kind, status, fileName, sizeBytes: 2048, durationSec: 60 });

const ITEMS: LibraryItem[] = [
  { kind: 'YOUTUBE', id: 'dQw4w9WgXcQ', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', upload: null, uses: [use('Hiragana basics'), use('Recap', 'Kanji')] },
  { kind: 'GOOGLE_DRIVE', id: '1AbCdEfGhIjKlMnOpQrStUvWxYz', url: 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/view', upload: null, uses: [use('Workbook')] },
  { kind: 'UPLOAD', id: 'm1', url: null, upload: upload('listening.mp3', 'AUDIO'), uses: [] },
  { kind: 'UPLOAD', id: 'm2', url: null, upload: upload('intro.mp4'), uses: [use('Welcome')] },
  { kind: 'UPLOAD', id: 'm3', url: null, upload: upload('broken.mp4', 'VIDEO', 'FAILED'), uses: [] },
];

describe('media library helpers (FR-COURSE-210)', () => {
  it('filters by kind, unused items, and search words', () => {
    assert.equal(filterLibrary(ITEMS, 'ALL').length, 5);
    assert.deepEqual(filterLibrary(ITEMS, 'YOUTUBE').map((item) => item.id), ['dQw4w9WgXcQ']);
    assert.deepEqual(filterLibrary(ITEMS, 'UNUSED').map((item) => item.id), ['m1', 'm3']);
    assert.deepEqual(filterLibrary(ITEMS, 'ALL', 'kanji').map((item) => item.id), ['dQw4w9WgXcQ']);
    assert.deepEqual(filterLibrary(ITEMS, 'UPLOAD', ' INTRO ').map((item) => item.id), ['m2']);
    assert.deepEqual(filterLibrary(ITEMS, 'ALL', 'workbook jlpt').map((item) => item.kind), ['GOOGLE_DRIVE']);
  });

  it('counts each filter and reads the filter from the address', () => {
    assert.deepEqual(libraryCounts(ITEMS), { ALL: 5, YOUTUBE: 1, GOOGLE_DRIVE: 1, UPLOAD: 3, UNUSED: 2 });
    assert.equal(parseLibraryFilter('UNUSED'), 'UNUSED');
    assert.equal(parseLibraryFilter(['GOOGLE_DRIVE']), 'GOOGLE_DRIVE');
    assert.equal(parseLibraryFilter('<script>'), 'ALL');
    assert.equal(parseLibraryFilter(undefined), 'ALL');
  });

  it('names items and sizes files the way people read them', () => {
    assert.equal(itemName(ITEMS[0]!), 'Hiragana basics');
    assert.equal(itemName(ITEMS[2]!), 'listening.mp3');
    assert.equal(formatBytes(512), '512 bytes');
    assert.equal(formatBytes(1536), '1.5 KB');
    assert.equal(formatBytes(700 * 1024 * 1024), '700 MB');
    assert.equal(formatBytes(1.25 * 1024 ** 3), '1.3 GB');
  });

  it('offers only ready uploads of the lesson kind for reuse', () => {
    assert.deepEqual(reusableUploads(ITEMS, 'VIDEO'), [{ id: 'm2', fileName: 'intro.mp4', uses: 1 }]);
    assert.deepEqual(reusableUploads(ITEMS, 'AUDIO'), [{ id: 'm1', fileName: 'listening.mp3', uses: 0 }]);
  });
});
