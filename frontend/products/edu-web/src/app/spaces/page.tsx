import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { EduHeader } from '@/components/EduHeader';
import { auth } from '@/lib/auth.ts';
import { eduApi, type TenantRole } from '@/lib/edu-api.ts';
import { load } from '@/lib/guard.ts';
import { CreateWorkspaceForm } from '../CreateWorkspaceForm';
import { JoinForm } from '../JoinForm';

const ROLE_LABEL: Record<TenantRole, string> = {
  LEARNER: 'Learner',
  INSTRUCTOR: 'Instructor',
  ADMIN: 'Administrator',
  OWNER: 'Owner',
};

export const metadata: Metadata = { title: 'My learning' };

/** The signed-in person's learning spaces: the Oxinov store, schools they joined, and ones they run. */
export default async function SpacesPage() {
  const session = await auth.currentSession('/spaces');
  if (!session) redirect('/auth/login?returnTo=%2Fspaces');

  const workspaces = await load('/spaces', () => eduApi.workspaces(session.accessToken));

  return (
    <>
      <EduHeader signedIn />
      <main id="main" className="mx-auto grid max-w-6xl gap-8 px-4 py-10">
        <div>
          <p className="hud-label">// Oxinov Edu</p>
          <h1 className="mt-2 text-4xl">My learning</h1>
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
