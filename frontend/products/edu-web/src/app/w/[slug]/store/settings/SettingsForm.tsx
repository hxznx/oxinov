'use client';

import { useActionState } from 'react';
import { saveStoreSettings, type StoreFormState } from '@/app/store-actions';
import type { StoreSettings } from '@/lib/store.ts';

const rupees = (minor: number) => String(minor / 100);

/** Payment details, review time, help contact, refund policy, and default plan prices (FR-MGMT-1408). */
export function SettingsForm({ slug, tenantId, settings, disabled }: { slug: string; tenantId: string; settings: StoreSettings; disabled: boolean }) {
  const [state, action, pending] = useActionState<StoreFormState, FormData>(saveStoreSettings, {});
  return (
    <form action={action} className="card grid gap-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <h2 className="text-2xl">Payment details</h2>
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
        <label className="grid gap-1 sm:col-span-2">
          <span className="field-label">Refund or change policy (shown at checkout)</span>
          <textarea name="refundPolicy" className="field" rows={3} defaultValue={settings.refundPolicy} maxLength={4000} />
        </label>
      </fieldset>
      <h2 className="text-2xl">Default plan prices (NPR)</h2>
      <p className="text-sm opacity-80">New courses start with these; each course can set its own on its Plans page.</p>
      <fieldset disabled={disabled || pending} className="grid gap-3 sm:grid-cols-4">
        <label className="grid gap-1">
          <span className="field-label">1 month</span>
          <input name="default-MONTH_1" className="field" inputMode="decimal" defaultValue={rupees(settings.defaultMonth1Minor)} />
        </label>
        <label className="grid gap-1">
          <span className="field-label">6 months</span>
          <input name="default-MONTH_6" className="field" inputMode="decimal" defaultValue={rupees(settings.defaultMonth6Minor)} />
        </label>
        <label className="grid gap-1">
          <span className="field-label">1 year</span>
          <input name="default-YEAR_1" className="field" inputMode="decimal" defaultValue={rupees(settings.defaultYear1Minor)} />
        </label>
        <label className="grid gap-1">
          <span className="field-label">Lifetime</span>
          <input name="default-LIFETIME" className="field" inputMode="decimal" defaultValue={rupees(settings.defaultLifetimeMinor)} />
        </label>
      </fieldset>
      {!disabled ? (
        <button type="submit" className="btn btn-primary justify-self-start" disabled={pending}>
          {pending ? 'Saving…' : 'Save settings'}
        </button>
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
