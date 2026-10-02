import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EduHeader } from '@/components/EduHeader';
import { eduApi } from '@/lib/edu-api.ts';
import { formatDate } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { formatNpr, whatsappLink } from '@/lib/store.ts';
import { CopyButton } from './CopyButton';
import { ReceiptForm } from './ReceiptForm';

type Props = { params: Promise<{ slug: string; paymentId: string }> };

export const metadata: Metadata = { title: 'Pay by bank QR' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SUPPORT = 'support@oxinov.com';

/**
 * Bank QR payment (FR-CATALOG-307, FR-CATALOG-314; design screens 3 and 15). The learner scans or saves
 * the QR, pays the exact amount with the reference in the remarks, then sends the receipt and the bank
 * transaction ID. Nothing unlocks until an administrator approves it. Calm intensity: no motion effects.
 */
export default async function BankPaymentPage({ params }: Props) {
  const { slug, paymentId } = await params;
  if (!UUID.test(paymentId)) notFound();
  const here = `/w/${slug}/pay/bank/${paymentId}`;
  const { token, workspace } = await workspaceContext(slug, here);
  const { payment, bank } = await load(here, () => eduApi.bankPayment(token, workspace.id, paymentId));
  const course = `/w/${slug}/courses/${payment.courseId}`;
  const paying = payment.status === 'PENDING' || payment.status === 'REJECTED';
  const whatsapp = whatsappLink(bank.helpContact, `Hello Oxinov, I need help with payment ${payment.reference}.`);

  const steps = [
    { label: '01 Plan ✓', state: 'done' },
    { label: paying ? '02 Pay' : '02 Pay ✓', state: paying ? 'active' : 'done' },
    {
      label: payment.status === 'SUCCEEDED' ? '03 Approved ✓' : payment.status === 'REJECTED' ? '03 Needs a fix' : '03 Review',
      state: payment.status === 'SUCCEEDED' ? 'done' : payment.status === 'PENDING' ? 'todo' : payment.status === 'REJECTED' ? 'error' : 'active',
    },
  ];
  const STEP_TONE: Record<string, string> = { done: '--ox-color-success', active: '--ox-color-brand', todo: '--ox-color-text-muted', error: '--ox-color-danger' };

  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <main id="main" className="store-wrap grid max-w-6xl gap-6 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={course} className="font-studio font-semibold text-muted no-underline hover:text-brand">
            ← Back to the course
          </Link>
          <span className="flex-1" />
          <span className="text-hud text-xs tracking-widest text-muted">SECURE CHECKOUT · OX INOV PVT. LTD.</span>
        </div>

        <ol aria-label="Steps" className="flex flex-wrap gap-2">
          {steps.map((step) => (
            <li
              key={step.label}
              aria-current={step.state === 'active' ? 'step' : undefined}
              className="cut-sm text-hud border px-3.5 py-2 text-xs tracking-wider"
              style={{ borderColor: `var(${step.state === 'todo' ? '--ox-color-border' : STEP_TONE[step.state]})`, color: `var(${STEP_TONE[step.state]})` }}
            >
              {step.label}
            </li>
          ))}
        </ol>

        {payment.status === 'SUCCEEDED' ? (
          <section role="status" className="studio-panel mx-auto grid w-full max-w-2xl justify-items-center gap-4 p-8 text-center" style={{ borderColor: 'var(--ox-color-success)' }}>
            <span className="studio-status tone-success">Status: approved</span>
            <h1 className="studio-title">You are in. Thank you!</h1>
            <p className="text-muted">
              Your {payment.planLabel} plan for {payment.courseTitle} is active. We also sent you an email and a notification.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href={course} className="btn btn-primary font-studio">
                Open my course ▶
              </Link>
              <Link href={`${here}/receipt`} className="btn btn-secondary font-studio">
                View receipt
              </Link>
            </div>
          </section>
        ) : null}

        {payment.status === 'PENDING_REVIEW' ? (
          <section role="status" className="studio-panel mx-auto grid w-full max-w-2xl justify-items-center gap-4 p-8 text-center" style={{ borderColor: 'var(--ox-color-warning)' }}>
            <span className="studio-status tone-warning">Status: in review</span>
            <h1 className="studio-title">We received your payment details</h1>
            <p className="text-muted">
              Our team checks it against the bank statement. {bank.reviewTimeText}. You get an email and a notice in your account the moment your course
              unlocks.
            </p>
            <p className="text-hud text-xs text-muted">
              REFERENCE {payment.reference} · TRANSACTION {payment.bankTransactionId}
              {payment.submittedAt ? ` · SENT ${formatDate(payment.submittedAt, workspace.timeZone).toUpperCase()}` : ''}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/account" className="btn btn-primary font-studio">
                Go to my account
              </Link>
              <Link href={course} className="btn btn-secondary font-studio">
                Free lessons stay open
              </Link>
            </div>
            <p className="text-sm text-muted">Questions? {SUPPORT}</p>
          </section>
        ) : null}

        {payment.status === 'FAILED' ? (
          <section className="studio-panel mx-auto grid w-full max-w-2xl gap-3 p-6">
            <h1 className="studio-h2">This checkout was closed</h1>
            <p className="text-muted">A newer checkout replaced it, or it was closed. Choose a plan again on the course page.</p>
            <Link href={course} className="btn btn-primary justify-self-start">
              Back to the course
            </Link>
          </section>
        ) : null}

        {paying ? (
          <>
            {payment.status === 'REJECTED' ? (
              <section role="alert" className="studio-panel grid gap-3 p-5" style={{ borderColor: 'var(--ox-color-danger)' }}>
                <span className="studio-status tone-danger">Status: needs a fix</span>
                <h1 className="studio-h2 text-2xl">We could not approve this payment yet</h1>
                <p className="border-l-[3px] bg-bg px-4 py-3" style={{ borderColor: 'var(--ox-color-danger)' }}>
                  Reason from our team: {payment.reviewReason}
                </p>
                <p className="text-sm text-muted">
                  Nothing is lost. Fix the details below and send them again; resubmitting keeps the same payment ({payment.reference}). Your free lessons stay
                  open.
                </p>
              </section>
            ) : (
              <h1 className="studio-title">Scan and pay</h1>
            )}

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
              <section aria-labelledby="pay-heading" className="studio-panel grid justify-items-center gap-4 p-6 text-center">
                <h2 id="pay-heading" className="studio-h2">
                  1. Pay with your bank app
                </h2>
                {bank.qrUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL from private storage */}
                    <img src={bank.qrUrl} alt="Ox Inov Pvt. Ltd. bank QR code" width={240} height={240} className="bg-white p-3" />
                    <a href={bank.qrUrl} target="_blank" rel="noreferrer" className="btn btn-primary font-studio">
                      Save QR to gallery
                    </a>
                    <p className="text-sm text-muted">Paying from this phone? Save the QR, then choose &quot;Scan from gallery&quot; in your bank app.</p>
                  </>
                ) : null}
                {bank.accountName ? (
                  <div className="grid gap-0.5">
                    <span className="text-sm text-muted">Account name</span>
                    <span className="font-studio text-xl font-bold">{bank.accountName}</span>
                    {bank.bankName || bank.accountNumber ? (
                      <span className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted">
                        {[bank.bankName, bank.accountNumber].filter(Boolean).join(' · ')}
                        {bank.accountNumber ? <CopyButton value={bank.accountNumber} label="account number" /> : null}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <div className="grid w-full gap-2.5 sm:grid-cols-2">
                  <div className="cut-sm grid gap-1 bg-raised p-3 text-left">
                    <span className="text-xs text-muted">Amount</span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-display text-lg font-bold tone-brand">{formatNpr(payment.amountMinor)}</span>
                      <CopyButton value={String(payment.amountMinor / 100)} label="amount" />
                    </span>
                  </div>
                  <div className="cut-sm grid gap-1 bg-raised p-3 text-left">
                    <span className="text-xs text-muted">Write in remarks</span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-hud text-lg tone-warning">{payment.reference}</span>
                      <CopyButton value={payment.reference} label="reference" />
                    </span>
                  </div>
                </div>
                <ol className="list-decimal pl-5 text-left text-sm text-muted">
                  <li>Open your bank or wallet app and scan the code.</li>
                  <li>
                    Pay exactly {formatNpr(payment.amountMinor)} and add {payment.reference} in the remarks.
                  </li>
                  <li>Take a screenshot of the receipt and copy its transaction ID.</li>
                </ol>
              </section>

              <section aria-labelledby="send-heading" className="grid content-start gap-4">
                <div className="studio-panel flex flex-wrap items-center justify-between gap-3 p-5">
                  <span className="grid gap-0.5">
                    <span className="font-studio text-lg font-bold">{payment.courseTitle}</span>
                    <span className="text-sm text-muted">
                      {payment.planLabel}
                      {payment.couponCode ? ` · ${formatNpr(payment.listPriceMinor)} − ${formatNpr(payment.discountMinor)} with ${payment.couponCode}` : ''}
                    </span>
                  </span>
                  <span className="font-display text-xl font-bold">{formatNpr(payment.amountMinor)}</span>
                </div>
                <div className="studio-panel grid gap-4 p-5">
                  <h2 id="send-heading" className="studio-h2">
                    2. Send us the receipt
                  </h2>
                  <ReceiptForm slug={slug} tenantId={workspace.id} paymentId={payment.id} resubmit={payment.status === 'REJECTED'} reference={payment.reference} />
                  <p className="text-sm text-muted">{bank.reviewTimeText}. Free lessons stay open while we check.</p>
                </div>
                {whatsapp ? (
                  <a href={whatsapp} target="_blank" rel="noreferrer noopener" className="btn justify-center border font-studio" style={{ borderColor: 'var(--ox-color-success)', color: 'var(--ox-color-success)' }}>
                    Stuck? Message us on WhatsApp
                  </a>
                ) : bank.helpContact ? (
                  <p className="text-sm text-muted">Stuck? {bank.helpContact}.</p>
                ) : null}
                <p className="text-sm text-muted">
                  Email {SUPPORT} with reference {payment.reference}.{bank.refundPolicy ? ` Refund or change policy: ${bank.refundPolicy}` : ''}
                </p>
                <div className="cut-sm flex items-center justify-between border border-line px-4 py-3 text-sm text-muted">
                  <span>Paying from abroad? Card payment</span>
                  <span className="studio-status tone-warning">Coming soon</span>
                </div>
              </section>
            </div>
          </>
        ) : null}
      </main>
    </>
  );
}
