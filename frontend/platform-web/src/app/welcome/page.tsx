import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AccountHeader } from '@/components/AccountHeader';
import { auth } from '@/lib/auth.ts';
import { platformApi } from '@/lib/platform-api.ts';
import { WelcomeForm } from './WelcomeForm';

export const metadata: Metadata = { title: 'Welcome' };

/** FR-ID-2205: the one welcome screen on first sign-in; also used for re-acceptance (FR-POLICY-2404). */
export default async function WelcomePage() {
  const session = await auth.requireSession('/welcome');
  const account = await platformApi.me(session.accessToken);
  if (!account.welcomeRequired && account.outstandingPolicies.length === 0) redirect('/');
  const mode = account.welcomeRequired ? 'welcome' : 'update';

  return (
    <>
      <AccountHeader signedIn />
      <main id="main" className="mx-auto max-w-xl px-4 py-12">
        <p className="hud-label">// {mode === 'welcome' ? 'One last step' : 'Policy update'}</p>
        <h1 className="mt-2 text-4xl">{mode === 'welcome' ? 'Welcome to Oxinov' : 'Our policies changed'}</h1>
        <p className="mt-2 text-muted">
          {mode === 'welcome'
            ? `Signed in as ${account.email}. Confirm a few details to open your account.`
            : 'Please review and accept the updated policies to continue.'}
        </p>
        <WelcomeForm mode={mode} policies={account.outstandingPolicies} displayName={account.displayName ?? ''} />
      </main>
    </>
  );
}
