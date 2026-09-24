import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { company } from '@/content/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact Oxinov Pvt. Ltd. in Lalitpur, Nepal.',
};

const toBeAnnounced = 'To be announced';

type Row = { label: string; value: string; email?: boolean };

export default function ContactPage() {
  const emailRow = (label: string, address: string | null): Row =>
    address ? { label, value: address, email: true } : { label, value: toBeAnnounced };
  const rows: Row[] = [
    emailRow('General enquiries and support', company.email),
    emailRow('Billing and subscriptions', company.billingEmail),
    emailRow('Legal and privacy', company.legalEmail),
    emailRow('Security reports', company.securityEmail),
    { label: 'Phone', value: company.phone ?? toBeAnnounced },
    { label: 'Address', value: company.streetAddress ? `${company.streetAddress}, ${company.locality}` : company.locality },
    { label: 'Office hours', value: company.officeHours ?? toBeAnnounced },
  ];
  return (
    <>
      <PageHeader label="Contact" title="Get in touch">
        We would like to hear from you. Tell us who you are and how we can help.
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <dl className="card grid max-w-2xl gap-x-6 gap-y-3 sm:grid-cols-[14rem_1fr]">
          {rows.map(({ label, value, email }) => (
            <div key={label} className="contents">
              <dt className="hud-label pt-1">{label}</dt>
              <dd>{email ? <a href={`mailto:${value}`}>{value}</a> : value}</dd>
            </div>
          ))}
        </dl>
        {/* FR-SITE-2104: the contact form needs a rate-limited backend endpoint; it arrives with api.oxinov.com. */}
        <p className="hud-label mt-6">// An online contact form opens with our first product launch</p>
      </div>
    </>
  );
}
