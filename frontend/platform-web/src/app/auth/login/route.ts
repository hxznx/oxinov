import { NextResponse, type NextRequest } from 'next/server';
import { portalConfig } from '@/lib/config.ts';
import { authorizationUrl } from '@/lib/oidc.ts';
import { codeChallenge, randomToken } from '@/lib/pkce.ts';
import { safeReturnTo } from '@/lib/return-to.ts';
import { TRANSACTION_COOKIE, TRANSACTION_MAX_AGE_SECONDS, cookieOptions, sealTransaction } from '@/lib/session.ts';

/** Starts sign-in at id.oxinov.com (FR-ID-2201, FR-ID-2202). `?idp=google` skips straight to Google. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const config = portalConfig();
  const transaction = {
    state: randomToken(),
    verifier: randomToken(48),
    nonce: randomToken(),
    returnTo: safeReturnTo(request.nextUrl.searchParams.get('returnTo')),
  };
  const idp = request.nextUrl.searchParams.get('idp');
  const location = await authorizationUrl({
    state: transaction.state,
    nonce: transaction.nonce,
    challenge: codeChallenge(transaction.verifier),
    ...(idp === 'google' ? { idpHint: 'google' } : {}),
  });
  const response = NextResponse.redirect(location);
  response.cookies.set(
    TRANSACTION_COOKIE,
    await sealTransaction(transaction, config.sessionSecret),
    cookieOptions(config.secureCookies, TRANSACTION_MAX_AGE_SECONDS),
  );
  return response;
}
