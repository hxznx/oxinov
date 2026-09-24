'use client';

import { useActionState } from 'react';
import { enroll, type FormState } from '@/app/actions';

export function EnrollButton({ tenantId, courseId, returnTo, free }: { tenantId: string; courseId: string; returnTo: string; free: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(enroll, {});
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button type="submit" className="btn btn-primary justify-center" disabled={pending}>
        {pending ? 'Enrolling…' : free ? 'Enroll for free' : 'Buy course'}
      </button>
      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
