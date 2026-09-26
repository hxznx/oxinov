// Site-wide search and sharing settings for oxinov.com (docs/marketing/seo/README.md, ADR-020: one English site).
// Change titles, the share image, or social profiles here; pages and schemas read them from this file.

export const siteUrl = 'https://oxinov.com';
export const siteName = 'Oxinov';
export const locale = 'en_US';

/** Home page and fallback title. Replace with the approved tagline (docs/design/BRAND.md, brand strategy). */
export const defaultTitle = 'Oxinov — Software, services, and research';
export const defaultDescription =
  'Oxinov builds software, services, and research for people everywhere. Our first product, Oxinov Edu, is an online classroom for schools and teachers.';

/** Link-preview image for every page, rendered by scripts/generate-images.sh. */
export const shareImage = {
  url: '/og/oxinov.png',
  width: 1200,
  height: 630,
  alt: 'Oxinov logo and name on a dark grid background',
};

/**
 * Official company profiles (full https URLs), published as `sameAs` so search engines connect them to
 * Oxinov. Add a profile only after it exists and the owner controls it.
 */
export const socialProfiles: string[] = [];

export const organizationId = `${siteUrl}/#organization`;
export const websiteId = `${siteUrl}/#website`;
