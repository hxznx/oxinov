import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { EduHeader } from '@/components/EduHeader';
import { SideNav, type SideNavGroup } from '@/components/SideNav';
import { initials } from '@/lib/account.ts';
import { eduApi } from '@/lib/edu-api.ts';
import { formatDate } from '@/lib/format.ts';
import { accountContext } from './data';

export const metadata: Metadata = { title: { default: 'Account', template: '%s · Account · Oxinov Edu' } };

/**
 * Learner account centre (FR-AUTH-104; design screens 10 and 12), in the same Windows Settings layout as
 * Oxinov Studio. Messages join the menu when that feature exists.
 */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const { me, token, workspace } = await accountContext('/account');
  // The unread count for the menu badge; a failure here never blocks the account centre.
  const unread = workspace ? await eduApi.myNotifications(token, workspace.id).then((result) => result.unread).catch(() => 0) : 0;
  const groups: SideNavGroup[] = [
    {
      title: 'MY LEARNING',
      items: [
        { href: '/account', label: 'My subscriptions', glyph: '▦', tone: '--ox-color-brand', exact: true },
        { href: '/account/notifications', label: 'Notifications', glyph: '✉', tone: '--ox-color-product-hr', badge: unread, badgeLabel: 'unread' },
        { href: '/account/payments', label: 'Payments and receipts', glyph: '₹', tone: '--ox-color-success' },
        { href: '/account/certificates', label: 'Certificates', glyph: '★', tone: '--ox-color-highlight' },
        { href: '/account/activity', label: 'Activity', glyph: '◷', tone: '--ox-color-product-services' },
      ],
    },
    { title: 'SHARE', items: [{ href: '/account/invite', label: 'Invite friends', glyph: '⇪', tone: '--ox-color-brand2' }] },
    { title: 'SETTINGS', items: [{ href: '/account/privacy', label: 'Profile and privacy', glyph: '⚙', tone: '--ox-color-text-muted' }] },
  ];

  return (
    <>
      <EduHeader signedIn returnTo="/account" />
      <div className="studio-shell">
        <nav className="studio-side" aria-label="Account">
          <span className="studio-side-title">OXINOV // ACCOUNT</span>
          <div className="studio-id">
            <span className="studio-id-mark" aria-hidden="true">
              {initials(me.displayName, me.email)}
            </span>
            <span className="grid min-w-0">
              <span className="truncate font-studio font-bold">{me.displayName ?? 'Oxinov learner'}</span>
              <span className="truncate text-xs text-muted">{me.email}</span>
              <span className="text-hud text-xs tone-success">MEMBER SINCE {formatDate(me.memberSince, 'Asia/Kathmandu').toUpperCase()}</span>
            </span>
          </div>
          <SideNav groups={groups} />
          <Link href="/" className="studio-link mt-2">
            <span className="studio-glyph" aria-hidden="true">
              ←
            </span>
            <span>Back to the store</span>
          </Link>
        </nav>
        <main id="main" className="studio-main">
          {children}
        </main>
      </div>
    </>
  );
}
