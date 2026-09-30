// Every public page and how often search engines should revisit it (sitemap.xml, tests, breadcrumbs).
import type { MetadataRoute } from 'next';
import { divisions, legalDocs, products } from '@/content/site';

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
type SitemapEntry = { path: string; priority: number; changeFrequency: ChangeFrequency };

const page = (path: string, priority: number, changeFrequency: ChangeFrequency = 'monthly'): SitemapEntry => ({
  path,
  priority,
  changeFrequency,
});

/** Paths end with a slash, as the static export writes them. Add new public pages here. */
export const sitemapEntries: SitemapEntry[] = [
  page('/', 1, 'weekly'),
  page('/products/', 0.9, 'weekly'),
  // The product people can use today ranks above the planned ones.
  ...products.map((product) => page(`/products/${product.slug}/`, product.status === 'in-development' ? 0.9 : 0.7, 'weekly')),
  page('/pricing/', 0.8),
  page('/about/', 0.7),
  page('/divisions/', 0.7),
  page('/careers/', 0.6),
  page('/contact/', 0.6),
  page('/security/', 0.5),
  page('/help/sign-in/', 0.4),
  page('/legal/', 0.3),
  ...legalDocs.map((doc) => page(`/legal/${doc.slug}/`, 0.3, 'yearly')),
  ...divisions.map((division) => page(`/${division.slug}/`, 0.6)),
];

export const publicRoutes: string[] = sitemapEntries.map((entry) => entry.path);
