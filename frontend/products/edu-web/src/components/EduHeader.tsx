import Link from 'next/link';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

/** Oxinov Edu shell: product mark, current workspace, store and learning links, theme, account, and sign-in or sign-out. */
export function EduHeader({ signedIn, workspace, returnTo }: { signedIn: boolean; workspace?: { slug: string; name: string }; returnTo?: string }) {
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
        <nav aria-label="Main" className="flex items-center gap-4 font-studio font-semibold">
          <Link href="/" className="text-muted no-underline hover:text-brand">
            Store
          </Link>
          {signedIn ? (
            <Link href="/spaces" className="text-muted no-underline hover:text-brand">
              My learning
            </Link>
          ) : null}
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <ThemeToggle />
          {signedIn ? (
            <>
              <Link href="/account" className="btn btn-secondary text-sm">
                Account
              </Link>
              <form action="/auth/logout" method="post">
                <button type="submit" className="btn btn-secondary text-sm">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <a href={`/auth/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`} className="btn btn-primary text-sm">
              Sign in
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
