/** Media formats every modern browser plays without processing (mirrors the Edu API's upload rules). */
const TYPES = {
  VIDEO: ['video/mp4', 'video/webm'],
  AUDIO: ['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/webm'],
} as const;

export const MEDIA_ACCEPT: Record<'VIDEO' | 'AUDIO', string> = {
  VIDEO: 'video/mp4,video/webm,.mp4,.webm',
  AUDIO: 'audio/mpeg,audio/mp4,audio/ogg,audio/webm,.mp3,.m4a,.ogg,.oga,.weba',
};

const BY_EXTENSION: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  weba: 'audio/webm',
};

/** Browsers name the same format differently (audio/x-m4a, audio/mp3); map to the API's content types. */
export function mediaContentType(file: { name: string; type: string }, kind: 'VIDEO' | 'AUDIO'): string | null {
  const aliases: Record<string, string> = { 'audio/x-m4a': 'audio/mp4', 'audio/m4a': 'audio/mp4', 'audio/mp3': 'audio/mpeg' };
  const extension = file.name.toLowerCase().split('.').pop() ?? '';
  let type = aliases[file.type] ?? (file.type || BY_EXTENSION[extension] || '');
  // A WebM or MP4 audio track is often reported as video by the operating system.
  if (kind === 'AUDIO' && (type === 'video/webm' || type === 'video/mp4') && ['weba', 'm4a', 'webm'].includes(extension)) type = type.replace('video/', 'audio/');
  return (TYPES[kind] as readonly string[]).includes(type) ? type : null;
}

/** Adds only genuinely played time: skips seeks and pauses, counts at most two seconds per tick. */
export function playedDelta(previousTime: number, currentTime: number, playing: boolean): number {
  const delta = currentTime - previousTime;
  return playing && delta > 0 && delta <= 2 ? delta : 0;
}

/** Resume near the saved position, but start over when the learner had nearly finished. */
export function resumePoint(resumeSec: number, durationSec: number | null): number {
  if (!durationSec || resumeSec <= 0) return 0;
  return resumeSec >= durationSec - 5 ? 0 : resumeSec;
}
