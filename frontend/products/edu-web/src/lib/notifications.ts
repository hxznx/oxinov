/**
 * Notification helpers (FR-COMM-704). Pure functions, unit-tested without the API.
 */
import type { NotificationKind } from './edu-api.ts';

export const NOTIFICATION_STYLE: Record<NotificationKind, { label: string; glyph: string; tone: string }> = {
  PAYMENT_APPROVED: { label: 'Payment', glyph: '₹', tone: '--ox-color-success' },
  PAYMENT_REJECTED: { label: 'Payment', glyph: '!', tone: '--ox-color-danger' },
  RENEWAL_DUE: { label: 'Renewal', glyph: '⏱', tone: '--ox-color-warning' },
  ACCESS_ENDED: { label: 'Renewal', glyph: '⏱', tone: '--ox-color-text-muted' },
  NOTICE: { label: 'From Oxinov', glyph: '◆', tone: '--ox-color-brand2' },
};

/**
 * A notification link as a path inside the Edu web app, or null. Rejects other sites, protocol-relative
 * addresses (`//`), backslashes, and anything that is not a plain path, so opening a notice can never
 * send the learner elsewhere.
 */
export function safeLinkPath(value: string | null | undefined): string | null {
  if (!value) return null;
  const path = value.trim();
  if (path.length < 2 || path.length > 500) return null;
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return null;
  if (/[\s<>"']/.test(path) || /^\/[a-z][a-z0-9+.-]*:/i.test(path)) return null;
  return path;
}

/** "Just now", "5 min ago", "3 h ago", "Yesterday", or a date, in Nepal time. */
export function whenLabel(iso: string, now: Date = new Date()): string {
  const ms = now.getTime() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} h ago`;
  if (hours < 48) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en', { timeZone: 'Asia/Kathmandu', day: 'numeric', month: 'short' });
}
