import type { Metadata } from 'next';
import { JsonLd, officeSchema, pageMetadata } from '@/seo';
import { PageHeader } from '@/components/PageHeader';
import { company } from '@/content/site';

export const metadata: Metadata = pageMetadata({
  path: '/contact/',
  title: 'Contact',
  description:
    'Contact Ox Inov Pvt. Ltd. by email or phone. Support, billing, legal, and security contacts for customers and partners in every country.',
});

const toBeAnnounced = 'To be announced';

type Row = { label: string; value: string; href?: string };

export default function ContactPage() {
  const emailRow = (label: string, address: string | null): Row =>
    address ? { label, value: address, href: `mailto:${address}` } : { label, value: toBeAnnounced };
  const rows: Row[] = [
    emailRow('General enquiries and support', company.email),
    emailRow('Billing and subscriptions', company.billingEmail),
    emailRow('Legal and privacy', company.legalEmail),
    emailRow('Security reports', company.securityEmail),
    company.phone
      ? { label: 'Phone and WeChat', value: company.phoneDisplay, href: `tel:${company.phone}` }
      : { label: 'Phone', value: toBeAnnounced },
    ...(company.phone
      ? [{ label: 'WhatsApp', value: company.phoneDisplay, href: `https://wa.me/${company.phone.replace(/\D/g, '')}` }]
      : []),
    { label: 'Office', value: company.streetAddress ? `${company.streetAddress}, ${company.locality}` : company.locality },
    { label: 'Office hours', value: company.officeHours ?? toBeAnnounced },
  ];
  return (
    <>
      <JsonLd data={officeSchema()} />
      <PageHeader label="Contact" title="Get in touch">
        We would like to hear from you. Tell us who you are and how we can help.
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <dl className="card grid max-w-2xl gap-x-6 gap-y-3 sm:grid-cols-[14rem_1fr]">
          {rows.map(({ label, value, href }) => (
            <div key={label} className="contents">
              <dt className="hud-label pt-1">{label}</dt>
              <dd>
                {href ? (
                  <a href={href} {...(href.startsWith('https:') ? { rel: 'noopener noreferrer', target: '_blank' } : {})}>
                    {value}
                  </a>
                ) : (
                  value
                )}
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
