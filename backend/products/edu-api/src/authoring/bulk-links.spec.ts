import { MAX_BULK_LINES, parseBulkLinks } from './bulk-links';

const YT = 'dQw4w9WgXcQ';
const DRIVE = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345';

describe('pasting many links at once (FR-COURSE-209)', () => {
  it('turns five links into five lessons in order and refuses a link on another host with its reason', () => {
    const text = [
      `https://youtu.be/${YT} Hiragana part 1`,
      `Hiragana part 2 | https://www.youtube.com/watch?v=${YT}&t=5s`,
      `Workbook\thttps://drive.google.com/file/d/${DRIVE}/view?usp=sharing`,
      '',
      `https://youtu.be/${YT}`,
      `Katakana – https://youtu.be/${YT}`,
      'Bonus https://vimeo.com/123456',
    ].join('\n');
    const { lessons, refused } = parseBulkLinks(text, 'DOCUMENT', 4);
    expect(lessons.map((lesson) => [lesson.line, lesson.title, lesson.kind, lesson.external.source])).toEqual([
      [1, 'Hiragana part 1', 'VIDEO', 'YOUTUBE'],
      [2, 'Hiragana part 2', 'VIDEO', 'YOUTUBE'],
      [3, 'Workbook', 'DOCUMENT', 'GOOGLE_DRIVE'],
      [5, 'Lesson 7', 'VIDEO', 'YOUTUBE'],
      [6, 'Katakana', 'VIDEO', 'YOUTUBE'],
    ]);
    expect(refused).toEqual([{ line: 7, text: 'Bonus https://vimeo.com/123456', reason: 'No YouTube or Google Drive link on this line.' }]);
  });

  it('makes Drive videos when the author says so, and refuses two links on one line', () => {
    expect(parseBulkLinks(`Lecture https://drive.google.com/file/d/${DRIVE}/view`, 'VIDEO').lessons[0]?.kind).toBe('VIDEO');
    expect(parseBulkLinks(`https://youtu.be/${YT} https://youtu.be/${YT}`, 'DOCUMENT').refused[0]?.reason).toBe('Put one link on each line.');
  });

  it('never mistakes an 11-letter title word for a YouTube ID', () => {
    const { lessons, refused } = parseBulkLinks(`Grammar1234 basics https://youtu.be/${YT}`, 'DOCUMENT');
    expect(refused).toEqual([]);
    expect(lessons[0]?.title).toBe('Grammar1234 basics');
    expect(parseBulkLinks('Grammar1234 only words', 'DOCUMENT').refused[0]?.reason).toMatch(/No YouTube or Google Drive link/);
  });

  it('caps one paste', () => {
    const many = Array.from({ length: MAX_BULK_LINES + 2 }, (_, i) => `Part ${i} https://youtu.be/${YT}`).join('\n');
    const { lessons, refused } = parseBulkLinks(many, 'DOCUMENT');
    expect(lessons).toHaveLength(MAX_BULK_LINES);
    expect(refused).toHaveLength(2);
    expect(refused[0]?.reason).toMatch(/at most 100/);
  });
});
