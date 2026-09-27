'use client';

import { useActionState } from 'react';
import { revokeCertificate, type FormState } from '@/app/actions';

/** Print (save as PDF from the browser's print dialog) and copy the verification link. */
export function PrintButton() {
  return (
    <button type="button" className="btn btn-primary" onClick={() => window.print()}>
      Print or save as PDF
    </button>
  );
}

export function CopyLinkButton({ url }: { url: string }) {
  return (
    <button
      type="button"
      className="btn btn-secondary"
      onClick={() => {
        void navigator.clipboard?.writeText(url);
      }}
    >
      Copy verification link
    </button>
  );
}

/** FR-CERT-602: administrators revoke with a reason; the verification page shows it at once. */
export function RevokeForm({ tenantId, code, returnTo }: { tenantId: string; code: string; returnTo: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(revokeCertificate, {});
  return (
    <form action={action} className="card grid gap-3">
      <h2 className="text-xl">Revoke this certificate</h2>
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <label htmlFor="revoke-reason" className="field-label">
        Reason (kept in the school&apos;s records; not shown publicly)
      </label>
      <input id="revoke-reason" name="reason" required minLength={3} maxLength={500} className="field" />
      <button type="submit" className="btn btn-secondary" disabled={pending}>
        {pending ? 'Revoking…' : 'Revoke certificate'}
      </button>
      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
