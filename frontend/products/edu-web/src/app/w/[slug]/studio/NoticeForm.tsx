'use client';

import { useActionState } from 'react';
import type { FormState } from '@/app/actions';
import { sendNotice } from '@/app/notification-actions';
import type { EmailAllowance } from '@/lib/edu-api.ts';

/**
 * "Send a notice" (design screen 8): an in-app notice to the workspace's members and, in the store, also by
 * email within today's allowance (FR-COMM-705), which is shown before sending.
 */
export function NoticeForm({ slug, tenantId, offerings, allowance }: { slug: string; tenantId: string; offerings: { id: string; title: string }[]; allowance: EmailAllowance | null }) {
  const [state, action, pending] = useActionState<FormState & { sent?: number; emailedNow?: number; emailWaiting?: number }, FormData>(sendNotice, {});
  return (
    <section aria-labelledby="notice-heading" className="studio-panel grid gap-3 p-5" style={{ borderColor: 'var(--ox-color-brand-2)' }}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="notice-heading" className="studio-h2">
          Send a notice
        </h2>
        <span className="studio-status tone-pink">Broadcast · in-app{allowance?.emailAvailable ? ' · email' : ''}</span>
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
        {allowance?.emailAvailable ? (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="email" className="mt-1" />
            <span>
              Also send it by email.{' '}
              <span className="studio-sub">
                Today {allowance.remaining} of {allowance.limit} notice emails are left. Beyond that, learners get it in-app now and by email tomorrow; sign-in codes and
                payment emails never wait.
              </span>
            </span>
          </label>
        ) : null}
        <p className="studio-sub">Recipients see it under Account › Notifications and on the bell{allowance?.emailAvailable ? '' : '. It is not emailed'}.</p>
        {state.error ? (
          <p role="alert" className="notice notice-error">
            {state.error}
          </p>
        ) : state.sent !== undefined ? (
          <p role="status" className="notice">
            Sent to {state.sent} {state.sent === 1 ? 'member' : 'members'}.
            {state.emailedNow || state.emailWaiting ? ` Emailed now: ${state.emailedNow ?? 0}${state.emailWaiting ? `; ${state.emailWaiting} by email tomorrow` : ''}.` : ''}
          </p>
        ) : null}
        <button type="submit" className="btn justify-self-start font-studio" style={{ background: 'var(--ox-color-brand-2)', color: 'var(--ox-color-on-neon)' }} disabled={pending}>
          {pending ? 'Sending…' : 'Send notice'}
        </button>
      </form>
    </section>
  );
}
