/**
 * Installable web app helpers (FR-MOBILE-1504). Pure functions, unit-tested without a browser.
 */

/** iPhone and iPad Safari have no install prompt; people add the app from the Share menu. */
export function isIosSafari(userAgent: string): boolean {
  const ios = /iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && /Mobile\//i.test(userAgent));
  const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//i.test(userAgent);
  return ios && /Safari/i.test(userAgent) && !otherBrowser;
}

export type InstallOffer = 'prompt' | 'ios-hint' | 'none';

/**
 * What to offer: the browser's own install prompt when it fired, the Share-menu hint on iPhone Safari, and
 * nothing when the app is already installed (opened full screen) or the browser cannot install.
 */
export function installOffer(input: { standalone: boolean; promptReady: boolean; userAgent: string }): InstallOffer {
  if (input.standalone) return 'none';
  if (input.promptReady) return 'prompt';
  return isIosSafari(input.userAgent) ? 'ios-hint' : 'none';
}
