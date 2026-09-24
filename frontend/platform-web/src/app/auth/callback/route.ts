import { NextResponse, type NextRequest } from 'next/server';
import { portalConfig } from '@/lib/config.ts';
import { exchangeCode, verifyIdToken } from '@/lib/oidc.ts';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  TRANSACTION_COOKIE,
  cookieOptions,
  sealSession,
  unsealTransaction,
} from '@/lib/session.ts';

/**
 * Completes sign-in: the state must match this browser's transaction, the code is exchanged with the
 * PKCE verifier and client secret, and the ID token's nonce must match before a session is created.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const config = portalConfig();
  const params = request.nextUrl.searchParams;
  const transaction = await unsealTransaction(request.cookies.get(TRANSACTION_COOKIE)?.value, config.sessionSecret);

  const fail = (reason: string) => {
    const response = NextResponse.redirect(`${config.appUrl}/?signin=${reason}`);
    response.cookies.delete(TRANSACTION_COOKIE);
    return response;
  };

  if (params.get('error')) return fail('cancelled');
  const code = params.get('code');
  if (!transaction || !code || params.get('state') !== transaction.state) return fail('expired');

  try {
    const tokens = await exchangeCode(code, transaction.verifier);
    const subject = await verifyIdToken(tokens.id_token, transaction.nonce);
    const session = {
      subject,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessExpiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
    };
    const response = NextResponse.redirect(`${config.appUrl}${transaction.returnTo}`);
    response.cookies.delete(TRANSACTION_COOKIE);
    response.cookies.set(SESSION_COOKIE, await sealSession(session, config.sessionSecret), cookieOptions(config.secureCookies, SESSION_MAX_AGE_SECONDS));
    return response;
  } catch {
    return fail('failed');
  }
}
