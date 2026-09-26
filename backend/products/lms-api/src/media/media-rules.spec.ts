import { looksLike, safeFileName, uploadProblem } from './media-rules';

const bytes = (...values: (number | string)[]) =>
  Uint8Array.from(values.flatMap((value) => (typeof value === 'string' ? [...value].map((c) => c.charCodeAt(0)) : [value])));

describe('lesson media rules', () => {
  it('accepts browser-playable formats within the size limits', () => {
    expect(uploadProblem('VIDEO', 'video/mp4', 50 * 1024 * 1024)).toBeNull();
    expect(uploadProblem('AUDIO', 'audio/mpeg', 5 * 1024 * 1024)).toBeNull();
    expect(uploadProblem('VIDEO', 'video/quicktime', 10)).toMatch(/MP4 or WebM/);
    expect(uploadProblem('AUDIO', 'video/mp4', 10)).toMatch(/MP3/);
    expect(uploadProblem('AUDIO', 'audio/ogg', 300 * 1024 * 1024)).toMatch(/200 MB/);
  });

  it('recognises real media by its first bytes and rejects impostors', () => {
    expect(looksLike('video/mp4', bytes(0, 0, 0, 0x20, 'ftypisom', 0, 0))).toBe(true);
    expect(looksLike('audio/mp4', bytes(0, 0, 0, 0x1c, 'ftypM4A ', 0, 0))).toBe(true);
    expect(looksLike('video/webm', bytes(0x1a, 0x45, 0xdf, 0xa3, 0))).toBe(true);
    expect(looksLike('audio/ogg', bytes('OggS', 0))).toBe(true);
    expect(looksLike('audio/mpeg', bytes('ID3', 4, 0))).toBe(true);
    expect(looksLike('audio/mpeg', bytes(0xff, 0xfb, 0x90))).toBe(true);

    expect(looksLike('video/mp4', bytes('<html><script>alert(1)</script>'))).toBe(false);
    expect(looksLike('audio/mpeg', bytes('MZ', 0x90, 0))).toBe(false);
    expect(looksLike('video/mp4', bytes(0, 0))).toBe(false);
    expect(looksLike('image/png', bytes(0x89, 'PNG'))).toBe(false);
  });

  it('keeps file names readable and safe', () => {
    expect(safeFileName('Lesson 1 – あいさつ.mp4')).toBe('Lesson-1-あいさつ.mp4');
    expect(safeFileName('../../etc/passwd')).toBe('etc-passwd');
    expect(safeFileName('   ')).toBe('media');
  });
});
