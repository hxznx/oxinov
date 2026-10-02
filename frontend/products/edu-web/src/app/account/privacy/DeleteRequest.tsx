'use client';

import { useState } from 'react';

/**
 * Account deletion request (FR-AUTH-104, FR-PRIV-3202). Nothing happens until the learner types DELETE;
 * the request then goes to Oxinov support by email, because deletion must reach every Oxinov product and
 * the sign-in service, and payment records are kept as the law requires.
 */
export function DeleteRequest({ email, support }: { email: string; support: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const confirmed = typed.trim() === 'DELETE';
  const body = encodeURIComponent(
    `Please delete my Oxinov account.\n\nAccount email: ${email}\n\nI understand this removes my profile, progress, notes, and certificates, ends access to every course including lifetime plans, and cannot be undone. Payment records are kept as the law requires.`,
  );
  const href = `mailto:${support}?subject=${encodeURIComponent('Delete my Oxinov account')}&body=${body}`;

  return (
    <section aria-labelledby="delete-heading" className="studio-panel grid gap-3 border-[var(--ox-color-danger)] p-5" style={{ borderColor: 'var(--ox-color-danger)' }}>
      <span className="studio-status tone-danger">// Danger zone</span>
      <h2 id="delete-heading" className="studio-h2">
        Delete my Oxinov account
      </h2>
      <p className="text-sm text-muted">
        This removes your profile, progress, notes, and certificates, and ends access to every course, including lifetime plans. Payment records are kept as the law requires. You
        can&apos;t undo this. Ask for a copy of your data first if you want one.
      </p>
      {open ? (
        <>
          <label htmlFor="confirm-delete" className="field-label">
            Type DELETE to confirm
          </label>
          <input id="confirm-delete" className="field text-hud" value={typed} onChange={(event) => setTyped(event.target.value)} placeholder="DELETE" autoComplete="off" />
          <div className="flex flex-wrap gap-2">
            {confirmed ? (
              <a href={href} className="btn btn-reject font-studio">
                Send the deletion request
              </a>
            ) : (
              <button type="button" className="btn btn-reject font-studio opacity-60" disabled>
                Send the deletion request
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setOpen(false);
                setTyped('');
              }}
            >
              Cancel
            </button>
          </div>
          <p className="text-sm text-muted">
            Your email app opens with the request to {support}. We confirm it by email from that address before anything is deleted.
          </p>
        </>
      ) : (
        <button type="button" className="btn btn-reject justify-self-start font-studio" onClick={() => setOpen(true)}>
          Delete my account…
        </button>
      )}
    </section>
  );
}
