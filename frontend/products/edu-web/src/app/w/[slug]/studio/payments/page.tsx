import type { Metadata } from 'next';
import Link from 'next/link';
import { eduApi } from '@/lib/edu-api.ts';
import { formatDate } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { formatNpr } from '@/lib/store.ts';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ status?: string }> };

export const metadata: Metadata = { title: 'Payments' };

const TABS = [
  { status: 'PENDING_REVIEW', label: 'Waiting for review' },
  { status: 'SUCCEEDED', label: 'Approved' },
  { status: 'REJECTED', label: 'Rejected' },
] as const;

/** Bank QR review queue, oldest first (FR-MGMT-1403; design screen 5). Calm effect level. */
export default async function PaymentsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const wanted = (await searchParams).status;
  const tab = TABS.find((item) => item.status === wanted) ?? TABS[0];
  const here = `/w/${slug}/studio/payments`;
  const { token, workspace } = await workspaceContext(slug, here);
  const items = await load(here, () => eduApi.reviewQueue(token, workspace.id, tab.status));
  const pending = tab.status === 'PENDING_REVIEW';

  return (
    <>
      <div className="grid gap-1">
        <span className="studio-kicker">// Business</span>
        <h1 className="studio-title">Payments</h1>
        <p className="text-sm text-muted">Compare each payment with your bank statement before approving. Approving unlocks the offering and sends the thank-you email.</p>
      </div>
      <nav aria-label="Payment states" className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <Link
            key={item.status}
            href={`${here}?status=${item.status}`}
            aria-current={item.status === tab.status ? 'page' : undefined}
            className={`btn font-studio ${item.status === tab.status ? 'btn-primary' : 'btn-secondary'}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <section aria-label={tab.label} className="studio-panel overflow-x-auto">
        <div className="studio-panel-head">
          <h2 className="studio-h2">{tab.label}</h2>
          <span className={`studio-status ${pending && items.length > 0 ? 'tone-warning' : 'tone-muted'}`}>
            {items.length}
            {pending ? ' · oldest first' : ' · newest first'}
          </span>
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-4 text-muted">{pending ? 'Nothing is waiting. New bank payments appear here, oldest first.' : 'None yet.'}</p>
        ) : (
          <table className="studio-table min-w-[48rem]">
            <thead>
              <tr>
                <th>Learner</th>
                <th>Offering · plan</th>
                <th>Amount</th>
                <th>Reference</th>
                <th>{pending ? 'Sent' : 'Reviewed'}</th>
                <th>
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.learnerName ?? 'Learner'}
                    <span className="studio-sub block break-all">{item.learnerEmail}</span>
                  </td>
                  <td>
                    {item.courseTitle} · {item.planLabel}
                    {item.couponCode ? <span className="studio-status tone-warning block">{item.couponCode}</span> : null}
                  </td>
                  <td className="font-display whitespace-nowrap">{formatNpr(item.amountMinor)}</td>
                  <td className="text-hud tone-warning">{item.reference}</td>
                  <td className="whitespace-nowrap">{formatDate((pending ? item.submittedAt : item.reviewedAt) ?? item.createdAt, workspace.timeZone)}</td>
                  <td className="text-right">
                    <Link href={`${here}/${item.id}`} className={`btn text-sm ${pending ? 'btn-primary' : 'btn-secondary'}`}>
                      {pending ? 'Review' : 'Open'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
