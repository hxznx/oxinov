/**
 * Renewal reminders (FR-COMM-704; ADR-028 point 9): pure rules so the hourly sweep is unit-tested without
 * a clock or a database.
 */

export type ReminderStage = 'DAYS_7' | 'DAYS_1' | 'ENDED';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
/** An ended plan is reported only if it ended recently, so a long outage never floods old notices. */
const ENDED_WINDOW = 3 * DAY;

/** Which reminder is due for access ending at `endsAt`, if any. */
export function reminderStage(endsAt: Date, now: Date): ReminderStage | null {
  const left = endsAt.getTime() - now.getTime();
  if (left <= 0) return -left <= ENDED_WINDOW ? 'ENDED' : null;
  if (left <= DAY) return 'DAYS_1';
  if (left <= 7 * DAY) return 'DAYS_7';
  return null;
}

/** One reminder per stage, course, and end date: a renewal moves the end date, so its reminders are new. */
export function reminderKey(stage: ReminderStage, courseId: string, endsAt: Date): string {
  return `renewal:${stage}:${courseId}:${endsAt.toISOString()}`;
}

export interface WindowRow {
  userId: string;
  courseId: string;
  endsAt: Date | null;
}

/**
 * The end of each learner's access per course, from their live (not revoked, active enrollment)
 * entitlements: the latest end, or none when any of them is lifetime or free.
 */
export function accessEnds(rows: WindowRow[]): { userId: string; courseId: string; endsAt: Date }[] {
  const latest = new Map<string, { userId: string; courseId: string; endsAt: Date | null }>();
  for (const row of rows) {
    const key = `${row.userId}:${row.courseId}`;
    const seen = latest.get(key);
    if (!seen) latest.set(key, { ...row });
    else if (seen.endsAt !== null && (row.endsAt === null || row.endsAt > seen.endsAt)) seen.endsAt = row.endsAt;
  }
  return [...latest.values()].filter((entry): entry is { userId: string; courseId: string; endsAt: Date } => entry.endsAt !== null);
}
