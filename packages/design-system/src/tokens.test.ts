import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AA_TEXT, contrastRatio } from './contrast.js';
import { renderTokensCss } from './css.js';
import { themes, type ThemeName } from './tokens.js';

const textTokens = ['text', 'textMuted', 'brand', 'brand2', 'brandMid', 'highlight', 'success', 'warning', 'danger'] as const;

describe('contrast (WCAG 2.2 AA, FR-SITE-2102)', () => {
  for (const name of Object.keys(themes) as ThemeName[]) {
    const theme = themes[name];

    for (const background of ['bg', 'surface'] as const) {
      it(`${name}: text tokens are readable on ${background}`, () => {
        for (const token of textTokens) {
          const ratio = contrastRatio(theme[token], theme[background]);
          assert.ok(ratio >= AA_TEXT, `${name} ${token} ${theme[token]} on ${background}: ${ratio.toFixed(2)}`);
        }
        for (const [product, color] of Object.entries(theme.product)) {
          const ratio = contrastRatio(color, theme[background]);
          assert.ok(ratio >= AA_TEXT, `${name} product.${product} ${color} on ${background}: ${ratio.toFixed(2)}`);
        }
      });
    }

    it(`${name}: text on neon-filled buttons is readable`, () => {
      for (const fill of [theme.brand, ...Object.values(theme.product)]) {
        const ratio = contrastRatio(theme.onNeon, fill);
        assert.ok(ratio >= AA_TEXT, `${name} onNeon on ${fill}: ${ratio.toFixed(2)}`);
      }
    });
  }

  it('checks known reference values', () => {
    assert.equal(contrastRatio('#000000', '#FFFFFF').toFixed(1), '21.0');
    assert.equal(contrastRatio('#FFFFFF', '#FFFFFF'), 1);
  });
});

describe('generated CSS', () => {
  const css = renderTokensCss();

  it('defaults to the dark theme and offers the Daylight theme', () => {
    assert.match(css, /:root \{[^}]*--ox-color-bg: #07070D;/s);
    assert.match(css, /:root\[data-theme="light"\] \{[^}]*--ox-color-bg: #F4F7FB;/s);
    assert.match(css, /@media \(prefers-color-scheme: light\)/);
  });

  it('turns off motion when the device asks for reduced motion', () => {
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*--ox-duration-glitch: 0ms;/);
  });

  it('exposes every product accent', () => {
    for (const product of Object.keys(themes.dark.product)) {
      assert.match(css, new RegExp(`--ox-color-product-${product}:`));
    }
  });
});
