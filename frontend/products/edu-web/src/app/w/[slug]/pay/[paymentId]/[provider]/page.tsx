import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { EduHeader } from '@/components/EduHeader';
import { EduApiError, eduApi, type Payment } from '@/lib/edu-api.ts';
import { formatPrice } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';

type Props = { params: Promise<{ slug: string; paymentId: string; provider: string }> };

export const metadata: Metadata = { title: 'Payment' };

const PROVIDER: Record<string, string> = { khalti: 'Khalti', esewa: 'eSewa' };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Where Khalti and eSewa send the learner back (ADR-023). Whatever the provider put in the address, this
 * page only asks the Edu API to verify the payment with the provider; that answer alone opens the course.
 */
export default async function PaymentReturnPage({ params }: Props) {
  const { slug, paymentId, provider } = await params;
  if (!PROVIDER[provider] || !UUID.test(paymentId)) notFound();
  const here = `/w/${slug}/pay/${paymentId}/${provider}`;
  const { token, workspace } = await workspaceContext(slug, here);

  let payment: Payment | null = null;
  let unavailable = false;
  try {
    payment = await load(here, () => eduApi.verifyPayment(token, workspace.id, paymentId));
  } catch (error) {
    // The provider did not answer: nothing is lost; the learner checks again.
    if (error instanceof EduApiError && error.code === 'PAYMENT_UNAVAILABLE') unavailable = true;
    else throw error;
  }
  const course = payment ? `/w/${slug}/courses/${payment.courseId}` : `/w/${slug}`;
  if (payment?.status === 'SUCCEEDED') redirect(`${course}?paid=1`);

  const name = PROVIDER[provider];
  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <main id="main" className="mx-auto grid max-w-xl gap-5 px-4 py-10">
        <h1 className="text-3xl">
          {payment?.status === 'FAILED' ? 'Payment not completed' : 'Confirming your payment'}
        </h1>
        {payment ? (
          <p className="hud-label">
            // {name} · {formatPrice({ amountMinor: payment.amountMinor, currency: payment.currency })}
          </p>
        ) : null}
        {payment?.status === 'FAILED' ? (
          <p className="notice">
            This payment was not confirmed, so the course is still locked. You can try again. If money left your account, email{' '}
            <a href="mailto:support@oxinov.com">support@oxinov.com</a> with payment reference <code>{paymentId}</code>.
          </p>
        ) : (
          <p className="notice" role="status">
            {unavailable
              ? `${name} did not answer just now. Your payment is safe; check again in a minute.`
              : `${name} has not confirmed the payment yet. This usually takes a few seconds; check again shortly.`}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          {payment?.status === 'FAILED' ? null : (
            <Link href={here} prefetch={false} className="btn btn-primary">
              Check again
            </Link>
          )}
          <Link href={course} className="btn btn-secondary">
            Back to the course
          </Link>
        </div>
      </main>
    </>
  );
}
