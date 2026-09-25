// Unit tests for media helpers. Run: pnpm --filter @oxinov/lms-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mediaContentType, playedDelta, resumePoint } from './media.ts';

describe('media file types', () => {
  it('maps browser names to the API content types', () => {
    assert.equal(mediaContentType({ name: 'a.mp4', type: 'video/mp4' }, 'VIDEO'), 'video/mp4');
    assert.equal(mediaContentType({ name: 'talk.m4a', type: 'audio/x-m4a' }, 'AUDIO'), 'audio/mp4');
    assert.equal(mediaContentType({ name: 'song.mp3', type: 'audio/mp3' }, 'AUDIO'), 'audio/mpeg');
    assert.equal(mediaContentType({ name: 'voice.ogg', type: '' }, 'AUDIO'), 'audio/ogg');
    assert.equal(mediaContentType({ name: 'rec.webm', type: 'video/webm' }, 'AUDIO'), 'audio/webm');
  });

  it('refuses formats browsers cannot play everywhere', () => {
    assert.equal(mediaContentType({ name: 'clip.mov', type: 'video/quicktime' }, 'VIDEO'), null);
    assert.equal(mediaContentType({ name: 'a.mp3', type: 'audio/mpeg' }, 'VIDEO'), null);
    assert.equal(mediaContentType({ name: 'notes.pdf', type: 'application/pdf' }, 'AUDIO'), null);
  });
});

describe('playback tracking', () => {
  it('counts only normal playback, not seeks or pauses', () => {
    assert.equal(playedDelta(10, 10.25, true), 0.25);
    assert.equal(playedDelta(10, 80, true), 0);
    assert.equal(playedDelta(80, 10, true), 0);
    assert.equal(playedDelta(10, 10.25, false), 0);
  });

  it('resumes at the saved point unless nearly finished', () => {
    assert.equal(resumePoint(42, 600), 42);
    assert.equal(resumePoint(598, 600), 0);
    assert.equal(resumePoint(0, 600), 0);
    assert.equal(resumePoint(42, null), 0);
  });
});
