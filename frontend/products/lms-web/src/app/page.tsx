import Link from 'next/link';
import { EduHeader } from '@/components/EduHeader';
import { auth } from '@/lib/auth.ts';
import { eduApi, type TenantRole } from '@/lib/edu-api.ts';
import { load } from '@/lib/guard.ts';
import { CreateWorkspaceForm } from './CreateWorkspaceForm';
import { JoinForm } from './JoinForm';

const SIGN_IN_MESSAGES: Record<string, string> = {
  cancelled: 'Sign-in was cancelled.',
  expired: 'Your sign-in expired. Please try again.',
  failed: 'We could not complete sign-in. Please try again.',
};

const ROLE_LABEL: Record<TenantRole, string> = {
  LEARNER: 'Learner',
  INSTRUCTOR: 'Instructor',
  ADMIN: 'Administrator',
  OWNER: 'Owner',
};

type Props = { searchParams: Promise<{ signin?: string }> };

export default async function EduHome({ searchParams }: Props) {
  const session = await auth.currentSession('/');
  if (!session) return <SignedOut message={SIGN_IN_MESSAGES[(await searchParams).signin ?? '']} />;

  const workspaces = await load('/', () => eduApi.workspaces(session.accessToken));

  return (
    <>
      <EduHeader signedIn />
      <main id="main" className="mx-auto grid max-w-6xl gap-8 px-4 py-10">
        <div>
          <p className="hud-label">// Oxinov Edu</p>
          <h1 className="mt-2 text-4xl">Your learning spaces</h1>
          <p className="mt-2 text-muted">Each school or training centre has its own space with its courses and exams.</p>
        </div>

        {workspaces.length === 0 ? (
          <section className="card max-w-2xl" aria-labelledby="empty-heading">
            <h2 id="empty-heading" className="text-2xl">
              You have not joined a learning space yet
            </h2>
            <p className="mt-2 text-muted">
              Ask your school or training centre for its join code and enter it below. If you run a school, you can
              create its space.
            </p>
          </section>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Learning spaces">
            {workspaces.map((workspace) => (
              <li key={workspace.id}>
                <Link
                  href={`/w/${workspace.slug}`}
                  className="card card-link block h-full"
                  style={workspace.primaryColor ? { borderColor: workspace.primaryColor } : undefined}
                >
                  <span className="text-xl">{workspace.name}</span>
                  <span className="hud-label mt-1 block">
                    // {ROLE_LABEL[workspace.role]} · {workspace.slug}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <section className="card max-w-2xl" aria-labelledby="join-heading">
          <h2 id="join-heading" className="text-2xl">
            Join with a code
          </h2>
          <p className="mt-2 text-muted">Your school or teacher gives you an 8-character code.</p>
          <JoinForm />
        </section>

        <section className="card max-w-2xl" aria-labelledby="create-heading">
          <h2 id="create-heading" className="text-2xl">
            Create a learning space
          </h2>
          <p className="mt-2 text-muted">For schools and training centres. You become its owner and can add courses.</p>
          <CreateWorkspaceForm />
        </section>
      </main>
    </>
  );
}

function SignedOut({ message }: { message?: string }) {
  const googleEnabled = process.env.GOOGLE_SIGNIN_ENABLED === 'true';
  return (
    <>
      <EduHeader signedIn={false} />
      <main id="main" className="grid-bg scanlines min-h-[80vh]">
        <div className="relative z-10 mx-auto max-w-md px-4 py-20 text-center">
          <img src="/brand/oxinov-symbol-glow.svg" alt="" width={88} height={88} className="logo-dark mx-auto mb-6" />
          <p className="hud-label">// Learn with your school</p>
          <h1 className="mt-2 font-display text-3xl">
            <span className="text-gradient">Sign in to Oxinov Edu</span>
          </h1>
          {message ? (
            <p role="alert" className="notice notice-error mt-6 text-left">
              {message}
            </p>
          ) : null}
          <div className="mt-8 grid gap-3">
            {googleEnabled ? (
              <a href="/auth/login?idp=google" className="btn btn-secondary justify-center">
                Continue with Google
              </a>
            ) : null}
            <a href="/auth/login" className="btn btn-primary justify-center">
              Continue with email
            </a>
          </div>
          <p className="mt-6 text-sm text-muted">One Oxinov account for every product. No password needed.</p>
        </div>
      </main>
    </>
  );
}
