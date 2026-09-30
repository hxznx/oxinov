import Link from 'next/link';
import { signInUrl, signUpUrl } from '@/content/site';
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
        <div className="ml-auto flex flex-wrap items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {/* One Oxinov account for every product (FR-ID-2202, FR-ID-2207): the portal starts sign-in at id.oxinov.com. */}
          <a href={signInUrl} className="btn btn-secondary whitespace-nowrap px-3 text-sm sm:px-5">
            Sign in
          </a>
          <a href={signUpUrl} className="btn btn-primary whitespace-nowrap px-3 text-sm sm:px-5">
            Create account
          </a>
        </div>
      </div>
    </header>
  );
}
