'use client';

import { useActionState } from 'react';
import type { FormState } from '@/app/actions';
import { saveExternalLink } from '@/app/teach-actions';
import type { DraftLesson } from '@/lib/edu-api.ts';

const SOURCE_LABEL = { YOUTUBE: 'YouTube video', GOOGLE_DRIVE: 'Google Drive file' } as const;

/**
 * The lesson's YouTube or Google Drive source (ADR-028 point 5). Learners never see the link: the player
 * shows it view-only, and only to people with access to this lesson.
 */
export function ExternalLinkForm({ hidden, lesson }: { hidden: Record<string, string>; lesson: DraftLesson }) {
  const [state, action, pending] = useActionState<FormState & { saved?: boolean }, FormData>(async (previous, form) => {
    const result = await saveExternalLink(previous, form);
    return { ...result, saved: !result.error };
  }, {});
  const document = lesson.kind === 'DOCUMENT';

  return (
    <section aria-labelledby="external-heading" className="card grid gap-3">
      <h2 id="external-heading" className="text-2xl">
        {document ? 'Google Drive file' : 'Or use a YouTube or Google Drive link'}
      </h2>
      <p className="text-sm text-muted">
        {document
          ? 'A PDF, slide deck, or document. In Google Drive choose Share › General access › Anyone with the link (Viewer), then Copy link.'
          : 'An unlisted YouTube video (Share › Copy link) or a video in Google Drive shared with "Anyone with the link". A link replaces an uploaded file.'}{' '}
        Learners watch inside Oxinov with their email shown over the player; the link is never shown to them.
      </p>
      {lesson.external ? (
        <p className="notice" role="status">
          Now showing: {SOURCE_LABEL[lesson.external.source]} ·{' '}
          <a href={lesson.external.url} target="_blank" rel="noreferrer noopener">
            open to check
          </a>
        </p>
      ) : null}
      <form action={action} className="grid gap-2">
        {Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <label htmlFor="externalUrl" className="field-label">
          {document ? 'Google Drive link' : 'YouTube or Google Drive link'}
        </label>
        <input
          id="externalUrl"
          name="externalUrl"
          type="url"
          inputMode="url"
          className="field"
          defaultValue={lesson.external?.url ?? ''}
          placeholder={document ? 'https://drive.google.com/file/d/…/view' : 'https://youtu.be/…'}
          maxLength={2000}
        />
        <p className="text-sm text-muted">Leave it empty and save to remove the link.</p>
        {state.error ? (
          <p role="alert" className="notice notice-error">
            {state.error}
          </p>
        ) : state.saved ? (
          <p role="status" className="notice">
            Saved to the draft.
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary justify-self-start" disabled={pending}>
          {pending ? 'Saving…' : 'Save link'}
        </button>
      </form>
    </section>
  );
}
