/**
 * Externally hosted lessons and live classes in the web app (ADR-028 points 5 to 8). Pure helpers, unit
 * tested without the API.
 */
import type { LiveProvider } from './edu-api.ts';

/** The only frame addresses the lesson viewer will load: YouTube's privacy-enhanced embed and Drive preview. */
export function isViewerUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    if (url.hostname === 'www.youtube-nocookie.com') return /^\/embed\/[A-Za-z0-9_-]{11}$/.test(url.pathname);
    if (url.hostname === 'drive.google.com') return /^\/file\/d\/[A-Za-z0-9_-]{20,128}\/preview$/.test(url.pathname);
    return false;
  } catch {
    return false;
  }
}

export const LIVE_PROVIDER_LABELS: Record<LiveProvider, string> = {
  GOOGLE_MEET: 'Google Meet',
  ZOOM: 'Zoom',
  MICROSOFT_TEAMS: 'Microsoft Teams',
  OTHER: 'Online meeting',
};

export type LiveState = 'cancelled' | 'ended' | 'live' | 'soon' | 'upcoming';

/** Where a live class is in time: joinable 15 minutes before it starts until it ends. */
export function liveState(session: { startsAt: string; durationMin: number; cancelled: boolean }, now: Date = new Date()): LiveState {
  if (session.cancelled) return 'cancelled';
  const start = new Date(session.startsAt).getTime();
  const end = start + session.durationMin * 60_000;
  const t = now.getTime();
  if (t >= end) return 'ended';
  if (t >= start) return 'live';
  if (t >= start - 15 * 60_000) return 'soon';
  return 'upcoming';
}

/**
 * A date and time typed in the form (`2026-10-05T19:00`) read in Nepal time, as ISO 8601. Returns null when
 * it is not a real date.
 */
export function nepalTimeToIso(local: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const date = new Date(`${local}:00+05:45`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Start time shown to learners, in Nepal time with the zone named. */
export function formatLiveTime(iso: string): string {
  return `${new Date(iso).toLocaleString('en', { timeZone: 'Asia/Kathmandu', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} Nepal time`;
}

/**
 * Start time in a given IANA time zone with the zone named, for example "Mon, Oct 5, 10:15 PM GMT+9" for a
 * learner in Japan. Nepal keeps the friendly "Nepal time" label; an unknown zone falls back to Nepal time.
 */
export function formatLocalTime(iso: string, timeZone: string): string {
  if (timeZone === 'Asia/Kathmandu' || timeZone === 'Asia/Katmandu') return formatLiveTime(iso);
  try {
    return new Date(iso).toLocaleString('en', { timeZone, weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  } catch {
    return formatLiveTime(iso);
  }
}
