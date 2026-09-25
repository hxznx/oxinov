/**
 * Upload rules for lesson media (FR-COURSE-202/205): which formats play in every modern browser without
 * processing, how large they may be, and a content check so a file cannot pretend to be media.
 */
export type MediaKind = 'VIDEO' | 'AUDIO';

export const MEDIA_TYPES: Record<MediaKind, readonly string[]> = {
  VIDEO: ['video/mp4', 'video/webm'],
  AUDIO: ['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/webm'],
};

const MIB = 1024 * 1024;
export const MAX_BYTES: Record<MediaKind, number> = { VIDEO: 1024 * MIB, AUDIO: 200 * MIB };
/** Longest supported lesson recording. */
export const MAX_DURATION_SEC = 6 * 60 * 60;

export function uploadProblem(kind: MediaKind, contentType: string, sizeBytes: number): string | null {
  if (!MEDIA_TYPES[kind].includes(contentType)) {
    return kind === 'VIDEO' ? 'Upload an MP4 or WebM video.' : 'Upload an MP3, M4A, OGG, or WebM audio file.';
  }
  if (sizeBytes > MAX_BYTES[kind]) return `The file is larger than ${MAX_BYTES[kind] / MIB} MB.`;
  return null;
}

/** Checks the leading bytes of a stored object against its declared content type. */
export function looksLike(contentType: string, head: Uint8Array): boolean {
  const ascii = (from: number, to: number) => String.fromCharCode(...head.subarray(from, to));
  switch (contentType) {
    case 'video/mp4':
    case 'audio/mp4':
      return head.length >= 12 && ascii(4, 8) === 'ftyp';
    case 'video/webm':
    case 'audio/webm':
      return head.length >= 4 && head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3;
    case 'audio/ogg':
      return head.length >= 4 && ascii(0, 4) === 'OggS';
    case 'audio/mpeg':
      // ID3 tag, or an MPEG audio frame sync (11 set bits).
      return head.length >= 3 && (ascii(0, 3) === 'ID3' || (head[0] === 0xff && ((head[1] ?? 0) & 0xe0) === 0xe0));
    default:
      return false;
  }
}

/** Keeps a readable, safe file name for the object key and downloads. */
export function safeFileName(name: string): string {
  const cleaned = name
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 120);
  return cleaned || 'media';
}
