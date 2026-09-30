import type { Metadata } from 'next';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { home, products, signInUrl, signUpUrl, statusLabel } from '@/content/site';
import { defaultDescription, defaultTitle, pageMetadata, productPath } from '@/seo';

export const metadata: Metadata = pageMetadata({ path: '/', absoluteTitle: defaultTitle, description: defaultDescription });

export default function HomePage() {
  // The product people can use today; the others show their status on the products page.
  const edu = products.find((product) => product.slug === 'edu' && product.status === 'in-development');
  const { account } = home;
  return (
    <>
      <section className="grid-bg scanlines border-b border-line">
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:py-24 lg:grid-cols-[1fr_22rem]">
          <div>
            <img src="/brand/oxinov-symbol-glow.svg" alt="" width={96} height={96} className="logo-dark mb-6" />
            <p className="hud-label">// Ox Inov Pvt. Ltd. · Lalitpur, Nepal</p>
            <h1 className="mt-3 max-w-4xl font-display text-4xl leading-tight sm:text-6xl">
              <span className="text-gradient">{home.headline}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted">{home.subheadline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={signUpUrl} className="btn btn-primary">
                {home.signUpCta}
              </a>
              <a href={signInUrl} className="btn btn-secondary">
                {home.signInCta}
              </a>
              <Link href="/products/" className="btn btn-secondary">
                {home.primaryCta}
              </Link>
            </div>
          </div>

          {/* The one account, shown as the list of products it opens (FR-ID-2207). */}
          <aside aria-labelledby="account-panel" className="card bg-raised">
            <p className="hud-label">// One account</p>
            <h2 id="account-panel" className="mt-2 text-2xl">
              Sign in once. Use every Oxinov product.
            </h2>
            <ul className="mt-5 space-y-3">
              {products.map((product) => (
                <li
                  key={product.key}
                  className="flex items-center justify-between gap-3 border-l-2 pl-3"
                  style={{ borderColor: `var(--ox-color-product-${product.key})` }}
                >
                  <span>
                    <span className="block font-semibold">{product.name}</span>
                    <span className="block font-mono text-xs text-muted">
                      {product.address}
                    </span>
                  </span>
                  <span className={`hud-label text-right ${product.status === 'in-development' ? 'text-success' : ''}`}>
                    {product.status === 'in-development' ? 'Open now' : statusLabel[product.status]}
                  </span>
                </li>
              ))}
            </ul>
            {edu ? (
              <a href={`https://${edu.address}/`} className="btn btn-secondary mt-6 w-full justify-center">
                {home.productCta}
              </a>
            ) : null}
          </aside>
        </div>
      </section>

      <section aria-labelledby="account" className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 id="account" className="text-3xl">
            {account.title}
          </h2>
          <p className="mt-3 max-w-2xl text-muted">{account.intro}</p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {account.steps.map((step, index) => (
              <li key={step.title} className="card">
                <p className="hud-label text-brand">Step {String(index + 1).padStart(2, '0')}</p>
                <h3 className="mt-2 text-xl">{step.title}</h3>
                <p className="mt-2 text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
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

      <section aria-labelledby="products" className="mx-auto max-w-6xl px-4 pb-14">
        <h2 id="products" className="text-3xl">
          Products
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {products.map((product) => (
            <li key={product.key} className="card" style={{ borderColor: `var(--ox-color-product-${product.key})` }}>
              <StatusBadge status={product.status} />
              <h3 className="mt-2 text-2xl" style={{ color: `var(--ox-color-product-${product.key})` }}>
                <Link href={productPath(product)}>{product.name}</Link>
              </h3>
              <p className="mt-1 text-muted">{product.purpose}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6">
          <Link href="/divisions/">{home.secondaryCta}</Link>
        </p>
      </section>

      <section aria-labelledby="start" className="grid-bg border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-14">
          <div>
            <h2 id="start" className="text-3xl">
              {account.closingTitle}
            </h2>
            <p className="mt-2 text-muted">{account.closingBody}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={signUpUrl} className="btn btn-primary">
              {home.signUpCta}
            </a>
            <a href={signInUrl} className="btn btn-secondary">
              {home.signInCta}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
