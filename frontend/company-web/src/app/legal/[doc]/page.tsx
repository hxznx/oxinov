import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { company, legalDocs } from '@/content/site';

export const dynamicParams = false;

export function generateStaticParams() {
  return legalDocs.map((doc) => ({ doc: doc.slug }));
}

type Props = { params: Promise<{ doc: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { doc: slug } = await params;
  const doc = legalDocs.find((item) => item.slug === slug);
  return doc ? { title: doc.title, description: doc.summary } : {};
}

export default async function LegalDocPage({ params }: Props) {
  const { doc: slug } = await params;
  const doc = legalDocs.find((item) => item.slug === slug);
  if (!doc) notFound();
  return (
    <>
      <PageHeader label="Legal" title={doc.title}>
        {doc.summary}
      </PageHeader>
      <div className="prose-ox mx-auto max-w-6xl px-4 py-12">
        {/* Policy text needs Nepal counsel review before publication (docs/company/PLATFORM-POLICIES.md). */}
        <p>
          This policy is being prepared and reviewed by qualified counsel in Nepal. It will be published here, in
          English and Nepali, before sign-in to any Oxinov product opens.
        </p>
        {doc.slug === 'cookies' ? (
          <p>
            Today this website sets no cookies and loads no analytics. Your theme choice is stored only in your
            browser.
          </p>
        ) : null}
        {company.legalEmail ? (
          <p>
            Questions about this policy or your personal data: <a href={`mailto:${company.legalEmail}`}>{company.legalEmail}</a>.
          </p>
        ) : null}
        <p>
          <Link href="/legal/">All policies</Link>
        </p>
      </div>
    </>
  );
}
