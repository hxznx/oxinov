import Link from 'next/link';
import { EduHeader } from '@/components/EduHeader';

export default function NotFound() {
  return (
    <>
      <EduHeader signedIn={false} />
      <main id="main" className="mx-auto max-w-3xl px-4 py-16">
        <p className="hud-label">// Not found</p>
        <h1 className="mt-2 text-4xl">We could not find that page</h1>
        <p className="mt-3 text-muted">
          The course or learning space may have moved, or you may not be a member of it yet.
        </p>
        <p className="mt-6">
          <Link href="/" className="btn btn-primary">
            Go to your learning spaces
          </Link>
        </p>
      </main>
    </>
  );
}
