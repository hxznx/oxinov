import type { Metadata } from 'next';
import { EduHeader } from '@/components/EduHeader';
import { auth } from '@/lib/auth.ts';
import { JoinForm } from '../JoinForm';

export const metadata: Metadata = { title: 'Join a learning space' };

type Props = { searchParams: Promise<{ code?: string }> };

/** Shareable join link: /join?code=K7PX-9QMD. Signing in first keeps the code for after sign-in. */
export default async function JoinPage({ searchParams }: Props) {
  const code = ((await searchParams).code ?? '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 20);
  await auth.requireSession(`/join${code ? `?code=${encodeURIComponent(code)}` : ''}`);
  return (
    <>
      <EduHeader signedIn />
      <main id="main" className="mx-auto max-w-xl px-4 py-12">
        <p className="hud-label">// Oxinov Edu</p>
        <h1 className="mt-2 text-4xl">Join a learning space</h1>
        <p className="mt-2 text-muted">Check the code, then join. The school's administrators will see your name and email.</p>
        <div className="card mt-6">
          <JoinForm initialCode={code} />
        </div>
      </main>
    </>
  );
}
