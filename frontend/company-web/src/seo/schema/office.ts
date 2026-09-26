// The headquarters office, on the contact page (local search; matches the Google Business Profile).
import { company } from '@/content/site';
import { organizationId, siteUrl } from '../config';
import { headquarters } from './address';

export function officeSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${siteUrl}/contact/#office`,
    name: company.legalName,
    url: `${siteUrl}/contact/`,
    image: `${siteUrl}/icons/icon-512.png`,
    parentOrganization: { '@id': organizationId },
    address: headquarters(),
    ...(company.phone ? { telephone: company.phone } : {}),
    ...(company.email ? { email: company.email } : {}),
    ...(company.officeHours === '24/7'
      ? {
          openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            opens: '00:00',
            closes: '23:59',
          },
        }
      : {}),
  };
}
