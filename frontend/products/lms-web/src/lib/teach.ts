import type { AuthoredCourse } from './edu-api.ts';

export const LANGUAGES: [string, string][] = [
  ['en', 'English'],
  ['ne', 'Nepali'],
  ['ja', 'Japanese'],
  ['ko', 'Korean'],
  ['hi', 'Hindi'],
];
export const CURRENCIES = ['NPR', 'USD', 'JPY', 'INR'];

/** Plain-language state of a course for teachers. */
export function courseState(course: Pick<AuthoredCourse, 'courseStatus' | 'draftStatus'>): string {
  if (course.draftStatus === 'IN_REVIEW') return 'Waiting for review';
  if (course.draftStatus === 'DRAFT') return course.courseStatus === 'PUBLISHED' ? 'Published · changes in draft' : 'Draft';
  return course.courseStatus === 'PUBLISHED' ? 'Published' : course.courseStatus === 'ARCHIVED' ? 'Archived' : 'Draft';
}

/** Price as typed by a teacher (major units) from stored minor units; JPY has no minor unit. */
export function majorUnits(amountMinor: number, currency: string): number {
  return currency === 'JPY' ? amountMinor : amountMinor / 100;
}
