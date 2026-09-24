import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { legalDocs } from '@/content/site';

export const metadata: Metadata = {
  title: 'Legal',
  description: 'Oxinov policies: terms, privacy, acceptable use, and cookies.',
};

export default function LegalIndexPage() {
  return (
    <>
      <PageHeader label="Legal" title="Policies" />
      <ul className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:grid-cols-2">
        {legalDocs.map((doc) => (
          <li key={doc.slug}>
            <Link href={`/legal/${doc.slug}/`} className="card card-link h-full">
              <h2 className="text-xl">{doc.title}</h2>
              <p className="mt-1 text-muted">{doc.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
