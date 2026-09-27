// Unit tests for note exports. Run: pnpm --filter @oxinov/edu-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Note } from './edu-api.ts';
import { exportFileName, groupByLesson, notesToMarkdown } from './notes.ts';

const note = (overrides: Partial<Note>): Note => ({
  id: Math.random().toString(36),
  body: 'note',
  timestampSec: null,
  lessonTitle: 'Lesson',
  lessonId: 'l1',
  createdAt: '2026-09-25T00:00:00Z',
  updatedAt: '2026-09-25T00:00:00Z',
  ...overrides,
});

describe('note export', () => {
  const notes = [
    note({ lessonTitle: 'The vowels', lessonId: 'l1', body: 'あ = a', timestampSec: 65 }),
    note({ lessonTitle: 'The vowels', lessonId: 'l1', body: 'い = i\nsounds like "ee"' }),
    note({ lessonTitle: 'Old lesson', lessonId: null, body: 'kept' }),
  ];

  it('groups by lesson in order', () => {
    assert.deepEqual(
      groupByLesson(notes).map((group) => [group.title, group.notes.length]),
      [
        ['The vowels', 2],
        ['Old lesson', 1],
      ],
    );
  });

  it('writes Markdown with moments, multi-line notes, and removed lessons', () => {
    const markdown = notesToMarkdown('Hiragana', notes, new Date('2026-09-26T08:00:00Z'));
    assert.equal(
      markdown,
      [
        '# My notes: Hiragana',
        '',
        '_Exported from Oxinov Edu on 2026-09-26._',
        '',
        '## The vowels',
        '',
        '- **[01:05]** あ = a',
        '- い = i',
        '  sounds like "ee"',
        '',
        '## Old lesson (lesson removed)',
        '',
        '- kept',
        '',
      ].join('\n'),
    );
  });

  it('makes a safe file name', () => {
    assert.equal(exportFileName('Hiragana and First Words'), 'notes-hiragana-and-first-words.md');
    assert.equal(exportFileName('日本語'), 'notes-course.md');
  });
});
