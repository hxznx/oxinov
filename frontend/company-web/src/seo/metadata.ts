// Page titles, descriptions, canonical URLs, and link previews (Next.js Metadata API).
import type { Metadata } from 'next';
import { defaultDescription, defaultTitle, locale, shareImage, siteName, siteUrl } from './config';

/** Defaults for every page, set once in the root layout. */
export const siteMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: defaultTitle, template: `%s · ${siteName}` },
  description: defaultDescription,
  applicationName: siteName,
  icons: { icon: '/brand/oxinov-symbol.svg', apple: '/icons/apple-touch-icon.png' },
  openGraph: { type: 'website', siteName, locale },
};

/**
 * Metadata for one page: title, description, canonical URL, and link-preview data. `title` is the
 * page name (the layout adds "· Oxinov"); pass `absoluteTitle` for the home page. Descriptions are
 * 50–160 characters and unique per page (tests/site.test.mjs checks both).
 */
export function pageMetadata(page: { path: string; title?: string; absoluteTitle?: string; description: string }): Metadata {
  const shareTitle = page.absoluteTitle ?? `${page.title} · ${siteName}`;
  return {
    title: page.absoluteTitle ? { absolute: page.absoluteTitle } : page.title,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      type: 'website',
      siteName,
      locale,
      url: page.path,
      title: shareTitle,
      description: page.description,
      images: [shareImage],
    },
    twitter: { card: 'summary_large_image', title: shareTitle, description: page.description, images: [shareImage.url] },
  };
}

/** For pages that must never appear in search results, such as the 404 page. */
export const noIndex: Metadata = { robots: { index: false, follow: true } };
