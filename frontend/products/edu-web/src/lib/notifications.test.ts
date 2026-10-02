// Unit tests for the notification helpers. Run: pnpm --filter @oxinov/edu-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { safeLinkPath, whenLabel } from './notifications.ts';

describe('notification helpers (FR-COMM-704)', () => {
  it('keeps links inside Oxinov Edu', () => {
    assert.equal(safeLinkPath('/o/japanese-n5'), '/o/japanese-n5');
    assert.equal(safeLinkPath('/w/oxinov/pay/bank/3f1c?x=1'), '/w/oxinov/pay/bank/3f1c?x=1');
    for (const bad of ['https://evil.example', '//evil.example', '/\\evil.example', 'o/japanese', '/', '/javascript:alert(1)', '/a b', '', null, undefined]) {
      assert.equal(safeLinkPath(bad), null, String(bad));
    }
  });

  it('says when, briefly', () => {
    const now = new Date('2026-10-02T06:00:00Z');
    assert.equal(whenLabel('2026-10-02T05:59:40Z', now), 'Just now');
    assert.equal(whenLabel('2026-10-02T05:55:00Z', now), '5 min ago');
    assert.equal(whenLabel('2026-10-02T03:00:00Z', now), '3 h ago');
    assert.equal(whenLabel('2026-10-01T03:00:00Z', now), 'Yesterday');
    assert.equal(whenLabel('2026-09-20T03:00:00Z', now), 'Sep 20');
  });
});
