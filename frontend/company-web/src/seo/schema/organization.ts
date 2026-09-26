// The company and the website, on every page (root layout). Contact details come from src/content/site.ts only.
import { company } from '@/content/site';
import { organizationId, shareImage, siteUrl, socialProfiles, websiteId } from '../config';
import { headquarters } from './address';

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': organizationId,
    name: company.name,
    legalName: company.legalName,
    url: siteUrl,
    logo: `${siteUrl}/icons/icon-512.png`,
    image: `${siteUrl}${shareImage.url}`,
    address: headquarters(),
    ...(socialProfiles.length ? { sameAs: socialProfiles } : {}),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: 'English',
      areaServed: 'Worldwide',
      ...(company.email ? { email: company.email } : {}),
      ...(company.phone ? { telephone: company.phone } : {}),
    },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId,
    url: siteUrl,
    name: company.name,
    inLanguage: 'en',
    publisher: { '@id': organizationId },
  };
}
