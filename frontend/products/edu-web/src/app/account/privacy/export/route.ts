import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi } from '@/lib/edu-api.ts';

/**
 * "Download my data" (FR-PRIV-3201): the caller's Edu data as a JSON file. Signed-out visitors are sent to
 * sign in and back. The file is never cached.
 */
export async function GET(): Promise<Response> {
  const session = await auth.currentSession('/account/privacy');
  if (!session) return NextResponse.redirect(new URL('/auth/login?returnTo=%2Faccount%2Fprivacy', process.env.APP_URL ?? 'http://localhost:3002'));
  try {
    const data = await eduApi.exportData(session.accessToken);
    const day = new Date().toISOString().slice(0, 10);
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="oxinov-edu-my-data-${day}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const status = error instanceof EduApiError ? error.status : 503;
    return new Response('Your data could not be prepared right now. Try again shortly.', { status: status >= 500 ? 503 : status, headers: { 'Cache-Control': 'no-store' } });
  }
}
