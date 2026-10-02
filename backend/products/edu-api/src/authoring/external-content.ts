/**
 * Externally hosted lessons and live class links (ADR-028 points 5 and 8). Pure functions: they turn a
 * link an author pastes into a provider and an ID, and refuse anything else, so only IDs that match the
 * provider's format reach the database and the player.
 */

export type ContentSource = 'YOUTUBE' | 'GOOGLE_DRIVE';

export interface ExternalRef {
  source: ContentSource;
  id: string;
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const DRIVE_ID = /^[A-Za-z0-9_-]{20,128}$/;
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com']);
const DRIVE_HOSTS = new Set(['drive.google.com', 'docs.google.com']);

function parseUrl(input: string): URL | null {
  const text = input.trim();
  if (!text || text.length > 2000) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

/** YouTube watch, short, embed, live, and youtu.be links, or a bare 11-character video ID. */
export function parseYouTube(input: string): string | null {
  const bare = input.trim();
  if (YOUTUBE_ID.test(bare)) return bare;
  const url = parseUrl(bare);
  if (!url) return null;
  const host = url.hostname.toLowerCase();
  let id: string | null = null;
  if (host === 'youtu.be') id = url.pathname.split('/')[1] ?? null;
  else if (YOUTUBE_HOSTS.has(host)) {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'watch') id = url.searchParams.get('v');
    else if (['embed', 'shorts', 'live', 'v'].includes(parts[0] ?? '')) id = parts[1] ?? null;
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

/** Google Drive file links and Google Docs, Slides, and Sheets links. */
export function parseDrive(input: string): string | null {
  const url = parseUrl(input);
  if (!url || !DRIVE_HOSTS.has(url.hostname.toLowerCase())) return null;
  const parts = url.pathname.split('/').filter(Boolean);
  const d = parts.indexOf('d');
  const id = d >= 0 ? parts[d + 1] : url.searchParams.get('id');
  return id && DRIVE_ID.test(id) ? id : null;
}

/** Any supported external link; YouTube is tried first. */
export function parseExternal(input: string): ExternalRef | null {
  const youtube = parseYouTube(input);
  if (youtube) return { source: 'YOUTUBE', id: youtube };
  const drive = parseDrive(input);
  return drive ? { source: 'GOOGLE_DRIVE', id: drive } : null;
}

/** Address the player frames: YouTube's privacy-enhanced embed or Drive's preview (view only). */
export function embedUrl(ref: ExternalRef): string {
  return ref.source === 'YOUTUBE'
    ? `https://www.youtube-nocookie.com/embed/${ref.id}?rel=0&modestbranding=1&playsinline=1`
    : `https://drive.google.com/file/d/${ref.id}/preview`;
}

export type LiveProvider = 'GOOGLE_MEET' | 'ZOOM' | 'MICROSOFT_TEAMS' | 'OTHER';

/**
 * A live class link must be https; known meeting services are named for learners. Returns null for links
 * that are not https or are not valid URLs.
 */
export function liveProvider(input: string): LiveProvider | null {
  const url = parseUrl(input);
  if (!url || url.protocol !== 'https:' || !/^https:\/\//i.test(input.trim())) return null;
  const host = url.hostname.toLowerCase();
  if (host === 'meet.google.com') return 'GOOGLE_MEET';
  if (host === 'zoom.us' || host.endsWith('.zoom.us')) return 'ZOOM';
  if (host === 'teams.microsoft.com' || host === 'teams.live.com') return 'MICROSOFT_TEAMS';
  return 'OTHER';
}

/** The ordinary link authors see in the builder, to check they pasted the right video or file. */
export function authorUrl(ref: ExternalRef): string {
  return ref.source === 'YOUTUBE' ? `https://www.youtube.com/watch?v=${ref.id}` : `https://drive.google.com/file/d/${ref.id}/view`;
}

/** Which sources fit a lesson kind: video takes YouTube or Drive, document takes Drive, others take none. */
export function sourceProblem(kind: string, ref: ExternalRef): string | null {
  if (kind === 'VIDEO') return null;
  if (kind === 'DOCUMENT') return ref.source === 'GOOGLE_DRIVE' ? null : 'Document lessons take a Google Drive file. Use a video lesson for YouTube.';
  return 'Only video and document lessons take a YouTube or Google Drive link.';
}
