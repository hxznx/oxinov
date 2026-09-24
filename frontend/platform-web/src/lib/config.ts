/** Server-only portal configuration, validated on first use so misconfiguration fails loudly. */
export interface PortalConfig {
  appUrl: string;
  issuer: string;
  clientId: string;
  clientSecret: string;
  platformApiUrl: string;
  sessionSecret: string;
  secureCookies: boolean;
}

let cached: PortalConfig | undefined;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required (see frontend/platform-web/.env.example)`);
  return value;
}

export function portalConfig(): PortalConfig {
  if (cached) return cached;
  const appUrl = required('APP_URL').replace(/\/$/, '');
  const sessionSecret = required('SESSION_SECRET');
  if (sessionSecret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
  cached = {
    appUrl,
    issuer: required('OIDC_ISSUER').replace(/\/$/, ''),
    clientId: required('OIDC_CLIENT_ID'),
    clientSecret: required('OIDC_CLIENT_SECRET'),
    platformApiUrl: required('PLATFORM_API_URL').replace(/\/$/, ''),
    sessionSecret,
    // Browsers only keep Secure cookies over HTTPS; local development runs on http://localhost.
    secureCookies: appUrl.startsWith('https://'),
  };
  return cached;
}
