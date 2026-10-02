/**
 * Email allowance rules (FR-COMM-705). Pure functions, unit-tested. Reminders and notices share a daily
 * budget so sign-in codes and payment emails always fit in the provider's allowance; emails over the budget
 * wait for the next day, and an email still waiting after two days is dropped (the in-app notice stands).
 */

/** The counter category for reminders and notices. */
export const BULK = 'BULK';
/** A waiting email older than this is no longer useful as an email. */
export const WAITING_DAYS = 2;
const DAY = 24 * 60 * 60 * 1000;

/** The allowance day: the provider's counters reset at midnight UTC. */
export function allowanceDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** Emails created before this moment are not sent any more. */
export function waitingCutoff(now: Date): Date {
  return new Date(now.getTime() - WAITING_DAYS * DAY);
}

/** How many of `wanted` emails fit in what is left today. */
export function grantable(wanted: number, limit: number, used: number): number {
  return Math.max(0, Math.min(wanted, limit - used));
}

/** The stage and end date of a renewal reminder, read back from its dedupe key (see reminderKey). */
export function renewalFromKey(key: string | null): { daysLeft: 1 | 7; endsAt: Date } | null {
  const match = /^renewal:(DAYS_1|DAYS_7):[0-9a-f-]{36}:(.+)$/.exec(key ?? '');
  if (!match?.[2]) return null;
  const endsAt = new Date(match[2]);
  if (Number.isNaN(endsAt.getTime())) return null;
  return { daysLeft: match[1] === 'DAYS_1' ? 1 : 7, endsAt };
}
