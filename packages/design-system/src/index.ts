export * from './tokens.js';
export { AA_TEXT, contrastRatio, luminance } from './contrast.js';
export { renderTokensCss } from './css.js';

/** Brand asset file names, served from `@oxinov/design-system/brand/<file>`. */
export const brandAssets = {
  symbol: 'oxinov-symbol.svg',
  symbolGlow: 'oxinov-symbol-glow.svg',
  symbolLight: 'oxinov-symbol-light.svg',
  symbolMono: 'oxinov-symbol-mono.svg',
  appIcon: 'oxinov-app-icon.svg',
  masterArtwork: 'oxinov-logo-original.jpg',
} as const;
