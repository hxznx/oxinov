import { NextResponse, type NextRequest } from 'next/server';
import { portalConfig } from '@/lib/config.ts';
import { refreshTokens } from '@/lib/oidc.ts';
import { safeReturnTo } from '@/lib/return-to.ts';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, cookieOptions, sealSession, unsealSession } from '@/lib/session.ts';

/**
 * Rotates tokens (FR-ID-2208). Keycloak refresh tokens are single use, so the new one replaces the old
 * immediately; a rejected refresh (revoked, reused, or expired session) signs the person out.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const config = portalConfig();
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get('returnTo'));
  const session = await unsealSession(request.cookies.get(SESSION_COOKIE)?.value, config.sessionSecret);
  if (!session) return NextResponse.redirect(`${config.appUrl}/auth/login?returnTo=${encodeURIComponent(returnTo)}`);

  try {
    const tokens = await refreshTokens(session.refreshToken);
    const response = NextResponse.redirect(`${config.appUrl}${returnTo}`);
    response.cookies.set(
      SESSION_COOKIE,
      await sealSession(
        {
          subject: session.subject,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          accessExpiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
        },
        config.sessionSecret,
      ),
      cookieOptions(config.secureCookies, SESSION_MAX_AGE_SECONDS),
    );
    return response;
  } catch {
    const response = NextResponse.redirect(`${config.appUrl}/?signin=expired`);
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
}
