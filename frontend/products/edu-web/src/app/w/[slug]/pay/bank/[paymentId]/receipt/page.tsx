import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { eduApi } from '@/lib/edu-api.ts';
import { formatDate } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { formatNpr } from '@/lib/store.ts';
import { PrintButton } from './PrintButton';

type Props = { params: Promise<{ slug: string; paymentId: string }> };

export const metadata: Metadata = { title: 'Receipt' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ZONE = 'Asia/Kathmandu';
const fullNpr = (minor: number) => `NPR ${(minor / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Printable payment receipt for an approved bank payment (FR-PAY-2705; design screen 26). Shown only to the
 * learner who paid (the Edu API returns only their own payment). It is a payment receipt, not a tax invoice;
 * tax details are added once the owner's accountant confirms them.
 */
export default async function ReceiptPage({ params }: Props) {
  const { slug, paymentId } = await params;
  if (!UUID.test(paymentId)) notFound();
  const here = `/w/${slug}/pay/bank/${paymentId}/receipt`;
  const { token, workspace } = await workspaceContext(slug, here);
  const [{ payment, bank }, me] = await Promise.all([load(here, () => eduApi.bankPayment(token, workspace.id, paymentId)), load(here, () => eduApi.me(token))]);
  if (payment.status !== 'SUCCEEDED') redirect(`/w/${slug}/pay/bank/${paymentId}`);
  const approved = payment.reviewedAt ?? payment.submittedAt ?? payment.createdAt;

  return (
    <main id="main" className="receipt-page mx-auto grid max-w-3xl gap-4 px-4 py-8">
      <div className="receipt-actions flex flex-wrap items-center justify-between gap-3">
        <Link href="/account/payments" className="text-hud text-sm no-underline">
          ← My payments
        </Link>
        <PrintButton />
      </div>
      <article className="grid gap-6 bg-white p-6 text-[#0A0A12] sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-[3px] border-[#07070D] pb-5">
          <span className="grid gap-1">
            <span className="font-display text-xl font-bold tracking-[0.16em]">OXINOV</span>
            <span className="text-xs text-[#4A5568]">Ox Inov Pvt. Ltd. · support@oxinov.com</span>
          </span>
          <span className="grid gap-1 text-right">
            <span className="font-studio text-2xl font-bold">Payment receipt</span>
            <span className="text-hud text-sm">No. {payment.reference}</span>
            <span className="text-xs text-[#4A5568]">Issued {formatDate(approved, ZONE)} (Nepal time)</span>
          </span>
        </header>
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="grid gap-0.5">
            <span className="text-[0.6875rem] tracking-[0.08em] text-[#4A5568]">BILLED TO</span>
            <span>{me.displayName ?? 'Oxinov learner'}</span>
            {me.email ? <span className="text-[#4A5568]">{me.email}</span> : null}
          </div>
          <div className="grid gap-0.5">
            <span className="text-[0.6875rem] tracking-[0.08em] text-[#4A5568]">PAYMENT</span>
            <span>Bank QR · reference {payment.reference}</span>
            <span className="text-[#4A5568]">
              Bank transaction {payment.bankTransactionId ?? '—'} · approved {formatDate(approved, ZONE)}
            </span>
          </div>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#D5DCE8] text-left text-[0.6875rem] tracking-[0.08em] text-[#4A5568]">
              <th className="py-2 font-normal">ITEM</th>
              <th className="py-2 text-right font-normal">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#E6EBF3]">
              <td className="py-3">
                {payment.courseTitle} · {payment.planLabel} plan
              </td>
              <td className="py-3 text-right">{fullNpr(payment.listPriceMinor)}</td>
            </tr>
            {payment.discountMinor > 0 ? (
              <tr className="border-b border-[#E6EBF3] text-[#4A5568]">
                <td className="py-3">Coupon {payment.couponCode}</td>
                <td className="py-3 text-right">− {fullNpr(payment.discountMinor)}</td>
              </tr>
            ) : null}
          </tbody>
          <tfoot>
            <tr>
              <td className="py-4 font-bold">Total paid</td>
              <td className="py-4 text-right font-display text-lg font-bold">{fullNpr(payment.amountMinor)}</td>
            </tr>
          </tfoot>
        </table>
        <p className="text-xs leading-relaxed text-[#4A5568]">
          Digital learning access for the named learner only. This is a payment receipt, not a tax invoice.
          {bank.refundPolicy ? ` Refund or change policy: ${bank.refundPolicy}` : ''} Amounts in Nepali rupees ({formatNpr(payment.amountMinor)}).
        </p>
      </article>
    </main>
  );
}
