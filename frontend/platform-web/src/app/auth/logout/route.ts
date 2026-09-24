import { NextResponse, type NextRequest } from 'next/server';
import { portalConfig } from '@/lib/config.ts';
import { endSessionUrl, revokeRefreshToken } from '@/lib/oidc.ts';
import { SESSION_COOKIE, unsealSession } from '@/lib/session.ts';

/**
 * Signs out here and at id.oxinov.com (FR-ID-2208). POST only, from this site's own form, so another
 * site cannot sign people out (cross-site request protection).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const config = portalConfig();
  if (request.headers.get('origin') !== new URL(config.appUrl).origin) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Sign out from the Oxinov account page.' } }, { status: 403 });
  }
  const session = await unsealSession(request.cookies.get(SESSION_COOKIE)?.value, config.sessionSecret);
  if (session) await revokeRefreshToken(session.refreshToken);
  // 303 turns the POST into a GET for the identity provider's logout page.
  const response = NextResponse.redirect(await endSessionUrl(), 303);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
