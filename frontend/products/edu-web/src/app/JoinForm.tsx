'use client';

import { useActionState } from 'react';
import type { FormState } from './actions';
import { joinWithCode } from './invite-actions';

export function JoinForm({ initialCode = '' }: { initialCode?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(joinWithCode, {});
  return (
    <form action={action} className="mt-4 grid gap-4" noValidate>
      <div>
        <label htmlFor="code" className="field-label">
          Join code
        </label>
        <input
          id="code"
          name="code"
          className="field font-display text-xl tracking-widest uppercase"
          defaultValue={initialCode}
          placeholder="K7PX-9QMD"
          maxLength={20}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          required
        />
      </div>
      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary justify-self-start" disabled={pending}>
        {pending ? 'Joining…' : 'Join'}
      </button>
    </form>
  );
}
