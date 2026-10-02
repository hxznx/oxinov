'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface SideNavItem {
  href: string;
  label: string;
  glyph: string;
  /** A design-system color variable for the glyph, for example `--ox-color-success`. */
  tone: string;
  badge?: number;
  /** Dashboard matches its own address only; the others also light up for the pages under them. */
  exact?: boolean;
}

export interface SideNavGroup {
  title: string;
  items: SideNavItem[];
}

/** Windows Settings sidebar for Studio and the account centre; the current section carries the lit bar. */
export function SideNav({ groups }: { groups: SideNavGroup[] }) {
  const pathname = usePathname();
  const current = (item: SideNavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));
  return (
    <>
      {groups.map((group) => (
        <div key={group.title} className="contents">
          <span className="studio-group">{group.title}</span>
          {group.items.map((item) => (
            <Link key={item.href} href={item.href} className="studio-link" aria-current={current(item) ? 'page' : undefined}>
              <span className="studio-glyph" aria-hidden="true" style={{ color: `var(${item.tone})` }}>
                {item.glyph}
              </span>
              <span>{item.label}</span>
              {item.badge ? (
                <span className="studio-badge">
                  {item.badge}
                  <span className="sr-only"> waiting</span>
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      ))}
    </>
  );
}
