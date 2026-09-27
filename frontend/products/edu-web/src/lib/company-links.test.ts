// Unit tests for the links back to the company website. Run: pnpm --filter <this app> test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { companyLinks, companyUrl } from './company-links.ts';

describe('company links', () => {
  it('uses oxinov.com unless COMPANY_URL is set, without a trailing slash', () => {
    assert.equal(companyUrl(undefined), 'https://oxinov.com');
    assert.equal(companyUrl(''), 'https://oxinov.com');
    assert.equal(companyUrl('http://localhost:3000/'), 'http://localhost:3000');
  });

  it('links a product to its page on the company website, then terms, privacy, and help', () => {
    const links = companyLinks({ slug: 'edu', name: 'Oxinov Edu' }, 'https://oxinov.com');
    assert.deepEqual(links.map((link) => link.href), [
      'https://oxinov.com/products/edu/',
      'https://oxinov.com/legal/terms/',
      'https://oxinov.com/legal/privacy/',
      'https://oxinov.com/contact/',
    ]);
    assert.equal(links[0]?.label, 'About Oxinov Edu');
  });

  it('links the account portal to the company home and the product list', () => {
    const links = companyLinks(undefined, 'https://oxinov.com');
    assert.deepEqual(links.slice(0, 2).map((link) => link.href), ['https://oxinov.com/', 'https://oxinov.com/products/']);
  });
});
