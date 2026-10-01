import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EduHeader } from '@/components/EduHeader';
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

/** Bank QR review queue, oldest first (FR-MGMT-1403; design screen 5). Administrators only. */
export default async function PaymentsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const wanted = (await searchParams).status;
  const tab = TABS.find((item) => item.status === wanted) ?? TABS[0];
  const here = `/w/${slug}/store/payments`;
  const { token, workspace } = await workspaceContext(slug, here);
  if (workspace.role !== 'ADMIN' && workspace.role !== 'OWNER') notFound();
  const items = await load(here, () => eduApi.reviewQueue(token, workspace.id, tab.status));

  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <main id="main" className="mx-auto grid max-w-6xl gap-6 px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="hud-label">
              <Link href={`/w/${slug}`}>// {workspace.name}</Link>
            </p>
            <h1 className="mt-2 text-4xl">Payments</h1>
          </div>
          <Link href={`/w/${slug}/store/settings`} className="btn btn-secondary">
            Store settings
          </Link>
        </div>
        <nav aria-label="Payment states" className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <Link key={item.status} href={`${here}?status=${item.status}`} aria-current={item.status === tab.status ? 'page' : undefined} className={`btn ${item.status === tab.status ? 'btn-primary' : 'btn-secondary'}`}>
              {item.label}
            </Link>
          ))}
        </nav>
        {items.length === 0 ? (
          <p className="notice">{tab.status === 'PENDING_REVIEW' ? 'Nothing is waiting. New bank payments appear here, oldest first.' : 'None yet.'}</p>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="hud-label">
                <tr>
                  <th className="p-3">Learner</th>
                  <th className="p-3">Course · plan</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3">{tab.status === 'PENDING_REVIEW' ? 'Sent' : 'Reviewed'}</th>
                  <th className="p-3">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-[var(--ox-color-border)]">
                    <td className="p-3">
                      {item.learnerName ?? 'Learner'}
                      <br />
                      <span className="opacity-80">{item.learnerEmail}</span>
                    </td>
                    <td className="p-3">
                      {item.courseTitle} · {item.planLabel}
                      {item.couponCode ? <span className="hud-label block">// {item.couponCode}</span> : null}
                    </td>
                    <td className="p-3 font-semibold">{formatNpr(item.amountMinor)}</td>
                    <td className="p-3">
                      <code>{item.reference}</code>
                    </td>
                    <td className="p-3">{formatDate((tab.status === 'PENDING_REVIEW' ? item.submittedAt : item.reviewedAt) ?? item.createdAt, workspace.timeZone)}</td>
                    <td className="p-3">
                      <Link href={`${here}/${item.id}`} className="btn btn-secondary">
                        {tab.status === 'PENDING_REVIEW' ? 'Review' : 'Open'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
