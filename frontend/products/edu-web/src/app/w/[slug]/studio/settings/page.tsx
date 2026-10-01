import type { Metadata } from 'next';
import { eduApi } from '@/lib/edu-api.ts';
import { formatDate } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { PLAN_LABELS, formatNpr } from '@/lib/store.ts';
import { CouponForm, CouponToggle } from './CouponForms';
import { QrUploader } from './QrUploader';
import { SettingsForm, SettingsSection } from './SettingsForm';

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: 'Settings' };

/**
 * Store settings (FR-MGMT-1408, FR-CATALOG-317; design screen 24): bank QR and payment details that
 * checkout shows, default plan prices, policies, and coupons. Owners change them; administrators read.
 */
export default async function StoreSettingsPage({ params }: Props) {
  const { slug } = await params;
  const here = `/w/${slug}/studio/settings`;
  const { token, workspace } = await workspaceContext(slug, here);
  const [settings, coupons] = await Promise.all([load(here, () => eduApi.storeSettings(token, workspace.id)), load(here, () => eduApi.coupons(token, workspace.id))]);
  const owner = workspace.role === 'OWNER';
  const active = coupons.filter((coupon) => coupon.active).length;

  const qr = (
    <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
      {settings.qrUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL from private storage
        <img src={settings.qrUrl} alt="Current bank QR code" width={180} height={180} className="bg-white p-2" />
      ) : (
        <div className="grid h-[180px] w-[180px] place-items-center bg-white text-hud text-xs text-[#07070D]">[YOUR BANK QR]</div>
      )}
      <div className="grid content-start gap-2">
        <span className="font-semibold">Bank QR</span>
        <p className="studio-sub">The &quot;My QR&quot; image from your company bank app (PNG or JPG, up to 2 MB). Learners scan it at checkout.</p>
        {owner ? <QrUploader slug={slug} tenantId={workspace.id} /> : null}
      </div>
    </div>
  );

  return (
    <div className="grid max-w-5xl gap-4">
      <div className="grid gap-1">
        <span className="studio-kicker">// System</span>
        <h1 className="studio-title">
          <span className="crumb">Settings ›</span> Store
        </h1>
        <p className="text-sm text-muted">Everything learners see at checkout comes from here. Only the owner can change payment details and prices.</p>
      </div>

      {!settings.isSeller ? (
        <p className="notice notice-error">This workspace is not the selling workspace, so checkout stays closed. Oxinov engineering sets it in the server settings (ADR-023).</p>
      ) : !settings.available ? (
        <p className="notice">{settings.reason}</p>
      ) : (
        <p className="notice" role="status" style={{ borderLeftColor: 'var(--ox-color-success)' }}>
          Checkout is open: learners can pay by bank QR.
        </p>
      )}
      {!owner ? <p className="notice">Only the owner can change these settings.</p> : null}

      <SettingsForm slug={slug} tenantId={workspace.id} settings={settings} disabled={!owner} qr={qr} />

      <SettingsSection
        id="coupons"
        glyph="%"
        tone="tone-warning"
        title="Coupons"
        sub="Codes for campaigns, partners and events"
        status={`${active} active`}
        statusTone={active > 0 ? 'tone-success' : 'tone-muted'}
        open
      >
        {coupons.length === 0 ? (
          <p className="studio-sub">No coupons yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="studio-table min-w-[40rem]">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Plan</th>
                  <th>Used</th>
                  <th>Ends</th>
                  <th>
                    <span className="sr-only">On or off</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td className="text-hud tone-warning">{coupon.code}</td>
                    <td>{coupon.percentOff !== null ? `${coupon.percentOff}% off` : `${formatNpr(coupon.amountOffMinor ?? 0)} off`}</td>
                    <td>{coupon.period ? PLAN_LABELS[coupon.period] : 'All plans'}</td>
                    <td className="text-hud">
                      {coupon.usedCount}
                      {coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                    </td>
                    <td>{coupon.endsAt ? formatDate(coupon.endsAt, workspace.timeZone) : 'No end'}</td>
                    <td>{owner ? <CouponToggle slug={slug} tenantId={workspace.id} couponId={coupon.id} active={coupon.active} /> : coupon.active ? 'On' : 'Off'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {owner ? <CouponForm slug={slug} tenantId={workspace.id} /> : null}
        <p className="studio-sub">The server checks each coupon again when the payment is approved, so an expired or used-up code never slips through.</p>
      </SettingsSection>
    </div>
  );
}
