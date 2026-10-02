import type { Metadata } from 'next';
import Link from 'next/link';
import { eduApi } from '@/lib/edu-api.ts';
import { formatDate } from '@/lib/format.ts';
import { load } from '@/lib/guard.ts';
import { formatNpr, type BankPaymentStatus } from '@/lib/store.ts';
import { accountContext } from '../data';

export const metadata: Metadata = { title: 'Payments and receipts' };

const STATUS: Record<BankPaymentStatus, { label: string; tone: string }> = {
  PENDING: { label: 'Waiting for your receipt', tone: 'tone-warning' },
  PENDING_REVIEW: { label: 'In review', tone: 'tone-warning' },
  SUCCEEDED: { label: 'Approved', tone: 'tone-success' },
  REJECTED: { label: 'Needs a fix', tone: 'tone-danger' },
  FAILED: { label: 'Closed', tone: 'tone-muted' },
};

/** The learner's own bank payments with their state, newest first (FR-AUTH-104, FR-PAY-2705). */
export default async function PaymentsPage() {
  const { token, workspace } = await accountContext('/account/payments');
  const payments = workspace ? await load('/account/payments', () => eduApi.myBankPayments(token, workspace.id)) : [];

  return (
    <>
      <div className="grid gap-1">
        <span className="studio-kicker">// My learning</span>
        <h1 className="studio-title">
          <span className="crumb">Account ›</span> Payments and receipts
        </h1>
        <p className="text-sm text-muted">Each bank payment, what it was for, and where it stands. Open one to see the details, fix a rejected payment, or keep it as a receipt.</p>
      </div>
      {payments.length === 0 || !workspace ? (
        <p className="studio-panel px-5 py-4 text-muted">No payments yet.</p>
      ) : (
        <div className="studio-panel overflow-x-auto">
          <table className="studio-table min-w-[44rem]">
            <thead>
              <tr>
                <th>Offering · plan</th>
                <th>Amount</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Date</th>
                <th>
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const status = STATUS[payment.status];
                return (
                  <tr key={payment.id}>
                    <td>
                      {payment.courseTitle} · {payment.planLabel}
                      {payment.couponCode ? <span className="studio-status tone-warning block">{payment.couponCode}</span> : null}
                    </td>
                    <td className="font-display whitespace-nowrap">{formatNpr(payment.amountMinor)}</td>
                    <td className="text-hud">{payment.reference}</td>
                    <td className={`studio-status ${status.tone}`}>{status.label}</td>
                    <td className="whitespace-nowrap">{formatDate(payment.reviewedAt ?? payment.submittedAt ?? payment.createdAt, 'Asia/Kathmandu')}</td>
                    <td className="text-right">
                      <Link
                        href={`/w/${workspace.slug}/pay/bank/${payment.id}${payment.status === 'SUCCEEDED' ? '/receipt' : ''}`}
                        className="btn btn-secondary text-sm"
                      >
                        {payment.status === 'REJECTED' ? 'Fix' : payment.status === 'PENDING' ? 'Continue' : payment.status === 'SUCCEEDED' ? 'Receipt' : 'Open'}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
