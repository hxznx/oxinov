import { safeSubmissionUrl, submissionFileProblem, submissionLooksLike } from './submission-files';

const bytes = (...values: (number | string)[]) =>
  Uint8Array.from(values.flatMap((value) => (typeof value === 'string' ? [...value].map((c) => c.charCodeAt(0)) : [value])));

describe('submission files', () => {
  it('accepts documents, images, archives, and audio within the size limit', () => {
    expect(submissionFileProblem('application/pdf', 1024, 25)).toBeNull();
    expect(submissionFileProblem('image/jpeg', 2 * 1024 * 1024, 25)).toBeNull();
    expect(submissionFileProblem('text/html', 10, 25)).toMatch(/PDF, Word/);
    expect(submissionFileProblem('image/svg+xml', 10, 25)).toMatch(/PDF, Word/);
    expect(submissionFileProblem('application/pdf', 30 * 1024 * 1024, 25)).toBe('The file is larger than 25 MB.');
  });

  it('checks file contents against the declared type', () => {
    expect(submissionLooksLike('application/pdf', bytes('%PDF-1.7\n'))).toBe(true);
    expect(submissionLooksLike('image/png', bytes(0x89, 'PNG', 0x0d, 0x0a))).toBe(true);
    expect(submissionLooksLike('image/jpeg', bytes(0xff, 0xd8, 0xff, 0xe0))).toBe(true);
    expect(submissionLooksLike('application/vnd.openxmlformats-officedocument.wordprocessingml.document', bytes('PK', 3, 4, 0))).toBe(true);
    expect(submissionLooksLike('text/plain', bytes('My essay about Kathmandu'))).toBe(true);

    expect(submissionLooksLike('application/pdf', bytes('<html><script>'))).toBe(false);
    expect(submissionLooksLike('text/plain', bytes('  <script>alert(1)</script>'))).toBe(false);
    expect(submissionLooksLike('text/plain', bytes('MZ', 0x90, 0, 3))).toBe(false);
    expect(submissionLooksLike('image/png', bytes('GIF89a'))).toBe(false);
  });

  it('accepts only web links', () => {
    expect(safeSubmissionUrl('https://github.com/sita/portfolio')).toBe('https://github.com/sita/portfolio');
    expect(safeSubmissionUrl('javascript:alert(1)')).toBeNull();
    expect(safeSubmissionUrl('file:///etc/passwd')).toBeNull();
    expect(safeSubmissionUrl('not a url')).toBeNull();
  });
});
