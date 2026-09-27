import type { Note } from './edu-api.ts';
import { formatClock } from './exam.ts';

/** Groups notes by lesson, keeping the order they arrive in (the API sorts by curriculum). */
export function groupByLesson(notes: Note[]): { title: string; lessonId: string | null; notes: Note[] }[] {
  const groups: { title: string; lessonId: string | null; notes: Note[] }[] = [];
  for (const note of notes) {
    const key = note.lessonId ?? `removed:${note.lessonTitle}`;
    const last = groups.at(-1);
    if (last && (last.lessonId ?? `removed:${last.title}`) === key) last.notes.push(note);
    else groups.push({ title: note.lessonTitle, lessonId: note.lessonId, notes: [note] });
  }
  return groups;
}

/** Plain Markdown export of a learner's notes for one course (FR-PLAYER-403). */
export function notesToMarkdown(courseTitle: string, notes: Note[], exportedAt: Date = new Date()): string {
  const lines = [`# My notes: ${courseTitle}`, '', `_Exported from Oxinov Edu on ${exportedAt.toISOString().slice(0, 10)}._`, ''];
  for (const group of groupByLesson(notes)) {
    lines.push(`## ${group.title}${group.lessonId ? '' : ' (lesson removed)'}`, '');
    for (const note of group.notes) {
      const prefix = note.timestampSec !== null ? `**[${formatClock(note.timestampSec)}]** ` : '';
      const body = note.body.trim().split('\n');
      lines.push(`- ${prefix}${body[0]}`, ...body.slice(1).map((line) => `  ${line}`));
    }
    lines.push('');
  }
  if (notes.length === 0) lines.push('No notes yet.', '');
  return lines.join('\n');
}

/** Safe download name, e.g. "Hiragana and First Words" -> "notes-hiragana-and-first-words.md". */
export function exportFileName(courseTitle: string): string {
  const slug = courseTitle
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `notes-${slug || 'course'}.md`;
}
