'use client';

import { useActionState, type ReactNode } from 'react';
import { saveStoreSettings, type StoreFormState } from '@/app/store-actions';
import { formatNpr, type StoreSettings } from '@/lib/store.ts';

const rupees = (minor: number) => String(minor / 100);

/** One collapsible settings group: icon, title, summary, and status on the right (Windows Settings). */
export function SettingsSection({
  id,
  glyph,
  tone,
  title,
  sub,
  status,
  statusTone,
  open,
  children,
}: {
  id: string;
  glyph: string;
  tone: string;
  title: string;
  sub: string;
  status: string;
  statusTone: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details id={id} className="studio-section" open={open}>
      <summary>
        <span className={`studio-icon ${tone}`} aria-hidden="true">
          {glyph}
        </span>
        <span className="grid gap-0.5">
          <span className="font-semibold">{title}</span>
          <span className="studio-sub">{sub}</span>
        </span>
        <span className={`studio-status ${statusTone}`}>{status}</span>
      </summary>
      <div className="studio-section-body">{children}</div>
    </details>
  );
}

/**
 * Payment details, default plan prices, and policies in one form (FR-MGMT-1408). The QR uploader sits in
 * the payment group but saves on its own, as soon as a file is chosen.
 */
export function SettingsForm({ slug, tenantId, settings, disabled, qr }: { slug: string; tenantId: string; settings: StoreSettings; disabled: boolean; qr: ReactNode }) {
  const [state, action, pending] = useActionState<StoreFormState, FormData>(saveStoreSettings, {});
  const paymentReady = settings.qrUrl && settings.accountName && settings.accountNumber && settings.bankName;
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="tenantId" value={tenantId} />

      <SettingsSection
        id="payment"
        glyph="₹"
        tone="tone-success"
        title="Payment details"
        sub="Bank QR, account, reference, review time, payment help"
        status={!settings.qrUrl ? '⚠ QR not uploaded' : paymentReady ? 'Ready' : '⚠ Details missing'}
        statusTone={paymentReady ? 'tone-success' : 'tone-warning'}
        open={!paymentReady}
      >
        {qr}
        <fieldset disabled={disabled || pending} className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="field-label">Account name</span>
            <input name="accountName" className="field" defaultValue={settings.accountName ?? 'Ox Inov Pvt. Ltd.'} maxLength={120} />
          </label>
          <label className="grid gap-1">
            <span className="field-label">Bank</span>
            <input name="bankName" className="field" defaultValue={settings.bankName ?? ''} maxLength={120} />
          </label>
          <label className="grid gap-1">
            <span className="field-label">Account number</span>
            <input name="accountNumber" className="field" defaultValue={settings.accountNumber ?? ''} maxLength={60} />
          </label>
          <label className="grid gap-1">
            <span className="field-label">Payment reference prefix</span>
            <input name="referencePrefix" className="field" defaultValue={settings.referencePrefix} maxLength={7} pattern="[A-Z]{2,6}-" />
          </label>
          <label className="grid gap-1">
            <span className="field-label">Review time promised to learners</span>
            <input name="reviewTimeText" className="field" defaultValue={settings.reviewTimeText} maxLength={120} placeholder="Within 2 hours, 9 AM to 9 PM" />
          </label>
          <label className="grid gap-1">
            <span className="field-label">Payment help (WhatsApp or Viber)</span>
            <input name="helpContact" className="field" defaultValue={settings.helpContact ?? ''} maxLength={120} placeholder="WhatsApp +977 …" />
          </label>
        </fieldset>
      </SettingsSection>

      <SettingsSection
        id="prices"
        glyph="⧉"
        tone="tone-pink"
        title="Default plan prices"
        sub="Starting prices for new offerings"
        status={`${formatNpr(settings.defaultMonth1Minor)} – ${formatNpr(settings.defaultLifetimeMinor)}`}
        statusTone="tone-muted"
      >
        <fieldset disabled={disabled || pending} className="grid gap-3 sm:grid-cols-4">
          <label className="grid gap-1">
            <span className="field-label">1 month (NPR)</span>
            <input name="default-MONTH_1" className="field" inputMode="decimal" defaultValue={rupees(settings.defaultMonth1Minor)} />
          </label>
          <label className="grid gap-1">
            <span className="field-label">6 months (NPR)</span>
            <input name="default-MONTH_6" className="field" inputMode="decimal" defaultValue={rupees(settings.defaultMonth6Minor)} />
          </label>
          <label className="grid gap-1">
            <span className="field-label">1 year (NPR)</span>
            <input name="default-YEAR_1" className="field" inputMode="decimal" defaultValue={rupees(settings.defaultYear1Minor)} />
          </label>
          <label className="grid gap-1">
            <span className="field-label">Lifetime (NPR)</span>
            <input name="default-LIFETIME" className="field" inputMode="decimal" defaultValue={rupees(settings.defaultLifetimeMinor)} />
          </label>
        </fieldset>
        <p className="studio-sub">New offerings start with these prices; each offering can change its own. Existing offerings and open checkouts are not changed.</p>
      </SettingsSection>

      <SettingsSection
        id="policies"
        glyph="§"
        tone="tone-mid"
        title="Policies"
        sub="Refund or change policy, shown at checkout"
        status={settings.refundPolicy.trim() ? 'Set' : '⚠ Refund policy empty'}
        statusTone={settings.refundPolicy.trim() ? 'tone-success' : 'tone-warning'}
        open={!settings.refundPolicy.trim()}
      >
        <label className="grid gap-1">
          <span className="field-label">Refund or change policy</span>
          <textarea
            name="refundPolicy"
            className="field"
            rows={3}
            defaultValue={settings.refundPolicy}
            maxLength={4000}
            disabled={disabled || pending}
            placeholder="For example: within 3 days, if under 20% is watched, we change your plan to another offering."
          />
        </label>
      </SettingsSection>

      {!disabled ? (
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-primary font-studio" disabled={pending}>
            {pending ? 'Saving…' : 'Save settings'}
          </button>
          <span className="studio-sub">Saves payment details, default prices, and policies together.</span>
        </div>
      ) : null}
      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="notice">
          {state.ok}
        </p>
      ) : null}
    </form>
  );
}
