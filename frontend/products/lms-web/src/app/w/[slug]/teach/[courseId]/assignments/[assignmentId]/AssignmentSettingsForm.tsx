'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import type { FormState } from '@/app/actions';
import { saveAssignment } from '@/app/assignment-actions';
import type { Assignment } from '@/lib/edu-api.ts';

/** `YYYY-MM-DDTHH:mm` in the browser's local time, as a datetime-local input expects. */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AssignmentSettingsForm({ hidden, assignment }: { hidden: Record<string, string>; assignment: Assignment }) {
  const router = useRouter();
  const pathname = usePathname();
  // Local time exists only in the browser: until it is known (null), keep sending the stored deadline.
  const [due, setDue] = useState<string | null>(null);
  useEffect(() => setDue(toLocalInput(assignment.dueAt)), [assignment.dueAt]);
  const [state, action, pending] = useActionState<FormState & { saved?: boolean }, FormData>(async (previous, form) => {
    const result = await saveAssignment(previous, form);
    if (result.saved && window.location.search) router.replace(pathname, { scroll: false });
    return result;
  }, {});

  return (
    <form action={action} className="grid gap-4" noValidate>
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {/* The deadline is entered in the teacher's local time and sent as an exact moment. */}
      <input type="hidden" name="dueAt" value={due === null ? (assignment.dueAt ?? '') : due ? new Date(due).toISOString() : ''} />
      <div>
        <label htmlFor="title" className="field-label">
          Title
        </label>
        <input id="title" name="title" className="field" defaultValue={assignment.title} maxLength={200} required />
      </div>
      <div>
        <label htmlFor="instructions" className="field-label">
          Instructions <span className="text-muted">(Markdown: headings, lists, tables, links)</span>
        </label>
        <textarea id="instructions" name="instructions" className="field min-h-40" defaultValue={assignment.instructions} maxLength={20000} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="due" className="field-label">
            Due <span className="text-muted">(your local time)</span>
          </label>
          <input id="due" type="datetime-local" className="field" value={due ?? ''} onChange={(event) => setDue(event.target.value)} />
        </div>
        <div>
          <label htmlFor="maxPoints" className="field-label">
            Points <span className="text-muted">(empty = pass or not)</span>
          </label>
          <input id="maxPoints" name="maxPoints" type="number" min={1} max={1000} className="field" defaultValue={assignment.maxPoints ?? ''} />
        </div>
        <div>
          <label htmlFor="maxFileMb" className="field-label">
            Largest file (MB)
          </label>
          <input id="maxFileMb" name="maxFileMb" type="number" min={1} max={100} className="field" defaultValue={assignment.maxFileMb} />
        </div>
      </div>
      <fieldset className="grid gap-2">
        <legend className="field-label">Learners can hand in</legend>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="acceptText" defaultChecked={assignment.acceptText} /> A written answer
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="acceptFile" defaultChecked={assignment.acceptFile} /> A file (PDF, Word, image, audio…)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="acceptUrl" defaultChecked={assignment.acceptUrl} /> A link
        </label>
      </fieldset>
      <div className="grid gap-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="allowLate" defaultChecked={assignment.allowLate} /> Accept late work (marked as late)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isRequired" defaultChecked={assignment.isRequired} /> Required to complete the course
        </label>
      </div>
      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : state.saved ? (
        <p role="status" className="notice">
          Saved.
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary justify-self-start" disabled={pending}>
        {pending ? 'Saving…' : 'Save assignment'}
      </button>
    </form>
  );
}
