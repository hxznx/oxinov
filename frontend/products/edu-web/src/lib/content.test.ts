// Unit tests for the external lesson and live class helpers. Run: pnpm --filter @oxinov/edu-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatLiveTime, formatLocalTime, isViewerUrl, liveState, nepalTimeToIso } from './content.ts';

describe('content helpers (ADR-028)', () => {
  it('frames only YouTube privacy embeds and Drive previews', () => {
    assert.equal(isViewerUrl('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1'), true);
    assert.equal(isViewerUrl('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/preview'), true);
    assert.equal(isViewerUrl('https://www.youtube.com/embed/dQw4w9WgXcQ'), false);
    assert.equal(isViewerUrl('http://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'), false);
    assert.equal(isViewerUrl('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view'), false);
    assert.equal(isViewerUrl('https://evil.example/embed/dQw4w9WgXcQ'), false);
    assert.equal(isViewerUrl('javascript:alert(1)'), false);
  });

  it('opens a live class 15 minutes early and closes it when it ends', () => {
    const session = { startsAt: '2026-10-05T13:15:00.000Z', durationMin: 60, cancelled: false };
    assert.equal(liveState(session, new Date('2026-10-05T12:00:00Z')), 'upcoming');
    assert.equal(liveState(session, new Date('2026-10-05T13:05:00Z')), 'soon');
    assert.equal(liveState(session, new Date('2026-10-05T13:30:00Z')), 'live');
    assert.equal(liveState(session, new Date('2026-10-05T14:15:00Z')), 'ended');
    assert.equal(liveState({ ...session, cancelled: true }, new Date('2026-10-05T13:30:00Z')), 'cancelled');
  });

  it('reads form times in Nepal time and shows them with the zone', () => {
    assert.equal(nepalTimeToIso('2026-10-05T19:00'), '2026-10-05T13:15:00.000Z');
    assert.equal(nepalTimeToIso('2026-13-05T19:00'), null);
    assert.equal(nepalTimeToIso('tomorrow'), null);
    assert.equal(formatLiveTime('2026-10-05T13:15:00.000Z'), 'Mon, Oct 5, 7:00 PM Nepal time');
  });

  it('shows a live class in the learner’s own time zone', () => {
    assert.equal(formatLocalTime('2026-10-05T13:15:00.000Z', 'Asia/Kathmandu'), 'Mon, Oct 5, 7:00 PM Nepal time');
    assert.equal(formatLocalTime('2026-10-05T13:15:00.000Z', 'Asia/Tokyo'), 'Mon, Oct 5, 10:15 PM GMT+9');
    assert.equal(formatLocalTime('2026-10-05T13:15:00.000Z', 'Not/AZone'), 'Mon, Oct 5, 7:00 PM Nepal time');
  });
});
