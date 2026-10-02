import type { Metadata } from 'next';
import Link from 'next/link';
import { accountContext } from '../data';
import { DeleteRequest } from './DeleteRequest';

export const metadata: Metadata = { title: 'Profile and privacy' };

/**
 * Profile and privacy (FR-AUTH-104): who you are signed in as, sign-out on this device and everywhere
 * (FR-ID-2208, on the Oxinov sign-in account page), your learning spaces, and requests for a copy of your
 * data (FR-PRIV-3201) or deletion (FR-PRIV-3202), which Oxinov support carries out across every product.
 */
export default async function PrivacyPage() {
  const { me } = await accountContext('/account/privacy');
  const issuer = process.env.OIDC_ISSUER?.replace(/\/$/, '') ?? 'https://id.oxinov.com/realms/oxinov';
  const accountPage = `${issuer}/account/`;
  const support = process.env.SUPPORT_EMAIL?.trim() || 'support@oxinov.com';
  const email = me.email ?? '';
  const exportHref = `mailto:${support}?subject=${encodeURIComponent('Copy of my Oxinov data')}&body=${encodeURIComponent(`Please send me a copy of my Oxinov data.\n\nAccount email: ${email}`)}`;

  const rows = [
    {
      glyph: '☺',
      title: 'Name and email',
      sub: `${me.displayName ?? 'No name yet'} · ${email || 'No email'}. Change them on your Oxinov sign-in account page.`,
      action: (
        <a href={accountPage} className="btn btn-secondary text-sm" rel="noreferrer">
          Open account page
        </a>
      ),
    },
    {
      glyph: '⏻',
      title: 'Sign out of this device',
      sub: 'You stay signed in on your other phones and computers.',
      action: (
        <form action="/auth/logout" method="post">
          <button type="submit" className="btn btn-secondary text-sm">
            Sign out
          </button>
        </form>
      ),
    },
    {
      glyph: '⛨',
      title: 'Sign out of all devices',
      sub: 'See where you are signed in and sign out everywhere, under "Device activity" on your account page. Use it if you lost a phone or see a sign-in you do not recognise.',
      action: (
        <a href={accountPage} className="btn btn-secondary text-sm" rel="noreferrer">
          Manage devices
        </a>
      ),
    },
    {
      glyph: '▦',
      title: 'My learning spaces',
      sub: 'The Oxinov store and any school or training centre you joined with a code.',
      action: (
        <Link href="/spaces" className="btn btn-secondary text-sm">
          Open
        </Link>
      ),
    },
    {
      glyph: '⤓',
      title: 'Get a copy of my data',
      sub: `Ask Oxinov support for your profile, learning progress, payments, and certificates. We reply from ${support}.`,
      action: (
        <a href={exportHref} className="btn btn-secondary text-sm">
          Ask for a copy
        </a>
      ),
    },
  ];

  return (
    <>
      <div className="grid gap-1">
        <span className="studio-kicker">// Settings</span>
        <h1 className="studio-title">
          <span className="crumb">Account ›</span> Profile and privacy
        </h1>
      </div>
      <ul className="grid gap-3">
        {rows.map((row) => (
          <li key={row.title} className="studio-panel grid grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-3 p-4 sm:grid-cols-[2.25rem_minmax(0,1fr)_auto]">
            <span className="studio-icon tone-brand" aria-hidden="true">
              {row.glyph}
            </span>
            <span className="grid gap-0.5">
              <span className="font-semibold">{row.title}</span>
              <span className="studio-sub">{row.sub}</span>
            </span>
            <span className="col-start-2 sm:col-start-auto">{row.action}</span>
          </li>
        ))}
      </ul>
      <DeleteRequest email={email} support={support} />
    </>
  );
}
