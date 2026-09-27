import Link from 'next/link';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

const accountUrl = () => process.env.ACCOUNT_URL?.replace(/\/$/, '') ?? 'https://app.oxinov.com';

/** Oxinov Edu shell: product mark, current workspace, theme, account link, and sign-out. */
export function EduHeader({ signedIn, workspace }: { signedIn: boolean; workspace?: { slug: string; name: string } }) {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 no-underline" aria-label="Oxinov Edu home">
          <Logo size={30} />
          <span className="font-display tracking-widest text-ink">OXINOV</span>
          <span className="hud-label" style={{ color: 'var(--ox-color-product-edu)' }}>
            // Edu
          </span>
        </Link>
        {workspace ? (
          <Link href={`/w/${workspace.slug}`} className="text-sm text-muted no-underline hover:text-brand">
            / {workspace.name}
          </Link>
        ) : null}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <ThemeToggle />
          {signedIn ? (
            <>
              <a href={accountUrl()} className="btn btn-secondary text-sm">
                Account
              </a>
              <form action="/auth/logout" method="post">
                <button type="submit" className="btn btn-secondary text-sm">
                  Sign out
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
