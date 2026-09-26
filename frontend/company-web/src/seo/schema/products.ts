// Products, on the products page. No offers or ratings until real prices and genuine reviews exist.
import { products } from '@/content/site';
import { organizationId } from '../config';

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
