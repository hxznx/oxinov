import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { company } from '@/content/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact Oxinov Pvt. Ltd. in Lalitpur, Nepal.',
};

const toBeAnnounced = 'To be announced';

export default function ContactPage() {
  const rows: [string, string][] = [
    ['General enquiries', company.email ?? toBeAnnounced],
    ['Phone', company.phone ?? toBeAnnounced],
    ['Address', company.streetAddress ? `${company.streetAddress}, ${company.locality}` : company.locality],
    ['Office hours', company.officeHours ?? toBeAnnounced],
  ];
  return (
    <>
      <PageHeader label="Contact" title="Get in touch">
        We would like to hear from you. Tell us who you are and how we can help.
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <dl className="card grid max-w-2xl gap-x-6 gap-y-3 sm:grid-cols-[12rem_1fr]">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="hud-label pt-1">{label}</dt>
              <dd>
                {label === 'General enquiries' && company.email ? <a href={`mailto:${company.email}`}>{value}</a> : value}
              </dd>
            </div>
          ))}
        </dl>
        {/* FR-SITE-2104: the contact form needs a rate-limited backend endpoint; it arrives with api.oxinov.com. */}
        <p className="hud-label mt-6">// An online contact form opens with our first product launch</p>
      </div>
    </>
  );
}
