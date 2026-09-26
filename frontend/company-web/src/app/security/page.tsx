import type { Metadata } from 'next';
import { pageMetadata } from '@/seo';
import { PageHeader } from '@/components/PageHeader';
import { company } from '@/content/site';

export const metadata: Metadata = pageMetadata({
  path: '/security/',
  title: 'Security',
  description:
    'How to report a security issue in an Oxinov product or website: where to send it, what to include, and how quickly we respond.',
});

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
        {company.securityEmail ? (
          <>
            <p>
              Send reports to <a href={`mailto:${company.securityEmail}`}>{company.securityEmail}</a>. Include the
              affected address, the steps to reproduce the issue, and its impact. We aim to acknowledge reports
              within three working days.
            </p>
            <p>
              Our contact details are also published in machine-readable form at{' '}
              <a href="/.well-known/security.txt">/.well-known/security.txt</a>.
            </p>
          </>
        ) : (
          <p>A dedicated security contact will be published here before our first product launches.</p>
        )}
      </div>
    </>
  );
}
