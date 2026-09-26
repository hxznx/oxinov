import type { Metadata } from 'next';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { home, products } from '@/content/site';
import { defaultDescription, defaultTitle, pageMetadata } from '@/seo';

export const metadata: Metadata = pageMetadata({ path: '/', absoluteTitle: defaultTitle, description: defaultDescription });

export default function HomePage() {
  return (
    <>
      <section className="grid-bg scanlines border-b border-line">
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <img src="/brand/oxinov-symbol-glow.svg" alt="" width={96} height={96} className="logo-dark mb-6" />
          <p className="hud-label">// Oxinov Pvt. Ltd. · Lalitpur, Nepal</p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl leading-tight sm:text-6xl">
            <span className="text-gradient">{home.headline}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted">{home.subheadline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/products/" className="btn btn-primary">
              {home.primaryCta}
            </Link>
            <Link href="/divisions/" className="btn btn-secondary">
              {home.secondaryCta}
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="values" className="mx-auto max-w-6xl px-4 py-14">
        <h2 id="values" className="text-3xl">
          What you can expect
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {home.values.map((value) => (
            <li key={value.title} className="card">
              <h3 className="text-xl">{value.title}</h3>
              <p className="mt-2 text-muted">{value.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="products" className="mx-auto max-w-6xl px-4 pb-6">
        <h2 id="products" className="text-3xl">
          Products
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {products.map((product) => (
            <li key={product.key} className="card" style={{ borderColor: `var(--ox-color-product-${product.key})` }}>
              <StatusBadge status={product.status} />
              <h3 className="mt-2 text-2xl" style={{ color: `var(--ox-color-product-${product.key})` }}>
                {product.name}
              </h3>
              <p className="mt-1 text-muted">{product.purpose}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
