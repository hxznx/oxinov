'use client';

import { useActionState, useEffect, useRef } from 'react';
import type { FormState } from '@/app/actions';
import { replySupport } from '@/app/message-actions';

/** An administrator's reply to a learner (FR-CHAT-1301); the learner is notified. */
export function ReplyForm({ slug, tenantId, threadId }: { slug: string; tenantId: string; threadId: string }) {
  const [state, action, pending] = useActionState<FormState & { sent?: number }, FormData>(replySupport, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.sent) form.current?.reset();
  }, [state.sent]);

  return (
    <form ref={form} action={action} className="msg-compose">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="threadId" value={threadId} />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <label htmlFor="reply-body" className="sr-only">
          Reply
        </label>
        <textarea id="reply-body" name="body" rows={3} className="field resize-none" maxLength={4000} required placeholder="Write a reply…" />
        <button type="submit" className="btn btn-primary font-studio" disabled={pending}>
          {pending ? 'Sending…' : 'Reply ›'}
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm tone-danger">
          {state.error}
        </p>
      ) : null}
      <p className="text-xs text-muted">The learner sees this as &quot;Oxinov support&quot; and gets a notification.</p>
    </form>
  );
}
