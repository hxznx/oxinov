import type { SubmissionStatus } from './edu-api.ts';

export const STATUS_LABEL: Record<SubmissionStatus, string> = {
  DRAFT: 'Not submitted',
  SUBMITTED: 'Waiting for the teacher',
  REVISION_REQUESTED: 'Revision requested',
  PASSED: 'Passed',
  FAILED: 'Not passed',
};

export const STATUS_TONE: Record<SubmissionStatus, string> = {
  DRAFT: 'text-muted',
  SUBMITTED: 'text-warning',
  REVISION_REQUESTED: 'text-warning',
  PASSED: 'text-success',
  FAILED: 'text-danger',
};

/** "Due 1 Oct 2026, 17:00" in the workspace time zone; unknown zones fall back to UTC. */
export function dueLabel(dueAt: string | null, timeZone: string, now: Date = new Date()): string {
  if (!dueAt) return 'No deadline';
  const due = new Date(dueAt);
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
  let text: string;
  try {
    text = due.toLocaleString('en-GB', { ...options, timeZone });
  } catch {
    text = due.toLocaleString('en-GB', { ...options, timeZone: 'UTC' });
  }
  return `${due < now ? 'Was due' : 'Due'} ${text}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Browsers label some documents oddly; map names to the types the Edu API accepts. */
const BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  txt: 'text/plain',
  zip: 'application/zip',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  weba: 'audio/webm',
  ogg: 'audio/ogg',
};

export const SUBMISSION_ACCEPT = '.pdf,.docx,.pptx,.xlsx,.png,.jpg,.jpeg,.txt,.zip,.mp3,.m4a,.ogg,.weba';

export function submissionContentType(file: { name: string; type: string }): string | null {
  const extension = file.name.toLowerCase().split('.').pop() ?? '';
  const known = BY_EXTENSION[extension];
  if (known) return known;
  return Object.values(BY_EXTENSION).includes(file.type) ? file.type : null;
}
