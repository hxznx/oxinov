'use server';

import { redirect } from 'next/navigation';
import { currentSession } from '@/lib/current-session.ts';
import { PlatformApiError, platformApi } from '@/lib/platform-api.ts';

export interface WelcomeState {
  error?: string;
}

const MESSAGES: Record<string, string> = {
  POLICY_VERSION_OUTDATED: 'A policy was updated while you were reading. Review the latest version and try again.',
  POLICY_ACCEPTANCE_REQUIRED: 'Please accept every listed policy to continue.',
  EMAIL_NOT_VERIFIED: 'Verify your email address before continuing.',
  ACCOUNT_SUSPENDED: 'This account is suspended. Contact Oxinov support to appeal.',
  VALIDATION_FAILED: 'Check your details and try again.',
};

/** FR-ID-2205 / FR-POLICY-2404: submits the welcome answers or re-acceptance to api.oxinov.com. */
export async function submitWelcome(_: WelcomeState, form: FormData): Promise<WelcomeState> {
  const session = await currentSession('/welcome');
  if (!session) redirect('/auth/login?returnTo=%2Fwelcome');

  const accepted = form.getAll('policy').map((value) => {
    const [policyId, version] = String(value).split('@');
    return { policyId, version: Number(version) };
  });
  if (form.get('agree') !== 'yes') return { error: 'Tick the box to agree to the Oxinov policies.' };
  const shared = { accepted, channel: 'WEB', locale: 'en' };

  try {
    if (form.get('mode') === 'update') {
      await platformApi.acceptPolicies(session.accessToken, shared);
    } else {
      if (form.get('age') !== 'yes') return { error: 'Confirm that you meet the minimum age to continue.' };
      const displayName = String(form.get('displayName') ?? '').trim();
      await platformApi.welcome(session.accessToken, {
        ...shared,
        country: String(form.get('country') ?? ''),
        ageConfirmed: true,
        ...(displayName ? { displayName } : {}),
      });
    }
  } catch (error) {
    if (error instanceof PlatformApiError) return { error: MESSAGES[error.code] ?? 'Something went wrong. Please try again.' };
    return { error: 'The Oxinov service is unavailable. Please try again shortly.' };
  }
  redirect('/');
}
