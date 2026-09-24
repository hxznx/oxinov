/**
 * Server-only configuration for an Oxinov web app that signs people in at id.oxinov.com, validated on
 * first use so misconfiguration fails loudly. Every app has its own OIDC client and API audience
 * (FR-ID-2207) and its own cookie names, so apps sharing a host during development never collide.
 */
export interface WebAuthConfig {
  appUrl: string;
  issuer: string;
  clientId: string;
  clientSecret: string;
  sessionSecret: string;
  secureCookies: boolean;
  sessionCookie: string;
  transactionCookie: string;
}

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required (see the app's .env.example)`);
  return value;
}

/** Reads APP_URL, OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET and SESSION_SECRET. */
export function loadWebAuthConfig(cookiePrefix: string, env: NodeJS.ProcessEnv = process.env): WebAuthConfig {
  if (!/^[a-z][a-z0-9]*$/.test(cookiePrefix)) throw new Error('cookiePrefix must be lowercase letters and digits');
  const appUrl = required(env, 'APP_URL').replace(/\/$/, '');
  const sessionSecret = required(env, 'SESSION_SECRET');
  if (sessionSecret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
  return {
    appUrl,
    issuer: required(env, 'OIDC_ISSUER').replace(/\/$/, ''),
    clientId: required(env, 'OIDC_CLIENT_ID'),
    clientSecret: required(env, 'OIDC_CLIENT_SECRET'),
    sessionSecret,
    // Browsers only keep Secure cookies over HTTPS; local development runs on http://localhost.
    secureCookies: appUrl.startsWith('https://'),
    sessionCookie: `${cookiePrefix}_session`,
    transactionCookie: `${cookiePrefix}_signin`,
  };
}
