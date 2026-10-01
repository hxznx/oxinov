import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EduHeader } from '@/components/EduHeader';
import { eduApi } from '@/lib/edu-api.ts';
import { formatDate } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { formatNpr, paymentHeadline } from '@/lib/store.ts';
import { CopyButton } from './CopyButton';
import { ReceiptForm } from './ReceiptForm';

type Props = { params: Promise<{ slug: string; paymentId: string }> };

export const metadata: Metadata = { title: 'Pay by bank QR' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Bank QR payment (FR-CATALOG-307, FR-CATALOG-314; design screens 3 and 15). The learner scans or saves
 * the QR, pays the exact amount with the reference in the remarks, then sends the receipt and the bank
 * transaction ID. Nothing unlocks until an administrator approves it. Calm intensity: no effects.
 */
export default async function BankPaymentPage({ params }: Props) {
  const { slug, paymentId } = await params;
  if (!UUID.test(paymentId)) notFound();
  const here = `/w/${slug}/pay/bank/${paymentId}`;
  const { token, workspace } = await workspaceContext(slug, here);
  const { payment, bank } = await load(here, () => eduApi.bankPayment(token, workspace.id, paymentId));
  const headline = paymentHeadline(payment.status);
  const course = `/w/${slug}/courses/${payment.courseId}`;
  const canSend = payment.status === 'PENDING' || payment.status === 'REJECTED';

  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <main id="main" className="mx-auto grid max-w-5xl gap-6 px-4 py-10">
        <div>
          <p className="hud-label">
            <Link href={course}>// {payment.courseTitle}</Link>
          </p>
          <h1 className="mt-2 text-3xl">{headline.title}</h1>
          <ol aria-label="Steps" className="mt-3 flex flex-wrap gap-2 text-sm">
            <li className="hud-label">01 Plan ✓</li>
            <li className="hud-label">{canSend ? '02 Pay ◀' : '02 Pay ✓'}</li>
            <li className="hud-label">{payment.status === 'SUCCEEDED' ? '03 Approved ✓' : payment.status === 'REJECTED' ? '03 Needs a fix' : '03 Review'}</li>
          </ol>
        </div>

        <section aria-label="Order" className="card flex flex-wrap items-center justify-between gap-3">
          <span className="grid">
            <strong>
              {payment.courseTitle} · {payment.planLabel}
            </strong>
            {payment.couponCode ? (
              <span className="text-sm opacity-80">
                {formatNpr(payment.listPriceMinor)} − {formatNpr(payment.discountMinor)} with {payment.couponCode}
              </span>
            ) : null}
          </span>
          <span className="text-2xl font-semibold">{formatNpr(payment.amountMinor)}</span>
        </section>

        {payment.status === 'SUCCEEDED' ? (
          <section className="card grid gap-3" role="status">
            <p>Thank you! Your payment was approved and the course is unlocked. We also sent you an email.</p>
            <Link href={course} className="btn btn-primary justify-center">
              Open my course
            </Link>
          </section>
        ) : null}

        {payment.status === 'PENDING_REVIEW' ? (
          <section className="card grid gap-3" role="status">
            <p>
              Our team checks your payment against the bank statement. {bank.reviewTimeText}. You get an email the moment your course
              unlocks.
            </p>
            <p className="hud-label">
              // Reference {payment.reference} · transaction {payment.bankTransactionId}
              {payment.submittedAt ? ` · sent ${formatDate(payment.submittedAt, workspace.timeZone)}` : ''}
            </p>
            <Link href={course} className="btn btn-secondary justify-center">
              Back to the course (free lessons stay open)
            </Link>
          </section>
        ) : null}

        {payment.status === 'FAILED' ? (
          <section className="card grid gap-3">
            <p>This checkout was replaced by a newer one or closed. Choose a plan again on the course page.</p>
            <Link href={course} className="btn btn-primary justify-center">
              Back to the course
            </Link>
          </section>
        ) : null}

        {canSend ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <section aria-labelledby="pay-heading" className="card grid content-start gap-4">
              <h2 id="pay-heading" className="text-2xl">
                1. Scan and pay
              </h2>
              {payment.status === 'REJECTED' ? (
                <p role="alert" className="notice notice-error">
                  Reason from our team: {payment.reviewReason}
                </p>
              ) : null}
              {bank.qrUrl ? (
                <div className="grid justify-items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL from private storage */}
                  <img src={bank.qrUrl} alt="Ox Inov Pvt. Ltd. bank QR code" width={240} height={240} className="bg-white p-2" />
                  <a href={bank.qrUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">
                    Open QR image to save it
                  </a>
                  <p className="text-sm opacity-80">
                    Paying from this phone? Open the image, save it to your gallery, then choose &quot;Scan from gallery&quot; in your bank app.
                  </p>
                </div>
              ) : null}
              <dl className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <dt className="field-label">Amount</dt>
                  <dd className="flex items-center gap-2">
                    <strong>{formatNpr(payment.amountMinor)}</strong>
                    <CopyButton value={String(payment.amountMinor / 100)} label="amount" />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="field-label">Write in remarks</dt>
                  <dd className="flex items-center gap-2">
                    <code className="text-lg">{payment.reference}</code>
                    <CopyButton value={payment.reference} label="reference" />
                  </dd>
                </div>
                {bank.accountName ? (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="field-label">Account</dt>
                    <dd className="flex items-center gap-2 text-right">
                      <span>
                        {bank.accountName}
                        {bank.bankName ? ` · ${bank.bankName}` : ''}
                        {bank.accountNumber ? ` · ${bank.accountNumber}` : ''}
                      </span>
                      {bank.accountNumber ? <CopyButton value={bank.accountNumber} label="account number" /> : null}
                    </dd>
                  </div>
                ) : null}
              </dl>
              <ol className="list-decimal pl-5 text-sm opacity-80">
                <li>Open your bank or wallet app and scan the code.</li>
                <li>
                  Pay exactly {formatNpr(payment.amountMinor)} and add {payment.reference} in the remarks.
                </li>
                <li>Take a screenshot of the receipt and note its transaction ID.</li>
              </ol>
            </section>

            <section aria-labelledby="send-heading" className="card grid content-start gap-4">
              <h2 id="send-heading" className="text-2xl">
                2. Send us the receipt
              </h2>
              <ReceiptForm slug={slug} tenantId={workspace.id} paymentId={payment.id} resubmit={payment.status === 'REJECTED'} />
              <p className="text-sm opacity-80">
                {bank.reviewTimeText}. Free lessons stay open while we check.
                {bank.helpContact ? ` Stuck? ${bank.helpContact}.` : ''} Email support@oxinov.com with reference {payment.reference}.
              </p>
              {bank.refundPolicy ? <p className="text-sm opacity-80">Refund or change policy: {bank.refundPolicy}</p> : null}
            </section>
          </div>
        ) : null}
      </main>
    </>
  );
}
