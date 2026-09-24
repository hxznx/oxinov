import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { careers, company } from '@/content/site';

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Work with Oxinov in Lalitpur, Nepal.',
};

export default function CareersPage() {
  return (
    <>
      <PageHeader label="Careers" title="Work with us" />
      <div className="prose-ox mx-auto max-w-6xl px-4 py-12">
        <p>{careers.intro}</p>
        <p>{careers.skills}</p>
        {company.careersEmail ? (
          <p>
            <a className="btn btn-primary" href={`mailto:${company.careersEmail}`}>
              Send your CV
            </a>
          </p>
        ) : (
          <p className="hud-label">// Applications open when the first roles are listed</p>
        )}
      </div>
    </>
  );
}
