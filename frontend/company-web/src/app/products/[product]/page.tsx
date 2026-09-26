import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Faq } from '@/components/Faq';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { divisions, products } from '@/content/site';
import { JsonLd, breadcrumbSchema, pageMetadata, productPath, productSchema } from '@/seo';

// Product pages live at oxinov.com/products/<slug>/; the product itself runs at its own address.
export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((product) => ({ product: product.slug }));
}

type Props = { params: Promise<{ product: string }> };

const find = (slug: string) => products.find((item) => item.slug === slug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = find((await params).product);
  return product ? pageMetadata({ path: productPath(product), absoluteTitle: product.searchTitle, description: product.summary }) : {};
}

export default async function ProductPage({ params }: Props) {
  const product = find((await params).product);
  if (!product) notFound();
  const division = divisions.find((item) => item.slug === product.division);
  const available = product.status === 'in-development';
  const others = products.filter((item) => item.key !== product.key);
  return (
    <>
      <JsonLd data={productSchema(product)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Products', path: '/products/' },
          { name: product.name, path: productPath(product) },
        ])}
      />
      <PageHeader label="Product" title={product.name}>
        {product.purpose}
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <StatusBadge status={product.status} />
        <p className="mt-4 max-w-3xl text-lg">{product.description}</p>
        {available ? (
          <p className="mt-6 flex flex-wrap gap-3">
            <a href={`https://${product.address}/`} className="btn btn-primary">
              Open {product.name}
            </a>
            <Link href="/pricing/" className="btn btn-secondary">
              See pricing
            </Link>
          </p>
        ) : (
          <p className="mt-4 max-w-3xl text-muted">
            {product.name} is not open yet. It will run at {product.address} and work with your Oxinov account.
          </p>
        )}

        <h2 className="mt-12 text-2xl">{available ? 'What you can do' : 'What we plan to build'}</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {product.features.map((feature) => (
            <li key={feature.title} className="card">
              <h3 className="text-xl">{feature.title}</h3>
              <p className="mt-2 text-muted">{feature.body}</p>
            </li>
          ))}
        </ul>

        <h2 className="mt-12 text-2xl">Who it is for</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {product.audience.map((group) => (
            <li key={group} className="card">
              {group}
            </li>
          ))}
        </ul>

        <Faq questions={product.faqs} />

        <h2 className="mt-12 text-2xl">More from Oxinov</h2>
        <ul className="mt-4 grid gap-2">
          {division ? (
            <li>
              Built by <Link href={`/${division.slug}/`}>{division.name}</Link>
            </li>
          ) : null}
          {others.map((item) => (
            <li key={item.key}>
              <Link href={productPath(item)}>{item.name}</Link>: {item.purpose}
            </li>
          ))}
          <li>
            <Link href="/products/">All products</Link>
          </li>
        </ul>
      </div>
    </>
  );
}
