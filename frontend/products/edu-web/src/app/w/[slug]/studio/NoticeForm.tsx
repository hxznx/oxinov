'use client';

import { useActionState } from 'react';
import type { FormState } from '@/app/actions';
import { sendNotice } from '@/app/notification-actions';

/** "Send a notice" (design screen 8): an in-app notice to every member of the workspace. */
export function NoticeForm({ slug, tenantId }: { slug: string; tenantId: string }) {
  const [state, action, pending] = useActionState<FormState & { sent?: number }, FormData>(sendNotice, {});
  return (
    <section aria-labelledby="notice-heading" className="studio-panel grid gap-3 p-5" style={{ borderColor: 'var(--ox-color-brand2)' }}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="notice-heading" className="studio-h2">
          Send a notice
        </h2>
        <span className="studio-status tone-pink">Broadcast · in-app</span>
      </div>
      <form action={action} className="grid gap-3">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="tenantId" value={tenantId} />
        <label className="grid gap-1">
          <span className="field-label">Title</span>
          <input name="title" className="field" maxLength={200} required placeholder="Dashain holiday schedule" />
        </label>
        <label className="grid gap-1">
          <span className="field-label">Message</span>
          <textarea name="body" className="field" rows={3} maxLength={2000} required placeholder="Plain English. Learners can translate it in their browser." />
        </label>
        <label className="grid gap-1">
          <span className="field-label">Link to a page on Oxinov Edu (optional)</span>
          <input name="linkPath" className="field" maxLength={500} placeholder="/o/japanese-n5" />
        </label>
        <p className="studio-sub">Every member of this workspace sees it under Account › Notifications. It is not emailed.</p>
        {state.error ? (
          <p role="alert" className="notice notice-error">
            {state.error}
          </p>
        ) : state.sent !== undefined ? (
          <p role="status" className="notice">
            Sent to {state.sent} {state.sent === 1 ? 'member' : 'members'}.
          </p>
        ) : null}
        <button type="submit" className="btn justify-self-start font-studio" style={{ background: 'var(--ox-color-brand2)', color: 'var(--ox-color-on-neon)' }} disabled={pending}>
          {pending ? 'Sending…' : 'Send notice'}
        </button>
      </form>
    </section>
  );
}
