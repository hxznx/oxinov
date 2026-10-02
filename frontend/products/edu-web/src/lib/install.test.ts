// Unit tests for the install helpers. Run: pnpm --filter @oxinov/edu-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { installOffer, isIosSafari } from './install.ts';

const IPHONE_SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0 Mobile/15E148 Safari/604.1';
const ANDROID_CHROME = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36';
const IPAD_DESKTOP_MODE = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

describe('installable web app (FR-MOBILE-1504)', () => {
  it('recognises iPhone and iPad Safari only', () => {
    assert.equal(isIosSafari(IPHONE_SAFARI), true);
    assert.equal(isIosSafari(IPAD_DESKTOP_MODE), true);
    assert.equal(isIosSafari(IPHONE_CHROME), false);
    assert.equal(isIosSafari(ANDROID_CHROME), false);
  });

  it('offers the browser prompt, the iPhone hint, or nothing once installed', () => {
    assert.equal(installOffer({ standalone: false, promptReady: true, userAgent: ANDROID_CHROME }), 'prompt');
    assert.equal(installOffer({ standalone: false, promptReady: false, userAgent: IPHONE_SAFARI }), 'ios-hint');
    assert.equal(installOffer({ standalone: false, promptReady: false, userAgent: ANDROID_CHROME }), 'none');
    assert.equal(installOffer({ standalone: true, promptReady: true, userAgent: ANDROID_CHROME }), 'none');
  });
});
