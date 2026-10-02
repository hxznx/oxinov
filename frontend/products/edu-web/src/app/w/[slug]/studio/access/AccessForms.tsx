'use client';

import { useActionState } from 'react';
import type { FormState } from '@/app/actions';
import { giveAccess, revokeAccess } from '@/app/grant-actions';

const LENGTHS = [
  ['DAYS_7', '7 days'],
  ['MONTH_1', '1 month'],
  ['MONTH_6', '6 months'],
  ['YEAR_1', '1 year'],
  ['LIFETIME', 'Lifetime'],
] as const;

/** "Give free access" (design screen 8): a member, an offering, a length, and a reason for the audit log. */
export function GiveAccessForm({ slug, tenantId, offerings }: { slug: string; tenantId: string; offerings: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState<FormState & { saved?: string }, FormData>(giveAccess, {});
  return (
    <form action={action} className="studio-panel grid gap-3 p-5">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="studio-h2">Give free access</h2>
        <span className="studio-status tone-success">Scholarship · gift · partner</span>
      </div>
      <label className="grid gap-1">
        <span className="field-label">Learner email</span>
        <input name="email" type="email" className="field" required placeholder="learner@example.com" autoComplete="off" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="field-label">Offering</span>
          <select name="courseId" className="field" required defaultValue="">
            <option value="" disabled>
              Choose…
            </option>
            {offerings.map((offering) => (
              <option key={offering.id} value={offering.id}>
                {offering.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="field-label">Length</span>
          <select name="length" className="field" defaultValue="MONTH_1">
            {LENGTHS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-1">
        <span className="field-label">Reason (kept in the audit log)</span>
        <input name="reason" className="field" required maxLength={500} placeholder="For example: scholarship, competition prize, partner school" />
      </label>
      <p className="studio-sub">The learner must already have joined this workspace (signed in once). Free access starts after any access they already have, and they get a notification.</p>
      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : state.saved ? (
        <p role="status" className="notice">
          {state.saved}
        </p>
      ) : null}
      <button type="submit" className="btn btn-approve justify-self-start font-studio" disabled={pending}>
        {pending ? 'Giving…' : 'Give access'}
      </button>
    </form>
  );
}

/** Ends one free grant, with a reason. */
export function RevokeForm({ slug, tenantId, grantId }: { slug: string; tenantId: string; grantId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(revokeAccess, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="grantId" value={grantId} />
      <label className="sr-only" htmlFor={`revoke-${grantId}`}>
        Reason for ending this access
      </label>
      <input id={`revoke-${grantId}`} name="reason" className="field w-40 py-1.5 text-sm" placeholder="Reason" maxLength={500} required />
      <button type="submit" className="btn btn-reject px-3 py-1.5 text-sm" disabled={pending}>
        End access
      </button>
      {state.error ? <span className="studio-status tone-danger">{state.error}</span> : null}
    </form>
  );
}
