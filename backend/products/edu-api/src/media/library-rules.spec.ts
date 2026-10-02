import { groupLibrary, type LessonRow, type UploadRow } from './library-rules';

const YT = 'dQw4w9WgXcQ';
const DRIVE = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345';

const lesson = (over: Partial<LessonRow>): LessonRow => ({
  courseId: 'c1',
  courseTitle: 'Kanji',
  lessonId: 'l1',
  lessonTitle: 'Lesson',
  lineageId: 'g1',
  draft: false,
  externalSource: null,
  externalId: null,
  mediaAssetId: null,
  ...over,
});

const upload = (id: string): UploadRow => ({ id, kind: 'VIDEO', status: 'READY', fileName: `${id}.mp4`, sizeBytes: 1024, durationSec: 60, createdAt: new Date('2026-10-01T00:00:00Z') });

describe('media library grouping (FR-COURSE-210)', () => {
  it('groups lessons by the video, file, or upload they use, with every place it is used', () => {
    const items = groupLibrary(
      [
        lesson({ lessonId: 'l1', lineageId: 'g1', lessonTitle: 'Intro', externalSource: 'YOUTUBE', externalId: YT }),
        lesson({ courseId: 'c2', courseTitle: 'Grammar', lessonId: 'l2', lineageId: 'g2', lessonTitle: 'Recap', externalSource: 'YOUTUBE', externalId: YT }),
        lesson({ lessonId: 'l3', lineageId: 'g3', lessonTitle: 'Workbook', externalSource: 'GOOGLE_DRIVE', externalId: DRIVE }),
        lesson({ lessonId: 'l4', lineageId: 'g4', lessonTitle: 'Talk', mediaAssetId: 'm1' }),
        lesson({ lessonId: 'l5', lineageId: 'g5', lessonTitle: 'Reading' }),
      ],
      [upload('m1'), upload('m2')],
    );
    expect(items.map((item) => [item.kind, item.id, item.uses.length])).toEqual([
      ['YOUTUBE', YT, 2],
      ['GOOGLE_DRIVE', DRIVE, 1],
      ['UPLOAD', 'm1', 1],
      ['UPLOAD', 'm2', 0],
    ]);
    expect(items[0]?.url).toBe(`https://www.youtube.com/watch?v=${YT}`);
    expect(items[0]?.uses.map((use) => use.courseTitle)).toEqual(['Grammar', 'Kanji']);
    expect(items[1]?.url).toBe(`https://drive.google.com/file/d/${DRIVE}/view`);
    expect(items[2]).toMatchObject({ url: null, upload: { fileName: 'm1.mp4', status: 'READY', sizeBytes: 1024 } });
  });

  it('counts a lesson once when its published version and a newer draft both use the item', () => {
    const [item] = groupLibrary(
      [
        lesson({ lessonId: 'draft-copy', lineageId: 'g1', draft: true, externalSource: 'YOUTUBE', externalId: YT }),
        lesson({ lessonId: 'published', lineageId: 'g1', draft: false, externalSource: 'YOUTUBE', externalId: YT }),
      ],
      [],
    );
    expect(item?.uses).toHaveLength(1);
    expect(item?.uses[0]).toMatchObject({ lessonId: 'published', draft: false });
  });

  it('keeps a draft-only use and marks it as a draft', () => {
    const [item] = groupLibrary([lesson({ draft: true, externalSource: 'GOOGLE_DRIVE', externalId: DRIVE })], []);
    expect(item?.uses[0]?.draft).toBe(true);
  });
});
