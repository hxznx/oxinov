import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EduHeader } from '@/components/EduHeader';
import { eduApi } from '@/lib/edu-api.ts';
import { formatDate } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { PLAN_LABELS, formatNpr } from '@/lib/store.ts';
import { CouponForm, CouponToggle } from './CouponForms';
import { QrUploader } from './QrUploader';
import { SettingsForm } from './SettingsForm';

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: 'Store settings' };

/**
 * Store settings (FR-MGMT-1408, FR-CATALOG-317; design screen 24): bank QR and payment details that
 * checkout shows, review time, help contact, refund policy, default plan prices, and coupons. Owners
 * change them; administrators can read them.
 */
export default async function StoreSettingsPage({ params }: Props) {
  const { slug } = await params;
  const here = `/w/${slug}/store/settings`;
  const { token, workspace } = await workspaceContext(slug, here);
  if (workspace.role !== 'ADMIN' && workspace.role !== 'OWNER') notFound();
  const [settings, coupons] = await Promise.all([load(here, () => eduApi.storeSettings(token, workspace.id)), load(here, () => eduApi.coupons(token, workspace.id))]);
  const owner = workspace.role === 'OWNER';

  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <main id="main" className="mx-auto grid max-w-5xl gap-6 px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="hud-label">
              <Link href={`/w/${slug}`}>// {workspace.name}</Link>
            </p>
            <h1 className="mt-2 text-4xl">Store settings</h1>
          </div>
          <Link href={`/w/${slug}/store/payments`} className="btn btn-secondary">
            Payments
          </Link>
        </div>
        {!settings.isSeller ? (
          <p className="notice">This workspace is not an approved seller yet, so checkout stays closed. Oxinov engineering adds it to the seller list (ADR-023).</p>
        ) : !settings.available ? (
          <p className="notice">{settings.reason}</p>
        ) : (
          <p className="notice" role="status">
            Checkout is open: learners can pay by bank QR.
          </p>
        )}
        {!owner ? <p className="notice">Only the owner can change these settings.</p> : null}

        <section aria-labelledby="qr-heading" className="card grid gap-4 sm:grid-cols-[14rem_1fr]">
          <div className="grid content-start justify-items-center gap-2">
            {settings.qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL from private storage
              <img src={settings.qrUrl} alt="Current bank QR code" width={200} height={200} className="bg-white p-2" />
            ) : (
              <div className="grid h-[200px] w-[200px] place-items-center border border-dashed border-[var(--ox-color-border)] text-sm opacity-80">No QR yet</div>
            )}
          </div>
          <div className="grid content-start gap-2">
            <h2 id="qr-heading" className="text-2xl">
              Bank QR
            </h2>
            <p className="text-sm opacity-80">Use the &quot;My QR&quot; image from your company bank app (PNG or JPG, up to 2 MB). Learners see it at checkout.</p>
            {owner ? <QrUploader slug={slug} tenantId={workspace.id} /> : null}
          </div>
        </section>

        <SettingsForm slug={slug} tenantId={workspace.id} settings={settings} disabled={!owner} />

        <section aria-labelledby="coupons-heading" className="card grid gap-4">
          <h2 id="coupons-heading" className="text-2xl">
            Coupons
          </h2>
          {coupons.length === 0 ? (
            <p className="text-sm opacity-80">No coupons yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="hud-label">
                  <tr>
                    <th className="p-2">Code</th>
                    <th className="p-2">Discount</th>
                    <th className="p-2">Plan</th>
                    <th className="p-2">Used</th>
                    <th className="p-2">Ends</th>
                    <th className="p-2">
                      <span className="sr-only">On or off</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-t border-[var(--ox-color-border)]">
                      <td className="p-2">
                        <code>{coupon.code}</code>
                      </td>
                      <td className="p-2">{coupon.percentOff !== null ? `${coupon.percentOff}% off` : `${formatNpr(coupon.amountOffMinor ?? 0)} off`}</td>
                      <td className="p-2">{coupon.period ? PLAN_LABELS[coupon.period] : 'All plans'}</td>
                      <td className="p-2">
                        {coupon.usedCount}
                        {coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                      </td>
                      <td className="p-2">{coupon.endsAt ? formatDate(coupon.endsAt, workspace.timeZone) : 'No end'}</td>
                      <td className="p-2">{owner ? <CouponToggle slug={slug} tenantId={workspace.id} couponId={coupon.id} active={coupon.active} /> : coupon.active ? 'On' : 'Off'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {owner ? <CouponForm slug={slug} tenantId={workspace.id} /> : null}
        </section>
      </main>
    </>
  );
}
