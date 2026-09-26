// Search and sharing metadata for oxinov.com (docs/marketing/SEO.md, ADR-020: one English site).
import type { Metadata } from 'next';
import { company, divisions, legalDocs, products } from '@/content/site';

export const siteUrl = 'https://oxinov.com';

/** Every public route, with trailing slashes as exported (sitemap, tests, and breadcrumbs use it). */
export const publicRoutes: string[] = [
  '/',
  '/about/',
  '/products/',
  '/divisions/',
  '/pricing/',
  '/careers/',
  '/contact/',
  '/security/',
  '/legal/',
  ...legalDocs.map((doc) => `/legal/${doc.slug}/`),
  ...divisions.map((division) => `/${division.slug}/`),
];

const shareImage = {
  url: '/og/oxinov.png',
  width: 1200,
  height: 630,
  alt: 'Oxinov logo and name on a dark grid background',
};

/**
 * Metadata for one page: title, description, canonical URL, and link-preview data. `title` is the
 * page name (the layout adds "· Oxinov"); pass `absoluteTitle` for the home page.
 */
export function pageMetadata(page: { path: string; title?: string; absoluteTitle?: string; description: string }): Metadata {
  const shareTitle = page.absoluteTitle ?? `${page.title} · Oxinov`;
  return {
    title: page.absoluteTitle ? { absolute: page.absoluteTitle } : page.title,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      type: 'website',
      siteName: 'Oxinov',
      locale: 'en_US',
      url: page.path,
      title: shareTitle,
      description: page.description,
      images: [shareImage],
    },
    twitter: { card: 'summary_large_image', title: shareTitle, description: page.description, images: [shareImage.url] },
  };
}

// --- Structured data (schema.org JSON-LD) ------------------------------------------------------------

const organizationId = `${siteUrl}/#organization`;

/** The company, on every page. Contact details come from src/content/site.ts only. */
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
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: company.name,
    inLanguage: 'en',
    publisher: { '@id': organizationId },
  };
}

/** The headquarters office, on the contact page. */
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

/** Products, on the products page. No offers or ratings until real prices and reviews exist. */
export function productsSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Oxinov products',
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: product.name,
        url: `https://${product.address}`,
        description: product.purpose,
        applicationCategory: product.key === 'lms' ? 'EducationalApplication' : 'BusinessApplication',
        operatingSystem: 'Web',
        publisher: { '@id': organizationId },
      },
    })),
  };
}

/** Breadcrumbs for nested pages, from the home page down to this one. */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...trail].map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${siteUrl}${crumb.path}`,
    })),
  };
}

function headquarters() {
  // "Mahalaxmi Municipality, Ward 8, Lalitpur, Nepal" → street, locality, country.
  const parts = company.locality.split(',').map((part) => part.trim());
  return {
    '@type': 'PostalAddress',
    streetAddress: parts.slice(0, -2).join(', '),
    addressLocality: parts.at(-2),
    addressCountry: 'NP',
  };
}
