import { companyLinks } from '@/lib/company-links';

/** Every Edu page links back to its product page, the terms, privacy, and help on oxinov.com. */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-6 text-sm text-muted">
        <nav aria-label="Oxinov">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {companyLinks({ slug: 'edu', name: 'Oxinov Edu' }).map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-muted no-underline hover:text-brand">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="ml-auto">
          © {new Date().getFullYear()} <span translate="no">Oxinov</span> Pvt. Ltd.
        </p>
      </div>
    </footer>
  );
}
