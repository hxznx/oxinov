// Unit tests for the portal's own helpers. Run: pnpm --filter @oxinov/platform-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { productUrl } from './product-url.ts';

describe('app launcher', () => {
  const edu = { key: 'edu', address: 'edu.oxinov.com' };

  it('uses the public address unless a local override exists for that product', () => {
    assert.equal(productUrl(edu, undefined), 'https://edu.oxinov.com');
    assert.equal(productUrl(edu, 'market=http://localhost:3005'), 'https://edu.oxinov.com');
    assert.equal(productUrl(edu, 'market=http://localhost:3005, edu=http://localhost:3002/'), 'http://localhost:3002');
  });

  it('ignores overrides that are not web addresses', () => {
    assert.equal(productUrl(edu, 'edu=javascript:alert(1)'), 'https://edu.oxinov.com');
  });
});
