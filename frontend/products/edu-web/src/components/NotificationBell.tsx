import Link from 'next/link';
import { cache } from 'react';
import { auth } from '@/lib/auth.ts';
import { eduApi } from '@/lib/edu-api.ts';

/** One unread lookup per request, however many components ask. */
const unreadCount = cache(async (): Promise<number> => {
  const session = await auth.currentSession('/');
  if (!session) return 0;
  return eduApi
    .me(session.accessToken)
    .then((me) => me.unreadNotifications)
    .catch(() => 0);
});

/**
 * Header bell (FR-COMM-704): the unread count across every workspace, linking to Account › Notifications.
 * A failed lookup shows the bell without a number; it never breaks the page.
 */
export async function NotificationBell() {
  const unread = await unreadCount();
  const label = unread > 0 ? `Notifications, ${unread} unread` : 'Notifications';
  return (
    <Link href="/account/notifications" aria-label={label} className="btn btn-secondary relative px-3 text-sm">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </svg>
      {unread > 0 ? (
        <span aria-hidden="true" className="studio-badge absolute -right-1.5 -top-1.5 ml-0">
          {unread > 99 ? '99+' : unread}
        </span>
      ) : null}
    </Link>
  );
}
