'use client';

import { useActionState } from 'react';
import type { FormState } from '@/app/actions';
import { changeMember } from '@/app/team-actions';
import type { TenantRole } from '@/lib/edu-api.ts';
import { ROLES, ROLE_NAMES } from '@/lib/team.ts';

/** Role and access of one member (design screen 22). The Edu API refuses changes the caller may not make. */
export function MemberControls({
  ids,
  name,
  role,
  status,
  locked,
}: {
  ids: { slug: string; tenantId: string; userId: string };
  name: string;
  role: TenantRole;
  status: string;
  /** The caller themself: shown, never editable. */
  locked: boolean;
}) {
  const [roleState, roleAction, rolePending] = useActionState<FormState & { saved?: boolean }, FormData>(changeMember, {});
  const [accessState, accessAction, accessPending] = useActionState<FormState & { saved?: boolean }, FormData>(changeMember, {});
  const hidden = Object.entries(ids).map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />);
  if (locked) return <span className="studio-status tone-muted">{ROLE_NAMES[role]} · you</span>;
  const error = roleState.error ?? accessState.error;

  return (
    <div className="grid gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <form action={roleAction} className="flex items-center gap-2">
          {hidden}
          <label className="sr-only" htmlFor={`role-${ids.userId}`}>
            Role of {name}
          </label>
          <select id={`role-${ids.userId}`} name="role" defaultValue={role} className="field w-auto py-1.5 text-sm" disabled={rolePending}>
            {ROLES.map((value) => (
              <option key={value} value={value}>
                {ROLE_NAMES[value]}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-secondary px-3 py-1.5 text-sm" disabled={rolePending}>
            {rolePending ? 'Saving…' : 'Save'}
          </button>
        </form>
        <form action={accessAction}>
          {hidden}
          <input type="hidden" name="status" value={status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'} />
          <button type="submit" className={`btn px-3 py-1.5 text-sm ${status === 'ACTIVE' ? 'btn-reject' : 'btn-secondary'}`} disabled={accessPending}>
            {status === 'ACTIVE' ? 'Suspend' : 'Restore'}
          </button>
        </form>
      </div>
      <span role="status" className={`studio-status ${error ? 'tone-danger' : 'tone-success'}`}>
        {error ?? (roleState.saved || accessState.saved ? 'Saved' : '')}
      </span>
    </div>
  );
}
