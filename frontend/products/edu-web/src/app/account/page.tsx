import type { Metadata } from 'next';
import Link from 'next/link';
import { subscriptionStatus } from '@/lib/account.ts';
import { eduApi } from '@/lib/edu-api.ts';
import { formatDate } from '@/lib/format.ts';
import { load } from '@/lib/guard.ts';
import { formatNpr } from '@/lib/store.ts';
import { KIND_LABELS } from '@/lib/storefront.ts';
import { accountContext } from './data';

export const metadata: Metadata = { title: 'My subscriptions' };

const TONE = { success: 'tone-success', warning: 'tone-warning', danger: 'tone-danger', muted: 'tone-muted', brand: 'tone-brand' } as const;
const ZONE = 'Asia/Kathmandu';

/** Every offering the learner can open, with the plan, price paid, and end date or lifetime (FR-AUTH-104). */
export default async function SubscriptionsPage() {
  const { token, workspace } = await accountContext('/account');
  const subs = workspace ? await load('/account', () => eduApi.mySubscriptions(token, workspace.id)) : [];

  return (
    <>
      <div className="grid gap-1">
        <span className="studio-kicker">// My learning</span>
        <h1 className="studio-title">
          <span className="crumb">Account ›</span> My subscriptions
        </h1>
        <p className="text-sm text-muted">Every course, class, skill, and idea you can open, with the plan you bought and when it ends.</p>
      </div>

      {subs.length === 0 ? (
        <section className="studio-panel grid gap-3 p-5">
          <h2 className="studio-h2">Nothing here yet</h2>
          <p className="text-muted">Start with a free class or choose a plan in the store. Everything you join appears here.</p>
          <Link href="/" className="btn btn-primary justify-self-start font-studio">
            Explore the store
          </Link>
        </section>
      ) : (
        <ul className="grid gap-3">
          {subs.map((sub) => {
            const status = subscriptionStatus(sub);
            const open = workspace ? `/w/${workspace.slug}/courses/${sub.courseId}` : '/';
            return (
              <li key={sub.courseId} className="studio-panel grid items-center gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                <span className="grid gap-0.5">
                  <span className="studio-status tone-brand">{KIND_LABELS[sub.kind] ?? 'Course'}</span>
                  <span className="font-studio text-lg font-bold">{sub.courseTitle}</span>
                  <span className="studio-sub">
                    {sub.source === 'FREE'
                      ? 'Free'
                      : sub.source === 'ADMIN_GRANT'
                        ? 'Given by Oxinov'
                        : `${sub.planLabel ?? 'Plan'}${sub.paidMinor !== null ? ` · paid ${formatNpr(sub.paidMinor)}` : ''}`}{' '}
                    · since {formatDate(sub.since, ZONE)}
                  </span>
                </span>
                <span className="grid gap-0.5 sm:text-right">
                  <span className={`studio-status ${TONE[status.tone]}`}>{status.label}</span>
                  <span className="studio-sub">
                    {sub.endsAt ? `${sub.state === 'ACTIVE' ? 'until' : 'on'} ${formatDate(sub.endsAt, ZONE)}` : sub.source === 'FREE' ? 'No end date' : 'Never ends'}
                  </span>
                </span>
                <span className="flex flex-wrap gap-2">
                  {sub.state === 'ACTIVE' ? (
                    <Link href={open} className="btn btn-primary text-sm">
                      Open ▶
                    </Link>
                  ) : null}
                  {status.renew ? (
                    <Link href={`/o/${sub.courseSlug}`} className="btn btn-secondary text-sm">
                      Renew
                    </Link>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="studio-panel px-5 py-3 text-sm text-muted">
        Payment history and receipts: <Link href="/account/payments">see all payments</Link>
      </p>
    </>
  );
}
