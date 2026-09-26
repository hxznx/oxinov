import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd, pageMetadata, productPath, productsSchema } from '@/seo';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { products } from '@/content/site';

export const metadata: Metadata = pageMetadata({
  path: '/products/',
  title: 'Products',
  description:
    'Oxinov Edu, the online classroom for schools and teachers, is in development. Oxinov Commodity Market, Jobs, and Services Market are coming soon.',
});

export default function ProductsPage() {
  return (
    <>
      <JsonLd data={productsSchema()} />
      <PageHeader label="Products" title="Our products">
        One Oxinov account will work across every product as it launches.
      </PageHeader>
      <ul className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:grid-cols-2">
        {products.map((product) => (
          <li key={product.key} className="card" style={{ borderColor: `var(--ox-color-product-${product.key})` }}>
            <StatusBadge status={product.status} />
            <h2 className="mt-2 text-2xl" style={{ color: `var(--ox-color-product-${product.key})` }}>
              <Link href={productPath(product)}>{product.name}</Link>
            </h2>
            <p className="hud-label mt-1">{product.address}</p>
            <p className="mt-3 font-semibold">{product.purpose}</p>
            <p className="mt-2 text-muted">{product.description}</p>
            <p className="mt-4">
              <Link href={productPath(product)}>More about {product.name}</Link>
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
