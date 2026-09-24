// Tests for the CloudFront router. Run: node --test devops/terraform/environments/production/edge/
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const source = readFileSync(new URL('./site-router.js', import.meta.url), 'utf8').replace('__APEX_DOMAIN__', 'oxinov.com');
const handler = new Function(`${source}; return handler;`)();

const run = (uri, host = 'oxinov.com', querystring = {}) =>
  handler({ request: { uri, querystring, headers: { host: { value: host } } } });

describe('oxinov.com router', () => {
  it('serves directory indexes for clean URLs', () => {
    assert.equal(run('/').uri, '/index.html');
    assert.equal(run('/about/').uri, '/about/index.html');
    assert.equal(run('/legal/privacy/').uri, '/legal/privacy/index.html');
  });

  it('leaves files untouched', () => {
    assert.equal(run('/_next/static/chunks/app.js').uri, '/_next/static/chunks/app.js');
    assert.equal(run('/404.html').uri, '/404.html');
    assert.equal(run('/brand/logo.svg').uri, '/brand/logo.svg');
  });

  it('adds the trailing slash with a permanent redirect, keeping the query', () => {
    const response = run('/pricing', 'oxinov.com', { plan: { value: 'plus' } });
    assert.equal(response.statusCode, 301);
    assert.equal(response.headers.location.value, '/pricing/?plan=plus');
  });

  it('sends www and the CloudFront hostname to the apex', () => {
    const www = run('/about/', 'www.oxinov.com', { a: { value: '1', multiValue: [{ value: '1' }, { value: '2' }] } });
    assert.equal(www.statusCode, 301);
    assert.equal(www.headers.location.value, 'https://oxinov.com/about/?a=1&a=2');
    assert.equal(run('/', 'd111111abcdef8.cloudfront.net').headers.location.value, 'https://oxinov.com/');
  });
});
