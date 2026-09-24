import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { products } from '@/content/site';

export const metadata: Metadata = {
  title: 'Products',
  description:
    'Oxinov Edu is in development; Oxinov Commodity Market, Oxinov Jobs, and Oxinov Services Market are coming soon.',
};

export default function ProductsPage() {
  return (
    <>
      <PageHeader label="Products" title="Our products">
        One Oxinov account will work across every product as it launches.
      </PageHeader>
      <ul className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:grid-cols-2">
        {products.map((product) => (
          <li key={product.key} className="card" style={{ borderColor: `var(--ox-color-product-${product.key})` }}>
            <StatusBadge status={product.status} />
            <h2 className="mt-2 text-2xl" style={{ color: `var(--ox-color-product-${product.key})` }}>
              {product.name}
            </h2>
            <p className="hud-label mt-1">{product.address}</p>
            <p className="mt-3 font-semibold">{product.purpose}</p>
            <p className="mt-2 text-muted">{product.description}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
