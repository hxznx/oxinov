import type { Metadata } from 'next';
import { pageMetadata } from '@/seo';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { divisions } from '@/content/site';

export const metadata: Metadata = pageMetadata({
  path: '/divisions/',
  title: 'Divisions',
  description:
    'The ten Oxinov divisions, from education and AI to robotics and space. Education is our current focus, starting with Oxinov Edu.',
});

export default function DivisionsPage() {
  return (
    <>
      <PageHeader label="Divisions" title="Ten divisions, one company">
        Education is our current focus. The other divisions are future initiatives that open only with a clear
        need, an owner, and the approvals they require.
      </PageHeader>
      <ul className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {divisions.map((division) => (
          <li key={division.slug}>
            <Link href={`/${division.slug}/`} className="card card-link h-full">
              <StatusBadge status={division.status} regulated={division.regulated} />
              <h2 className="mt-2 text-xl">{division.name}</h2>
              <p className="mt-1 text-muted">{division.tagline}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
