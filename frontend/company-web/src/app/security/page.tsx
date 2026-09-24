import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { company } from '@/content/site';

export const metadata: Metadata = {
  title: 'Security',
  description: 'How to report a security issue to Oxinov.',
};

export default function SecurityPage() {
  return (
    <>
      <PageHeader label="Security" title="Report a security issue">
        We welcome reports from security researchers and will respond in good faith.
      </PageHeader>
      <div className="prose-ox mx-auto max-w-6xl px-4 py-12">
        <p>
          If you find a vulnerability in an Oxinov website or product, please report it privately and give us
          reasonable time to fix it before sharing details. Do not access other people&apos;s data, disrupt services,
          or run automated scans that degrade them.
        </p>
        <p>
          {company.email
            ? `Send reports to ${company.email}.`
            : 'A dedicated security contact will be published here before our first product launches.'}
        </p>
      </div>
    </>
  );
}
