// Unit tests for the publish checklist. Run: pnpm --filter @oxinov/edu-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Draft, DraftLesson } from './edu-api.ts';
import { hasBlockers, publishChecklist } from './course-checklist.ts';

const lesson = (over: Partial<DraftLesson>): DraftLesson => ({
  id: 'l',
  title: 'Lesson',
  kind: 'TEXT',
  position: 1,
  bodyMarkdown: 'Text',
  isPreview: false,
  isRequired: true,
  durationSec: null,
  media: null,
  external: null,
  resources: [],
  ...over,
});
const youtube = { source: 'YOUTUBE' as const, id: 'dQw4w9WgXcQ', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' };
const draft = (sections: { title: string; lessons: DraftLesson[] }[], over: Partial<Pick<Draft, 'description' | 'outcomes'>> = {}) =>
  ({ sections: sections.map((section, i) => ({ id: `s${i}`, position: i + 1, ...section })), description: 'About', outcomes: ['Read hiragana'], ...over }) as Pick<
    Draft,
    'sections' | 'description' | 'outcomes'
  >;

describe('publish checklist (FR-COURSE-209)', () => {
  it('passes a complete draft', () => {
    const items = publishChecklist(draft([{ title: 'Start', lessons: [lesson({ kind: 'VIDEO', external: youtube, isPreview: true })] }]), { sellsPlans: true });
    assert.equal(hasBlockers(items), false);
    assert.deepEqual(
      items.map((item) => item.level),
      ['ok', 'ok'],
    );
  });

  it('lists what the review would refuse', () => {
    const items = publishChecklist(
      draft([
        { title: 'Empty', lessons: [] },
        { title: 'Videos', lessons: [lesson({ title: 'Pasted', kind: 'VIDEO', external: youtube, bodyMarkdown: '' }), lesson({ title: 'No file', kind: 'VIDEO' }), lesson({ title: 'Workbook', kind: 'DOCUMENT' })] },
      ]),
      { sellsPlans: true },
    );
    assert.equal(hasBlockers(items), true);
    assert.deepEqual(
      items.filter((item) => item.level === 'block').map((item) => item.text),
      [
        'Empty chapters: “Empty”',
        'Add the video or audio (upload, YouTube, or Drive) to “No file”',
        'Add a transcript or short text version to “Pasted” (for learners who cannot listen)',
        'Add the Google Drive link to “Workbook”',
      ],
    );
  });

  it('warns about what learners and the store notice', () => {
    const items = publishChecklist(draft([{ title: 'Start', lessons: [lesson({})] }], { description: ' ', outcomes: [] }), { sellsPlans: false });
    assert.deepEqual(
      items.filter((item) => item.level === 'warn').map((item) => item.text.split(':')[0]),
      ['No free preview lesson', 'No description for the offering page', 'No "By the end" outcomes for the offering page', 'No plans and prices yet'],
    );
    assert.equal(publishChecklist(draft([]), { sellsPlans: null })[0]?.text, 'Add a chapter and its lessons');
  });

  it('shortens long lists of lessons', () => {
    const many = Array.from({ length: 5 }, (_, i) => lesson({ title: `V${i + 1}`, kind: 'VIDEO', external: youtube, bodyMarkdown: '' }));
    const text = publishChecklist(draft([{ title: 'Start', lessons: many }]), { sellsPlans: true }).find((item) => item.level === 'block')?.text;
    assert.equal(text, 'Add a transcript or short text version to “V1”, “V2”, “V3” and 2 more (for learners who cannot listen)');
  });
});
