// Divisions (departments) of the company: the list on /divisions/ and one department per division page.
import { type Division, divisions } from '@/content/site';
import { divisionId, organizationId, siteUrl } from '../config';

const divisionUrl = (division: Division) => `${siteUrl}/${division.slug}/`;

export function divisionsSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Oxinov divisions',
    itemListElement: divisions.map((division, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: division.name,
      url: divisionUrl(division),
    })),
  };
}

/** A division as a department of Oxinov. Its products name it as their provider (schema/products.ts). */
export function divisionSchema(division: Division) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': divisionId(division.slug),
    name: division.name,
    url: divisionUrl(division),
    description: division.description,
    slogan: division.tagline,
    parentOrganization: { '@id': organizationId },
    knowsAbout: division.focus,
  };
}
