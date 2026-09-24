import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { portalConfig } from './config.ts';
import { SESSION_COOKIE, unsealSession, type PortalSession } from './session.ts';

/** Refresh a little early so a token never expires between the check and the API call. */
const REFRESH_MARGIN_SECONDS = 30;

/**
 * Reads the sealed session in a server component. Returns null when signed out. When the access token
 * is about to expire, sends the browser through /auth/refresh (only route handlers may set cookies).
 */
export async function currentSession(returnTo: string): Promise<PortalSession | null> {
  const store = await cookies();
  const session = await unsealSession(store.get(SESSION_COOKIE)?.value, portalConfig().sessionSecret);
  if (!session) return null;
  if (session.accessExpiresAt - REFRESH_MARGIN_SECONDS <= Math.floor(Date.now() / 1000)) {
    redirect(`/auth/refresh?returnTo=${encodeURIComponent(returnTo)}`);
  }
  return session;
}

export async function requireSession(returnTo: string): Promise<PortalSession> {
  const session = await currentSession(returnTo);
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  return session;
}
