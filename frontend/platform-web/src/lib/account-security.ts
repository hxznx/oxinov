/**
 * Links to Keycloak's account pages (id.oxinov.com/realms/oxinov/account) for what the portal does not do itself
 * yet: seeing signed-in devices and signing out of all of them (FR-ID-2208), and changing the account email
 * (confirmed by a link to the new address). Built from OIDC_ISSUER, so local development opens the local copy.
 */
export type AccountSecurityPage = 'devices' | 'email';

const PATHS: Record<AccountSecurityPage, string> = {
  devices: '/account/account-security/device-activity',
  email: '/account/',
};

export function accountSecurityUrl(page: AccountSecurityPage, issuer = process.env.OIDC_ISSUER): string | null {
  const base = issuer?.trim().replace(/\/+$/, '');
  if (!base || !/^https?:\/\//.test(base)) return null;
  return `${base}${PATHS[page]}`;
}
