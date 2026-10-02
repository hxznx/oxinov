'use client';

import { useActionState, useEffect, useRef } from 'react';
import type { FormState } from '@/app/actions';
import { sendSupport } from '@/app/message-actions';

/** The learner's message box to Oxinov support (FR-CHAT-1301). */
export function SupportCompose({ tenantId }: { tenantId: string }) {
  const [state, action, pending] = useActionState<FormState & { sent?: number }, FormData>(sendSupport, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.sent) form.current?.reset();
  }, [state.sent]);

  return (
    <form ref={form} action={action} className="msg-compose">
      <input type="hidden" name="tenantId" value={tenantId} />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <label htmlFor="support-body" className="sr-only">
          Message to Oxinov support
        </label>
        <textarea id="support-body" name="body" rows={2} className="field resize-none" maxLength={4000} required placeholder="Write a message…" />
        <button type="submit" className="btn btn-primary font-studio" disabled={pending}>
          {pending ? 'Sending…' : 'Send ›'}
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm tone-danger">
          {state.error}
        </p>
      ) : null}
      <p className="text-xs text-muted">Messages are private between you and Oxinov. We usually reply within a day; you get a notification when we do.</p>
    </form>
  );
}
