'use client';

import { useActionState } from 'react';
import type { FormState } from '@/app/actions';
import { reuseUpload } from '@/app/teach-actions';

/**
 * Reuse a file already uploaded to this workspace (FR-COURSE-210), so the same recording is not uploaded
 * twice. Only ready files of the lesson's kind are offered.
 */
export function LibraryPicker({ hidden, kind, uploads, currentId }: { hidden: Record<string, string>; kind: 'VIDEO' | 'AUDIO'; uploads: { id: string; fileName: string; uses: number }[]; currentId: string | null }) {
  const [state, action, pending] = useActionState<FormState & { saved?: boolean }, FormData>(async (previous, form) => {
    const result = await reuseUpload(previous, form);
    return { ...result, saved: !result.error };
  }, {});
  const choices = uploads.filter((upload) => upload.id !== currentId);
  if (choices.length === 0) return null;

  return (
    <section aria-labelledby="library-heading" className="card grid gap-3">
      <h2 id="library-heading" className="text-2xl">
        Or reuse an earlier upload
      </h2>
      <p className="text-sm text-muted">{kind === 'VIDEO' ? 'Videos' : 'Recordings'} already uploaded to this workspace. Learners keep their progress on a file across lessons.</p>
      <form action={action} className="grid gap-2">
        {Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <label htmlFor="library-media" className="field-label">
          File
        </label>
        <select id="library-media" name="mediaId" className="field" required defaultValue="">
          <option value="" disabled>
            Choose…
          </option>
          {choices.map((upload) => (
            <option key={upload.id} value={upload.id}>
              {upload.fileName} {upload.uses > 0 ? `(used in ${upload.uses} ${upload.uses === 1 ? 'lesson' : 'lessons'})` : '(not used yet)'}
            </option>
          ))}
        </select>
        {state.error ? (
          <p role="alert" className="notice notice-error">
            {state.error}
          </p>
        ) : state.saved ? (
          <p role="status" className="notice">
            Saved to the draft.
          </p>
        ) : null}
        <button type="submit" className="btn btn-secondary justify-self-start" disabled={pending}>
          {pending ? 'Saving…' : 'Use this file'}
        </button>
      </form>
    </section>
  );
}
