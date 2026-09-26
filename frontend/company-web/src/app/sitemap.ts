import type { MetadataRoute } from 'next';
import { publicRoutes, siteUrl } from '@/lib/seo';

// Generated once at build time for the static export; lists every public page.
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const built = new Date();
  return publicRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: built,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path.startsWith('/legal/') ? 0.3 : 0.7,
  }));
}
