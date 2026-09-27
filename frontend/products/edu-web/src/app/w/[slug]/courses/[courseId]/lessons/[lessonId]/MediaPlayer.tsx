'use client';

import { useEffect, useRef, useState } from 'react';
import { savePlayback } from '@/app/media-actions';
import type { LessonMedia } from '@/lib/edu-api.ts';
import { formatClock } from '@/lib/exam.ts';
import { playedDelta, resumePoint } from '@/lib/media.ts';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SAVE_EVERY_MS = 5000;

/**
 * Video and audio player (FR-PLAYER-401/402/404): native controls with keyboard support, speed from 0.5× to
 * 2×, resume from the saved position, and progress saved every five seconds and when paused or closed.
 * Only time actually played counts toward completion; seeking ahead does not.
 */
export function MediaPlayer({ media, tenantId, title }: { media: LessonMedia; tenantId: string; title: string }) {
  const ref = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const lastTime = useRef(0);
  const unsaved = useRef(0);
  const [speed, setSpeed] = useState(1);
  const [completed, setCompleted] = useState(media.completed);
  const [resumed, setResumed] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const save = async () => {
      const played = unsaved.current;
      if (played < 1 && element.paused === false) return;
      unsaved.current = 0;
      const result = await savePlayback({ tenantId, mediaId: media.id, positionSec: element.currentTime, playedSec: played });
      if (result?.completed) setCompleted(true);
      else if (!result) unsaved.current += played; // keep the time for the next attempt
    };

    const onLoaded = () => {
      const start = resumePoint(media.resumeSec, media.durationSec ?? element.duration);
      if (start > 0) {
        element.currentTime = start;
        setResumed(start);
      }
      lastTime.current = element.currentTime;
    };
    const onTimeUpdate = () => {
      unsaved.current += playedDelta(lastTime.current, element.currentTime, !element.paused);
      lastTime.current = element.currentTime;
    };
    const onSeeked = () => {
      lastTime.current = element.currentTime;
    };
    const onPauseOrEnd = () => void save();
    const onHide = () => document.visibilityState === 'hidden' && void save();

    element.addEventListener('loadedmetadata', onLoaded);
    element.addEventListener('timeupdate', onTimeUpdate);
    element.addEventListener('seeked', onSeeked);
    element.addEventListener('pause', onPauseOrEnd);
    element.addEventListener('ended', onPauseOrEnd);
    document.addEventListener('visibilitychange', onHide);
    const timer = window.setInterval(() => !element.paused && void save(), SAVE_EVERY_MS);
    return () => {
      window.clearInterval(timer);
      element.removeEventListener('loadedmetadata', onLoaded);
      element.removeEventListener('timeupdate', onTimeUpdate);
      element.removeEventListener('seeked', onSeeked);
      element.removeEventListener('pause', onPauseOrEnd);
      element.removeEventListener('ended', onPauseOrEnd);
      document.removeEventListener('visibilitychange', onHide);
      void save();
    };
  }, [media.id, media.durationSec, media.resumeSec, tenantId]);

  useEffect(() => {
    if (ref.current) ref.current.playbackRate = speed;
  }, [speed]);

  const common = {
    ref,
    src: media.url,
    controls: true,
    preload: 'metadata' as const,
    controlsList: 'nodownload',
    'aria-label': `${media.kind === 'VIDEO' ? 'Video' : 'Audio'}: ${title}`,
  };

  return (
    <div className="card grid gap-3">
      {media.kind === 'VIDEO' ? (
        <video {...common} className="aspect-video w-full bg-black" playsInline />
      ) : (
        <audio {...common} className="w-full" />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Playback speed" className="flex flex-wrap gap-1">
          {SPEEDS.map((value) => (
            <button
              key={value}
              type="button"
              className={`btn text-sm ${speed === value ? 'btn-primary' : 'btn-secondary'}`}
              aria-pressed={speed === value}
              onClick={() => setSpeed(value)}
            >
              {value}×
            </button>
          ))}
        </div>
        <p className="hud-label" aria-live="polite">
          {completed ? '✓ Completed' : resumed ? `Resumed at ${formatClock(resumed)}` : media.durationSec ? formatClock(media.durationSec) : ''}
        </p>
      </div>
    </div>
  );
}
