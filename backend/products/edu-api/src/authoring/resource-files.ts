import { submissionLooksLike } from '../assignments/submission-files';

/**
 * Course documents teachers attach to lessons (FR-COURSE-202): books, handouts, slides, worksheets, and
 * archives. Nothing a browser would run is accepted, and downloads are served as attachments (PDFs can
 * also be opened inline from the storage domain, which never shares cookies with Oxinov sites).
 */
export const RESOURCE_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/epub+zip': 'EPUB book',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel sheet',
  'image/png': 'PNG image',
  'image/jpeg': 'JPEG image',
  'text/plain': 'Text file',
  'application/zip': 'ZIP archive',
};

export const MAX_RESOURCE_MB = 100;

export function resourceFileProblem(contentType: string, sizeBytes: number): string | null {
  if (!RESOURCE_TYPES[contentType]) return 'Attach a PDF, EPUB, Word, PowerPoint, Excel, image, text, or ZIP file.';
  if (sizeBytes > MAX_RESOURCE_MB * 1024 * 1024) return `The file is larger than ${MAX_RESOURCE_MB} MB.`;
  return null;
}

export function resourceLooksLike(contentType: string, head: Uint8Array): boolean {
  // EPUB is a ZIP container, like the Office formats.
  if (contentType === 'application/epub+zip') return submissionLooksLike('application/zip', head);
  return submissionLooksLike(contentType, head);
}
