'use client';

import { useActionState } from 'react';
import { pasteLinks, type PasteState } from '@/app/teach-actions';

/**
 * Paste many YouTube or Google Drive links at once (FR-COURSE-209): one per line, with an optional title;
 * they become lessons at the end of this chapter, in order. Refused lines are listed with their reason.
 */
export function PasteLinksForm({ hidden, sectionId, sectionTitle }: { hidden: Record<string, string>; sectionId: string; sectionTitle: string }) {
  const [state, action, pending] = useActionState<PasteState, FormData>(pasteLinks, {});
  const id = (name: string) => `${name}-${sectionId}`;
  return (
    <details className="border border-line p-3" open={Boolean(state.refused?.length || state.error)}>
      <summary className="cursor-pointer text-sm font-semibold">Paste many links at once</summary>
      <form action={action} className="mt-3 grid gap-2">
        {Object.entries({ ...hidden, sectionId }).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <label htmlFor={id('links')} className="field-label">
          YouTube or Google Drive links for {sectionTitle}, one per line
        </label>
        <textarea
          id={id('links')}
          name="text"
          rows={6}
          className="field font-mono text-sm"
          maxLength={30_000}
          required
          placeholder={'Hiragana part 1 https://youtu.be/…\nHiragana part 2 https://youtu.be/…\nWorkbook https://drive.google.com/file/d/…/view'}
        />
        <p className="text-sm text-muted">Text before or after a link becomes the lesson title. You can paste two columns straight from a spreadsheet. Up to 100 links.</p>
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span>Google Drive links are</span>
          <select name="driveKind" className="field w-auto py-1.5 text-sm" defaultValue="DOCUMENT">
            <option value="DOCUMENT">documents (PDF, slides)</option>
            <option value="VIDEO">videos</option>
          </select>
        </label>
        {state.error ? (
          <p role="alert" className="notice notice-error">
            {state.error}
          </p>
        ) : null}
        {state.created !== undefined ? (
          <div role="status" className="notice grid gap-1">
            <span>
              Added {state.created} {state.created === 1 ? 'lesson' : 'lessons'}.
              {state.created > 0 ? ' Video lessons still need a short transcript or text version before review.' : ''}
            </span>
            {state.refused && state.refused.length > 0 ? (
              <ul className="grid gap-0.5 text-sm">
                {state.refused.map((line) => (
                  <li key={line.line} className="tone-warning">
                    Line {line.line} not added: {line.reason} <span className="text-muted break-all">({line.text})</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        <button type="submit" className="btn btn-secondary justify-self-start" disabled={pending}>
          {pending ? 'Adding…' : 'Add these lessons'}
        </button>
      </form>
    </details>
  );
}
