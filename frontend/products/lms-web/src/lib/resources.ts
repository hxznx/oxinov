/** Course documents teachers can attach to lessons (mirrors the Edu API's rules, FR-COURSE-202). */
const BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  epub: 'application/epub+zip',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  txt: 'text/plain',
  zip: 'application/zip',
};

export const RESOURCE_ACCEPT = '.pdf,.epub,.docx,.pptx,.xlsx,.png,.jpg,.jpeg,.txt,.zip';
export const MAX_RESOURCE_MB = 100;

export function resourceContentType(file: { name: string; type: string }): string | null {
  const extension = file.name.toLowerCase().split('.').pop() ?? '';
  return BY_EXTENSION[extension] ?? (Object.values(BY_EXTENSION).includes(file.type) ? file.type : null);
}

/** A readable default title from a file name: "N5_kanji-workbook.pdf" -> "N5 kanji workbook". */
export function titleFromFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return (base || 'Resource').slice(0, 200);
}

export function resourceLabel(contentType: string): string {
  if (contentType === 'application/pdf') return 'PDF';
  if (contentType === 'application/epub+zip') return 'EPUB';
  if (contentType.includes('wordprocessingml')) return 'Word';
  if (contentType.includes('presentationml')) return 'PowerPoint';
  if (contentType.includes('spreadsheetml')) return 'Excel';
  if (contentType.startsWith('image/')) return 'Image';
  if (contentType === 'application/zip') return 'ZIP';
  return 'File';
}
