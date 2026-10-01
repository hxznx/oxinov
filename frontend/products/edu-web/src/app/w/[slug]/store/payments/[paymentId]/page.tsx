import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EduHeader } from '@/components/EduHeader';
import { eduApi } from '@/lib/edu-api.ts';
import { formatDate } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { formatNpr } from '@/lib/store.ts';
import { ReviewForms } from './ReviewForms';

type Props = { params: Promise<{ slug: string; paymentId: string }> };

export const metadata: Metadata = { title: 'Review payment' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** One bank QR payment with its receipt and automatic checks; approve or reject with a reason (FR-MGMT-1403/1405). */
export default async function ReviewPaymentPage({ params }: Props) {
  const { slug, paymentId } = await params;
  if (!UUID.test(paymentId)) notFound();
  const here = `/w/${slug}/store/payments/${paymentId}`;
  const { token, workspace } = await workspaceContext(slug, here);
  if (workspace.role !== 'ADMIN' && workspace.role !== 'OWNER') notFound();
  const item = await load(here, () => eduApi.reviewDetail(token, workspace.id, paymentId));
  const pdf = item.evidenceUrl !== null && item.evidenceUrl.includes('.pdf');

  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <main id="main" className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1fr_24rem]">
        <div className="grid content-start gap-4">
          <p className="hud-label">
            <Link href={`/w/${slug}/store/payments`}>// Payments</Link>
          </p>
          <h1 className="text-3xl">
            {item.reference} · {formatNpr(item.amountMinor)}
          </h1>
          <dl className="card grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="field-label">Learner</dt>
              <dd>
                {item.learnerName ?? 'Learner'} · {item.learnerEmail}
              </dd>
            </div>
            <div>
              <dt className="field-label">Course and plan</dt>
              <dd>
                {item.courseTitle} · {item.planLabel}
              </dd>
            </div>
            <div>
              <dt className="field-label">Price</dt>
              <dd>
                {formatNpr(item.listPriceMinor)}
                {item.couponCode ? ` − ${formatNpr(item.discountMinor)} (${item.couponCode}) = ${formatNpr(item.amountMinor)}` : ''}
              </dd>
            </div>
            <div>
              <dt className="field-label">Bank transaction ID</dt>
              <dd>
                <code>{item.bankTransactionId ?? '—'}</code>
              </dd>
            </div>
            <div>
              <dt className="field-label">Sent</dt>
              <dd>{item.submittedAt ? formatDate(item.submittedAt, workspace.timeZone) : '—'}</dd>
            </div>
            <div>
              <dt className="field-label">Status</dt>
              <dd>
                {item.status}
                {item.reviewReason ? ` · ${item.reviewReason}` : ''}
              </dd>
            </div>
          </dl>
          <section aria-labelledby="receipt-heading" className="card grid gap-3">
            <h2 id="receipt-heading" className="text-2xl">
              Receipt
            </h2>
            {item.evidenceUrl === null ? (
              <p className="notice">No receipt attached.</p>
            ) : pdf ? (
              <a href={item.evidenceUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">
                Open the PDF receipt
              </a>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL from private storage
              <img src={item.evidenceUrl} alt={`Receipt for payment ${item.reference}`} className="max-h-[36rem] w-auto justify-self-start" />
            )}
          </section>
        </div>
        <aside className="grid content-start gap-4">
          <section aria-labelledby="checks-heading" className="card grid gap-2">
            <h2 id="checks-heading" className="hud-label">
              // Automatic checks · still confirm in your bank app
            </h2>
            <ul className="grid gap-1 text-sm">
              {item.checks.map((check) => (
                <li key={check.text}>
                  <span aria-hidden="true">{check.ok ? '✓ ' : '⚠ '}</span>
                  {check.text}
                </li>
              ))}
            </ul>
          </section>
          {item.status === 'PENDING_REVIEW' ? <ReviewForms slug={slug} tenantId={workspace.id} paymentId={item.id} /> : null}
        </aside>
      </main>
    </>
  );
}
