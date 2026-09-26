// Products: the list on /products/ and one application per product page. No offers or ratings until real
// prices and genuine reviews exist.
import { type Product, products } from '@/content/site';
import { divisionId, organizationId, siteUrl } from '../config';

export const productPath = (product: Product) => `/products/${product.slug}/`;

function application(product: Product) {
  return {
    '@type': 'SoftwareApplication',
    '@id': `${siteUrl}${productPath(product)}#product`,
    name: product.name,
    url: `${siteUrl}${productPath(product)}`,
    description: product.summary,
    applicationCategory: product.key === 'lms' ? 'EducationalApplication' : 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: 'en',
    publisher: { '@id': organizationId },
    provider: { '@id': divisionId(product.division) },
  };
}

export function productsSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Oxinov products',
    itemListElement: products.map((product, index) => ({ '@type': 'ListItem', position: index + 1, item: application(product) })),
  };
}

/** One product in full, on its own page. */
export function productSchema(product: Product) {
  return {
    '@context': 'https://schema.org',
    ...application(product),
    featureList: product.features.map((feature) => feature.title),
    audience: { '@type': 'Audience', audienceType: product.audience.join(', ') },
    // Only a product people can use today links to its app.
    ...(product.status === 'in-development' ? { sameAs: `https://${product.address}/` } : {}),
  };
}
