'use client';

import { useActionState, useState } from 'react';
import type { FormState } from '@/app/actions';
import { cancelDeletion, requestDeletion } from '@/app/account-actions';

/**
 * Account deletion (FR-AUTH-104, FR-PRIV-3202). Nothing starts until the learner types DELETE; the account
 * is then deleted after 14 days, and they can cancel until that date. Payment records are kept as the law
 * requires, without their name.
 */
export function DeleteRequest({ deleteAfter, deletionDay }: { deleteAfter: string | null; deletionDay: string | null }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [requestState, request, requesting] = useActionState<FormState, FormData>(requestDeletion, {});
  const [cancelState, cancel, cancelling] = useActionState<FormState, FormData>(cancelDeletion, {});

  if (deleteAfter) {
    return (
      <section aria-labelledby="delete-heading" className="studio-panel grid gap-3 p-5" style={{ borderColor: 'var(--ox-color-danger)' }}>
        <span className="studio-status tone-danger">// Deletion scheduled</span>
        <h2 id="delete-heading" className="studio-h2">
          Your account will be deleted on {deletionDay}
        </h2>
        <p className="text-sm text-muted">Everything keeps working until then. Changed your mind? Cancel and nothing is removed.</p>
        <form action={cancel} className="flex flex-wrap items-center gap-2">
          <button type="submit" className="btn btn-primary font-studio" disabled={cancelling}>
            {cancelling ? 'Cancelling…' : 'Cancel the deletion'}
          </button>
          {cancelState.error ? (
            <span role="alert" className="text-sm tone-danger">
              {cancelState.error}
            </span>
          ) : null}
        </form>
      </section>
    );
  }

  return (
    <section aria-labelledby="delete-heading" className="studio-panel grid gap-3 p-5" style={{ borderColor: 'var(--ox-color-danger)' }}>
      <span className="studio-status tone-danger">// Danger zone</span>
      <h2 id="delete-heading" className="studio-h2">
        Delete my Oxinov Edu account
      </h2>
      <p className="text-sm text-muted">
        This removes your name, email, notes, reviews, notifications, progress, and certificates, and ends access to every course, including lifetime plans. Payment
        records are kept, without your name, as the law requires. We wait 14 days before deleting, and you can cancel until then. Download a copy of your data first if
        you want one.
      </p>
      {open ? (
        <form action={request} className="grid gap-3">
          <label htmlFor="confirm-delete" className="field-label">
            Type DELETE to confirm
          </label>
          <input id="confirm-delete" name="confirm" className="field text-hud" value={typed} onChange={(event) => setTyped(event.target.value)} placeholder="DELETE" autoComplete="off" />
          {requestState.error ? (
            <p role="alert" className="notice notice-error">
              {requestState.error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn btn-reject font-studio" disabled={typed.trim() !== 'DELETE' || requesting}>
              {requesting ? 'Scheduling…' : 'Delete my account in 14 days'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setOpen(false);
                setTyped('');
              }}
            >
              Keep my account
            </button>
          </div>
          <p className="text-sm text-muted">We email you the deletion date and a link to cancel.</p>
        </form>
      ) : (
        <button type="button" className="btn btn-reject justify-self-start font-studio" onClick={() => setOpen(true)}>
          Delete my account…
        </button>
      )}
    </section>
  );
}
