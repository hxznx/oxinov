/**
 * Fast course building (FR-COURSE-209): many YouTube or Google Drive links pasted at once, one per line, each
 * with an optional title, become lessons in order. Pure functions, unit-tested; the service creates the
 * lessons and reports every refused line with its reason.
 */
import { parseExternal, type ExternalRef } from './external-content';

/** Lines accepted in one paste. */
export const MAX_BULK_LINES = 100;
const MAX_TITLE = 200;

export interface BulkLesson {
  /** 1-based line number in the pasted text. */
  line: number;
  title: string;
  kind: 'VIDEO' | 'DOCUMENT';
  external: ExternalRef;
}

export interface BulkRefusal {
  line: number;
  text: string;
  reason: string;
}

/** A web address, not a word: a bare 11-character YouTube ID is accepted elsewhere but would match title words. */
const LOOKS_LIKE_LINK = /^(https?:\/\/|www\.|m\.youtube\.|youtube\.|youtu\.be\/|drive\.google\.|docs\.google\.)/i;
const isLink = (token: string) => LOOKS_LIKE_LINK.test(token) && parseExternal(token) !== null;

/** Separators people put between a title and a link: tabs (spreadsheets), bars, and dashes. */
const EDGE = /^[\s|:\-–—•*·]+|[\s|:\-–—•*·]+$/g;

/**
 * Reads pasted lines. A line holds one link anywhere ("Title https://…", "https://… Title", "Title | link", or
 * a spreadsheet row); the rest of the line is the title, or "Lesson N" when there is none. YouTube makes a
 * video lesson; Google Drive makes `driveKind` (documents, unless the author says the files are videos).
 */
export function parseBulkLinks(text: string, driveKind: 'VIDEO' | 'DOCUMENT', firstNumber = 1): { lessons: BulkLesson[]; refused: BulkRefusal[] } {
  const lessons: BulkLesson[] = [];
  const refused: BulkRefusal[] = [];
  const lines = text.split(/\r?\n/);
  let accepted = 0;
  lines.forEach((raw, index) => {
    const line = index + 1;
    const content = raw.trim();
    if (!content) return;
    if (lessons.length + refused.length >= MAX_BULK_LINES) {
      refused.push({ line, text: content.slice(0, 120), reason: `Paste at most ${MAX_BULK_LINES} links at a time.` });
      return;
    }
    const tokens = content.split(/[\s|]+/).filter(Boolean);
    const at = tokens.findIndex(isLink);
    const linkToken = at >= 0 ? tokens[at] : undefined;
    const external = linkToken ? parseExternal(linkToken) : null;
    if (!linkToken || !external) {
      refused.push({ line, text: content.slice(0, 120), reason: 'No YouTube or Google Drive link on this line.' });
      return;
    }
    const others = tokens.filter((token, i) => i !== at && LOOKS_LIKE_LINK.test(token));
    if (others.length > 0) {
      refused.push({ line, text: content.slice(0, 120), reason: 'Put one link on each line.' });
      return;
    }
    accepted += 1;
    const title = content.replace(linkToken, ' ').replace(/\s+/g, ' ').replace(EDGE, '').trim().slice(0, MAX_TITLE);
    lessons.push({ line, title: title || `Lesson ${firstNumber + accepted - 1}`, kind: external.source === 'YOUTUBE' ? 'VIDEO' : driveKind, external });
  });
  return { lessons, refused };
}
