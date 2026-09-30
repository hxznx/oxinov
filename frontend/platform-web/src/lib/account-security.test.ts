// Unit tests for the portal's own helpers. Run: pnpm --filter @oxinov/platform-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { accountSecurityUrl } from './account-security.ts';

describe('account security links (FR-ID-2208)', () => {
  const issuer = 'https://id.oxinov.com/realms/oxinov/';

  it('opens signed-in devices and email change on the identity server', () => {
    assert.equal(accountSecurityUrl('devices', issuer), 'https://id.oxinov.com/realms/oxinov/account/account-security/device-activity');
    assert.equal(accountSecurityUrl('email', issuer), 'https://id.oxinov.com/realms/oxinov/account/');
  });

  it('gives no link without a web address for the issuer', () => {
    assert.equal(accountSecurityUrl('devices', undefined), null);
    assert.equal(accountSecurityUrl('devices', 'javascript:alert(1)'), null);
  });
});
