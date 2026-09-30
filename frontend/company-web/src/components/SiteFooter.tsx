import Link from 'next/link';
import { company, legalDocs } from '@/content/site';

// Fixed at build time so the static export is reproducible for a given year.
const year = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm sm:grid-cols-2">
        <div>
          <p className="font-display tracking-widest text-ink">OXINOV</p>
          <p className="mt-2 text-muted">
            © {year} {company.legalName} Registered in {company.locality}.
            {company.registrationNumber ? ` Company registration no. ${company.registrationNumber}.` : ''}
          </p>
        </div>
        <nav aria-label="Legal">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legalDocs.map((doc) => (
              <li key={doc.slug}>
                <Link href={`/legal/${doc.slug}/`}>{doc.title}</Link>
              </li>
            ))}
            <li>
              <Link href="/security/">Security</Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
