import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse, type NextRequest } from 'next/server';
import { loadWebAuthConfig, type WebAuthConfig } from './config.ts';
import { createOidcClient, type OidcClient } from './oidc.ts';
import { codeChallenge, randomToken } from './pkce.ts';
import { safeReturnTo } from './return-to.ts';
import {
  SESSION_MAX_AGE_SECONDS,
  TRANSACTION_MAX_AGE_SECONDS,
  cookieOptions,
  sealSession,
  sealTransaction,
  unsealSession,
  unsealTransaction,
  type WebSession,
} from './session.ts';

/** Refresh a little early so a token never expires between the check and the API call. */
const REFRESH_MARGIN_SECONDS = 30;

type Handler = (request: NextRequest) => Promise<NextResponse>;

export interface WebAuth {
  config(): WebAuthConfig;
  oidc: OidcClient;
  /**
   * Reads the sealed session in a server component. Returns null when signed out. When the access token
   * is about to expire, sends the browser through /auth/refresh (only route handlers may set cookies).
   */
  currentSession(returnTo: string): Promise<WebSession | null>;
  requireSession(returnTo: string): Promise<WebSession>;
  /** Route handlers for app/auth/{login,callback,refresh}/route.ts (GET) and app/auth/logout/route.ts (POST). */
  handlers: { login: Handler; callback: Handler; refresh: Handler; logout: Handler };
}

/**
 * Backend-for-frontend sign-in for an Oxinov web app (docs/04-architecture/identity-and-access.md). Tokens
 * never reach the browser: they live in an encrypted HttpOnly cookie named after `cookiePrefix`.
 */
export function createWebAuth(options: { cookiePrefix: string }): WebAuth {
  let cached: WebAuthConfig | undefined;
  const config = () => (cached ??= loadWebAuthConfig(options.cookiePrefix));
  const oidc = createOidcClient(config);

  const sessionFromTokens = (subject: string, tokens: { access_token: string; refresh_token: string; expires_in: number }): WebSession => ({
    subject,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    accessExpiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
  });

  async function currentSession(returnTo: string): Promise<WebSession | null> {
    // Read cookies before the configuration so Next.js treats the page as per-request, never prerendered.
    const store = await cookies();
    const { sessionCookie, sessionSecret } = config();
    const session = await unsealSession(store.get(sessionCookie)?.value, sessionSecret);
    if (!session) return null;
    if (session.accessExpiresAt - REFRESH_MARGIN_SECONDS <= Math.floor(Date.now() / 1000)) {
      redirect(`/auth/refresh?returnTo=${encodeURIComponent(returnTo)}`);
    }
    return session;
  }

  /**
   * Starts sign-in at id.oxinov.com (FR-ID-2201, FR-ID-2202). `?idp=google` skips straight to Google;
   * `?screen=signup` opens account creation, so the public website can offer "Create account" (FR-ID-2202, FR-SITE-2101).
   */
  const login: Handler = async (request) => {
    const cfg = config();
    const transaction = {
      state: randomToken(),
      verifier: randomToken(48),
      nonce: randomToken(),
      returnTo: safeReturnTo(request.nextUrl.searchParams.get('returnTo')),
    };
    const idp = request.nextUrl.searchParams.get('idp');
    const location = await oidc.authorizationUrl({
      state: transaction.state,
      nonce: transaction.nonce,
      challenge: codeChallenge(transaction.verifier),
      ...(idp === 'google' ? { idpHint: 'google' } : {}),
      ...(request.nextUrl.searchParams.get('screen') === 'signup' ? { prompt: 'create' as const } : {}),
    });
    const response = NextResponse.redirect(location);
    response.cookies.set(
      cfg.transactionCookie,
      await sealTransaction(transaction, cfg.sessionSecret),
      cookieOptions(cfg.secureCookies, TRANSACTION_MAX_AGE_SECONDS),
    );
    return response;
  };

  /**
   * Completes sign-in: the state must match this browser's transaction, the code is exchanged with the
   * PKCE verifier and client secret, and the ID token's nonce must match before a session is created.
   */
  const callback: Handler = async (request) => {
    const cfg = config();
    const params = request.nextUrl.searchParams;
    const transaction = await unsealTransaction(request.cookies.get(cfg.transactionCookie)?.value, cfg.sessionSecret);

    const fail = (reason: string) => {
      const response = NextResponse.redirect(`${cfg.appUrl}/?signin=${reason}`);
      response.cookies.delete(cfg.transactionCookie);
      return response;
    };

    if (params.get('error')) return fail('cancelled');
    const code = params.get('code');
    if (!transaction || !code || params.get('state') !== transaction.state) return fail('expired');

    try {
      const tokens = await oidc.exchangeCode(code, transaction.verifier);
      const subject = await oidc.verifyIdToken(tokens.id_token, transaction.nonce);
      const response = NextResponse.redirect(`${cfg.appUrl}${transaction.returnTo}`);
      response.cookies.delete(cfg.transactionCookie);
      response.cookies.set(
        cfg.sessionCookie,
        await sealSession(sessionFromTokens(subject, tokens), cfg.sessionSecret),
        cookieOptions(cfg.secureCookies, SESSION_MAX_AGE_SECONDS),
      );
      return response;
    } catch {
      return fail('failed');
    }
  };

  /**
   * Rotates tokens (FR-ID-2208). Refresh tokens are single use, so the new one replaces the old
   * immediately; a rejected refresh (revoked, reused, or expired session) signs the person out.
   */
  const refresh: Handler = async (request) => {
    const cfg = config();
    const returnTo = safeReturnTo(request.nextUrl.searchParams.get('returnTo'));
    const session = await unsealSession(request.cookies.get(cfg.sessionCookie)?.value, cfg.sessionSecret);
    if (!session) return NextResponse.redirect(`${cfg.appUrl}/auth/login?returnTo=${encodeURIComponent(returnTo)}`);

    try {
      const tokens = await oidc.refreshTokens(session.refreshToken);
      const response = NextResponse.redirect(`${cfg.appUrl}${returnTo}`);
      response.cookies.set(
        cfg.sessionCookie,
        await sealSession(sessionFromTokens(session.subject, tokens), cfg.sessionSecret),
        cookieOptions(cfg.secureCookies, SESSION_MAX_AGE_SECONDS),
      );
      return response;
    } catch {
      const response = NextResponse.redirect(`${cfg.appUrl}/?signin=expired`);
      response.cookies.delete(cfg.sessionCookie);
      return response;
    }
  };

  /**
   * Signs out here and at id.oxinov.com (FR-ID-2208). POST only, from this site's own form, so another
   * site cannot sign people out (cross-site request protection).
   */
  const logout: Handler = async (request) => {
    const cfg = config();
    if (request.headers.get('origin') !== new URL(cfg.appUrl).origin) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Sign out from this Oxinov site.' } }, { status: 403 });
    }
    const session = await unsealSession(request.cookies.get(cfg.sessionCookie)?.value, cfg.sessionSecret);
    if (session) await oidc.revokeRefreshToken(session.refreshToken);
    // 303 turns the POST into a GET for the identity provider's logout page.
    const response = NextResponse.redirect(await oidc.endSessionUrl(), 303);
    response.cookies.delete(cfg.sessionCookie);
    return response;
  };

  return {
    config,
    oidc,
    currentSession,
    async requireSession(returnTo) {
      const session = await currentSession(returnTo);
      if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
      return session;
    },
    handlers: { login, callback, refresh, logout },
  };
}

export { safeReturnTo } from './return-to.ts';
export type { WebSession } from './session.ts';
export type { WebAuthConfig } from './config.ts';
