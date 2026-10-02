import type { Metadata } from 'next';
import { openNotification, readAllNotifications } from '@/app/notification-actions';
import { eduApi } from '@/lib/edu-api.ts';
import { load } from '@/lib/guard.ts';
import { NOTIFICATION_STYLE, safeLinkPath, whenLabel } from '@/lib/notifications.ts';
import { accountContext } from '../data';

export const metadata: Metadata = { title: 'Notifications' };

/** In-app notifications, newest first (FR-COMM-704; design screen 10, "Notifications"). */
export default async function NotificationsPage() {
  const here = '/account/notifications';
  const { token, workspace } = await accountContext(here);
  const { items, unread } = workspace ? await load(here, () => eduApi.myNotifications(token, workspace.id)) : { items: [], unread: 0 };

  return (
    <>
      <div className="flex flex-wrap items-end gap-4">
        <div className="grid gap-1">
          <span className="studio-kicker">// My learning</span>
          <h1 className="studio-title">
            <span className="crumb">Account ›</span> Notifications
          </h1>
          <p className="text-sm text-muted">Payments, plans ending, and notices from Oxinov. Payment and renewal notices also come by email.</p>
        </div>
        <span className="flex-1" />
        {workspace && unread > 0 ? (
          <form action={readAllNotifications}>
            <input type="hidden" name="tenantId" value={workspace.id} />
            <button type="submit" className="btn btn-secondary text-sm">
              Mark all as read
            </button>
          </form>
        ) : null}
      </div>

      {items.length === 0 || !workspace ? (
        <p className="studio-panel px-5 py-4 text-muted">You&apos;re all caught up. New notices appear here.</p>
      ) : (
        <ul className="studio-panel">
          {items.map((item) => {
            const style = NOTIFICATION_STYLE[item.kind];
            const link = safeLinkPath(item.linkPath);
            return (
              <li key={item.id} className="grid grid-cols-[0.5rem_2.25rem_minmax(0,1fr)_auto] items-start gap-3 border-b border-line px-4 py-3 last:border-b-0">
                <span
                  aria-hidden="true"
                  className="mt-3 h-2 w-2"
                  style={{ background: item.readAt ? 'transparent' : 'var(--ox-color-brand)', boxShadow: item.readAt ? 'none' : 'var(--ox-glow-brand)' }}
                />
                <span className="studio-icon" aria-hidden="true" style={{ color: `var(${style.tone})` }}>
                  {style.glyph}
                </span>
                <span className="grid gap-0.5">
                  <span className="studio-status" style={{ color: `var(${style.tone})` }}>
                    {style.label}
                    {item.readAt ? '' : ' · new'}
                  </span>
                  <span className={item.readAt ? 'font-medium' : 'font-semibold'}>{item.title}</span>
                  {item.body ? <span className="studio-sub">{item.body}</span> : null}
                </span>
                <span className="grid justify-items-end gap-1.5">
                  <time dateTime={item.createdAt} className="text-hud text-xs text-muted">
                    {whenLabel(item.createdAt)}
                  </time>
                  {link ? (
                    <form action={openNotification}>
                      <input type="hidden" name="tenantId" value={workspace.id} />
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="linkPath" value={link} />
                      <button type="submit" className="btn btn-secondary px-3 py-1 text-sm">
                        Open
                      </button>
                    </form>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
