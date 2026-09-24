import Link from 'next/link';
import type { Product } from '@/lib/platform-api.ts';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

const productUrl = (address: string) => `https://${address}`;

/** Shared Oxinov shell for app.oxinov.com: logo, app launcher, theme, and account actions (FR-PORTAL-3102). */
export function AccountHeader({ products = [], signedIn }: { products?: Product[]; signedIn: boolean }) {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 no-underline" aria-label="Oxinov account home">
          <Logo size={30} />
          <span className="font-display tracking-widest text-ink">OXINOV</span>
          <span className="hud-label">// Account</span>
        </Link>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {signedIn && products.length > 0 ? (
            <details className="relative">
              <summary className="btn btn-secondary cursor-pointer text-sm">Apps</summary>
              <ul className="card absolute right-0 z-20 mt-2 grid w-64 gap-2" aria-label="Oxinov apps">
                {products.map((product) => (
                  <li key={product.key}>
                    <a href={productUrl(product.address)} className="block no-underline hover:text-brand">
                      <span style={{ color: `var(--ox-color-product-${product.key})` }}>{product.name}</span>
                      <span className="hud-label block">{product.address}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          <ThemeToggle />
          {signedIn ? (
            <form action="/auth/logout" method="post">
              <button type="submit" className="btn btn-secondary text-sm">
                Sign out
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </header>
  );
}
