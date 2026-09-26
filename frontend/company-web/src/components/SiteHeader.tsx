import Link from 'next/link';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

export const navigation = [
  { href: '/products/', label: 'Products' },
  { href: '/divisions/', label: 'Divisions' },
  { href: '/pricing/', label: 'Pricing' },
  { href: '/about/', label: 'About' },
  { href: '/careers/', label: 'Careers' },
  { href: '/contact/', label: 'Contact' },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 no-underline" aria-label="Oxinov home">
          <Logo size={32} />
          <span className="font-display text-lg tracking-widest text-ink" translate="no">
            OXINOV
          </span>
        </Link>
        <nav aria-label="Main" className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-ink no-underline hover:text-brand">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          {/* One Oxinov account arrives with id.oxinov.com in Phase 2 (FR-ID-2201). */}
          <span className="btn btn-secondary text-sm text-muted" aria-disabled="true" title="Sign-in opens with the first product launch">
            Sign in · soon
          </span>
        </div>
      </div>
    </header>
  );
}
