'use client';

import { useActionState } from 'react';
import type { FormState } from '@/app/actions';
import { sendNotice } from '@/app/notification-actions';

/** "Send a notice" (design screen 8): an in-app notice to every member of the workspace. */
export function NoticeForm({ slug, tenantId, offerings }: { slug: string; tenantId: string; offerings: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState<FormState & { sent?: number }, FormData>(sendNotice, {});
  return (
    <section aria-labelledby="notice-heading" className="studio-panel grid gap-3 p-5" style={{ borderColor: 'var(--ox-color-brand-2)' }}>
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
          <span className="field-label">To</span>
          <select name="courseId" className="field" defaultValue="">
            <option value="">Everyone in this workspace</option>
            {offerings.map((offering) => (
              <option key={offering.id} value={offering.id}>
                Learners of {offering.title}
              </option>
            ))}
          </select>
        </label>
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
        <p className="studio-sub">Recipients see it under Account › Notifications and on the bell. It is not emailed.</p>
        {state.error ? (
          <p role="alert" className="notice notice-error">
            {state.error}
          </p>
        ) : state.sent !== undefined ? (
          <p role="status" className="notice">
            Sent to {state.sent} {state.sent === 1 ? 'member' : 'members'}.
          </p>
        ) : null}
        <button type="submit" className="btn justify-self-start font-studio" style={{ background: 'var(--ox-color-brand-2)', color: 'var(--ox-color-on-neon)' }} disabled={pending}>
          {pending ? 'Sending…' : 'Send notice'}
        </button>
      </form>
    </section>
  );
}
