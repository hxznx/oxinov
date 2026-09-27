'use client';

import { useActionState, useState } from 'react';
import { suggestSlug } from '@/lib/format.ts';
import { createWorkspace, type FormState } from './actions';

export function CreateWorkspaceForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createWorkspace, {});
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);

  return (
    <form action={action} className="mt-4 grid gap-4" noValidate>
      <div>
        <label htmlFor="name" className="field-label">
          School or centre name
        </label>
        <input
          id="name"
          name="name"
          className="field"
          maxLength={120}
          required
          onChange={(event) => {
            if (!slugEdited) setSlug(suggestSlug(event.target.value));
          }}
        />
      </div>
      <div>
        <label htmlFor="slug" className="field-label">
          Address
        </label>
        <input
          id="slug"
          name="slug"
          className="field"
          value={slug}
          maxLength={63}
          pattern="[a-z0-9][a-z0-9-]{1,61}[a-z0-9]"
          aria-describedby="slug-help"
          required
          onChange={(event) => {
            setSlugEdited(true);
            setSlug(event.target.value.toLowerCase());
          }}
        />
        <p id="slug-help" className="mt-1 text-sm text-muted">
          Lowercase letters, digits, and hyphens. It appears in your space&apos;s web address.
        </p>
      </div>
      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary justify-self-start" disabled={pending}>
        {pending ? 'Creating…' : 'Create learning space'}
      </button>
    </form>
  );
}
