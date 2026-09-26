import { company } from '@/content/site';

/** The headquarters address: "Mahalaxmi Municipality, Ward 8, Lalitpur, Nepal" → street, locality, country. */
export function headquarters() {
  const parts = company.locality.split(',').map((part) => part.trim());
  return {
    '@type': 'PostalAddress',
    streetAddress: parts.slice(0, -2).join(', '),
    addressLocality: parts.at(-2),
    addressCountry: 'NP',
  };
}
