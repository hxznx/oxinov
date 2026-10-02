'use client';

import { useEffect, useState } from 'react';
import { formatLiveTime, formatLocalTime } from '@/lib/content.ts';

/**
 * A live class start time in the learner's own time zone (FR-COURSE-208). The server cannot know the zone,
 * so the first render shows Nepal time and the browser then switches to the learner's zone.
 */
export function LocalTime({ iso }: { iso: string }) {
  const [text, setText] = useState(() => formatLiveTime(iso));
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setText(formatLocalTime(iso, zone));
  }, [iso]);
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
    </time>
  );
}
