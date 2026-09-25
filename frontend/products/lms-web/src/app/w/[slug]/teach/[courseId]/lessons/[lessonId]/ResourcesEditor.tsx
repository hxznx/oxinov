'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { addLinkResource, finishResourceUpload, removeResource, renameResource, startResourceUpload } from '@/app/resource-actions';
import { formatBytes } from '@/lib/assignment.ts';
import type { DraftLesson } from '@/lib/edu-api.ts';
import { MAX_RESOURCE_MB, RESOURCE_ACCEPT, resourceContentType, resourceLabel, titleFromFileName } from '@/lib/resources.ts';

type Ids = { slug: string; tenantId: string; courseId: string; lessonId: string };

function put(url: string, headers: Record<string, string>, file: File, onProgress: (ratio: number) => void): Promise<number> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', url);
    Object.entries(headers).forEach(([name, value]) => request.setRequestHeader(name, value));
    request.upload.onprogress = (event) => event.lengthComputable && onProgress(event.loaded / event.total);
    request.onload = () => resolve(request.status);
    request.onerror = () => reject(new Error('network'));
    request.send(file);
  });
}

/** Books, handouts, and links for one draft lesson (FR-COURSE-202). */
export function ResourcesEditor({ ids, resources }: { ids: Ids; resources: DraftLesson['resources'] }) {
  const router = useRouter();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [pending, start] = useTransition();

  const after = (result: { ok: boolean; error?: string }) => {
    if (!result.ok) return setError(result.error ?? 'Something went wrong.');
    setError(null);
    router.refresh();
  };

  async function upload(file: File) {
    const contentType = resourceContentType(file);
    if (!contentType) return setError('Attach a PDF, EPUB, Word, PowerPoint, Excel, image, text, or ZIP file.');
    if (file.size > MAX_RESOURCE_MB * 1024 * 1024) return setError(`The file is larger than ${MAX_RESOURCE_MB} MB.`);
    setError(null);
    setProgress(0);
    const ticket = await startResourceUpload(ids, { fileName: file.name, contentType, sizeBytes: file.size });
    if (!ticket.ok) {
      setProgress(null);
      return setError(ticket.error);
    }
    try {
      const status = await put(ticket.value.uploadUrl, ticket.value.headers, file, setProgress);
      if (status < 200 || status >= 300) throw new Error(String(status));
    } catch {
      setProgress(null);
      return setError('The upload was interrupted. Check your connection and try again.');
    }
    const done = await finishResourceUpload(ids, ticket.value.fileId, titleFromFileName(file.name));
    setProgress(null);
    after(done);
  }

  return (
    <section aria-labelledby="resources-heading" className="card grid gap-4">
      <h2 id="resources-heading" className="text-2xl">
        Books and resources
      </h2>
      <p className="text-sm text-muted">Enrolled learners see these under the lesson. Free previews never show them.</p>

      {resources.length > 0 ? (
        <ul className="grid gap-2">
          {resources.map((resource) => (
            <li key={resource.id} className="flex flex-wrap items-center gap-2 border border-line p-2">
              <span className="hud-label">{resource.kind === 'LINK' ? 'Link' : resourceLabel(resource.file?.contentType ?? '')}</span>
              <label htmlFor={`resource-${resource.id}`} className="sr-only">
                Title
              </label>
              <input
                id={`resource-${resource.id}`}
                className="field min-w-40 flex-1"
                defaultValue={resource.title}
                maxLength={200}
                onBlur={(event) => {
                  const title = event.target.value.trim();
                  if (title && title !== resource.title) start(async () => after(await renameResource(ids, resource.id, title)));
                }}
              />
              <span className="text-sm text-muted">{resource.file ? formatBytes(resource.file.sizeBytes) : resource.url}</span>
              <button type="button" className="btn btn-secondary text-sm" disabled={pending} onClick={() => start(async () => after(await removeResource(ids, resource.id)))}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">No resources yet.</p>
      )}

      <div className="grid gap-2">
        <label className="btn btn-secondary justify-self-start" aria-disabled={progress !== null}>
          Upload a book or file
          <input
            type="file"
            className="sr-only"
            accept={RESOURCE_ACCEPT}
            disabled={progress !== null}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void upload(file);
            }}
          />
        </label>
        <p className="text-sm text-muted">PDF, EPUB, Word, PowerPoint, Excel, images, text, or ZIP, up to {MAX_RESOURCE_MB} MB.</p>
        {progress !== null ? (
          <div role="status" aria-live="polite" className="grid gap-1">
            <span className="text-sm">{progress < 1 ? `Uploading… ${Math.round(progress * 100)}%` : 'Checking the file…'}</span>
            <progress max={1} value={progress} className="w-full" />
          </div>
        ) : null}
      </div>

      <form
        className="grid gap-2 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          start(async () => {
            const result = await addLinkResource(ids, linkTitle, linkUrl);
            if (result.ok) {
              setLinkTitle('');
              setLinkUrl('');
            }
            after(result);
          });
        }}
      >
        <div>
          <label htmlFor="link-title" className="field-label">
            Link title
          </label>
          <input id="link-title" className="field" value={linkTitle} maxLength={200} onChange={(event) => setLinkTitle(event.target.value)} placeholder="NHK Easy Japanese" />
        </div>
        <div>
          <label htmlFor="link-url" className="field-label">
            Address
          </label>
          <input id="link-url" type="url" className="field" value={linkUrl} maxLength={2000} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://" />
        </div>
        <button type="submit" className="btn btn-secondary" disabled={pending || !linkUrl.trim()}>
          Add link
        </button>
      </form>

      {error ? (
        <p role="alert" className="notice notice-error">
          {error}
        </p>
      ) : null}
    </section>
  );
}
