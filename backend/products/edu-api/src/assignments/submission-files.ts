import { looksLike } from '../media/media-rules';

/**
 * Files learners may hand in (FR-ASSESS-503): documents, images, archives, and audio for speaking tasks.
 * Nothing that browsers run (HTML, SVG, scripts) is accepted, and downloads are served as attachments.
 */
export const SUBMISSION_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel sheet',
  'image/png': 'PNG image',
  'image/jpeg': 'JPEG image',
  'text/plain': 'Text file',
  'application/zip': 'ZIP archive',
  'audio/mpeg': 'MP3 audio',
  'audio/mp4': 'M4A audio',
  'audio/webm': 'WebM audio',
  'audio/ogg': 'OGG audio',
};

const OFFICE_ZIP = new Set([
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export function submissionFileProblem(contentType: string, sizeBytes: number, maxFileMb: number): string | null {
  if (!SUBMISSION_TYPES[contentType]) return 'Upload a PDF, Word, PowerPoint, Excel, image, text, ZIP, or audio file.';
  if (sizeBytes > maxFileMb * 1024 * 1024) return `The file is larger than ${maxFileMb} MB.`;
  return null;
}

/** Checks the first bytes of a stored file against its declared type. */
export function submissionLooksLike(contentType: string, head: Uint8Array): boolean {
  const ascii = (from: number, to: number) => String.fromCharCode(...head.subarray(from, to));
  if (contentType === 'application/pdf') return ascii(0, 5) === '%PDF-';
  if (contentType === 'image/png') return head[0] === 0x89 && ascii(1, 4) === 'PNG';
  if (contentType === 'image/jpeg') return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  if (OFFICE_ZIP.has(contentType)) return head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04;
  if (contentType === 'text/plain') {
    // Plain text: no NUL bytes, and not markup a browser might render.
    const start = ascii(0, Math.min(head.length, 64)).trimStart().toLowerCase();
    return !head.includes(0) && !start.startsWith('<');
  }
  if (contentType.startsWith('audio/')) return looksLike(contentType, head);
  return false;
}

/** Only http(s) links are accepted as submitted URLs. */
export function safeSubmissionUrl(value: string | undefined | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}
