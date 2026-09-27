'use client';

import { useActionState, useState } from 'react';
import { createInvite, type CreateInviteState } from '@/app/invite-actions';
import { displayCode } from '@/lib/format.ts';

const ROLE_OPTIONS = [
  { value: 'LEARNER', label: 'Students (learners)' },
  { value: 'INSTRUCTOR', label: 'Teachers (instructors)' },
  { value: 'ADMIN', label: 'Administrators' },
];

export function CreateInviteForm({ slug, tenantId, appUrl, canInviteAdmins }: { slug: string; tenantId: string; appUrl: string; canInviteAdmins: boolean }) {
  const [state, action, pending] = useActionState<CreateInviteState, FormData>(createInvite, {});
  const [copied, setCopied] = useState(false);
  const link = state.created ? `${appUrl}/join?code=${displayCode(state.created.code)}` : '';

  return (
    <div className="grid gap-4">
      <form action={action} className="grid gap-4 sm:grid-cols-3 sm:items-end">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="tenantId" value={tenantId} />
        <div>
          <label htmlFor="role" className="field-label">
            Code for
          </label>
          <select id="role" name="role" className="field" defaultValue="LEARNER">
            {ROLE_OPTIONS.filter((option) => canInviteAdmins || option.value !== 'ADMIN').map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="expiresInDays" className="field-label">
            Works for
          </label>
          <select id="expiresInDays" name="expiresInDays" className="field" defaultValue="14">
            <option value="1">1 day</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
          </select>
        </div>
        <div>
          <label htmlFor="maxUses" className="field-label">
            People limit <span className="text-muted">(optional)</span>
          </label>
          <input id="maxUses" name="maxUses" type="number" min={1} max={1000} className="field" placeholder="No limit" />
        </div>
        <button type="submit" className="btn btn-primary justify-self-start" disabled={pending}>
          {pending ? 'Creating…' : 'Create join code'}
        </button>
      </form>
      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : null}
      {state.created ? (
        <div className="notice grid gap-2" role="status">
          <p>Share this code or link. Anyone with it can join as {state.created.role.toLowerCase()} until it expires.</p>
          <p className="font-display text-4xl tracking-widest">{displayCode(state.created.code)}</p>
          <div className="flex flex-wrap items-center gap-3">
            <code className="break-all text-sm">{link}</code>
            <button
              type="button"
              className="btn btn-secondary text-sm"
              onClick={() => {
                void navigator.clipboard?.writeText(link).then(() => setCopied(true));
              }}
            >
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
