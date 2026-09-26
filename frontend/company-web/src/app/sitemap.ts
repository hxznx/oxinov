import type { MetadataRoute } from 'next';
import { siteUrl, sitemapEntries } from '@/seo';

// Generated once at build time for the static export; lists every public page (src/seo/routes.ts).
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const built = new Date();
  return sitemapEntries.map(({ path, changeFrequency, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified: built,
    changeFrequency,
    priority,
  }));
}
