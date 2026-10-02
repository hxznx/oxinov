import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { EduHeader } from '@/components/EduHeader';
import { eduApi } from '@/lib/edu-api.ts';
import { isStudioRole, load, workspaceContext } from '@/lib/guard.ts';
import { SideNav, type SideNavGroup } from '@/components/SideNav';

type Props = { children: ReactNode; params: Promise<{ slug: string }> };

const ROLE: Record<string, string> = { OWNER: 'Owner', ADMIN: 'Administrator' };

/**
 * Oxinov Studio (ADR-028 point 12; design screens 7, 8 and 24): one place for the owner and administrators
 * to run the store, in the Windows Settings style. Only sections that work today are listed.
 */
export default async function StudioLayout({ children, params }: Props) {
  const { slug } = await params;
  const base = `/w/${slug}/studio`;
  const { token, workspace } = await workspaceContext(slug, base);
  if (!isStudioRole(workspace.role)) notFound();
  const waiting = await load(base, () => eduApi.reviewQueue(token, workspace.id, 'PENDING_REVIEW'));

  const groups: SideNavGroup[] = [
    { title: 'OVERVIEW', items: [{ href: base, label: 'Dashboard', glyph: '⌂', tone: '--ox-color-brand', exact: true }] },
    {
      title: 'CONTENT',
      items: [
        { href: `${base}/offerings`, label: 'Offerings and prices', glyph: '▦', tone: '--ox-color-brand' },
        { href: `/w/${slug}/teach`, label: 'Course builder', glyph: '✎', tone: '--ox-color-brand-mid' },
      ],
    },
    {
      title: 'BUSINESS',
      items: [
        { href: `${base}/payments`, label: 'Payments', glyph: '₹', tone: '--ox-color-success', badge: waiting.length, badgeLabel: 'waiting' },
        { href: `${base}/people`, label: 'Learners and join codes', glyph: '☺', tone: '--ox-color-product-services' },
        { href: `${base}/marketing`, label: 'Marketing', glyph: '⇪', tone: '--ox-color-brand2' },
      ],
    },
    { title: 'SYSTEM', items: [{ href: `${base}/settings`, label: 'Settings', glyph: '⚙', tone: '--ox-color-text-muted' }] },
  ];

  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <div className="studio-shell">
        <nav className="studio-side" aria-label="Studio">
          <span className="studio-side-title">OXINOV // STUDIO</span>
          <div className="studio-id">
            <span className="studio-id-mark" aria-hidden="true">
              OX
            </span>
            <span className="grid min-w-0">
              <span className="truncate font-studio font-bold">{workspace.name}</span>
              <span className="text-hud text-xs" style={{ color: 'var(--ox-color-product-hr)' }}>
                ROLE: {ROLE[workspace.role]?.toUpperCase()}
              </span>
            </span>
          </div>
          <SideNav groups={groups} />
          <Link href={`/w/${slug}`} className="studio-link mt-2">
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
