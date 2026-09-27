'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useState } from 'react';
import type { FormState } from '@/app/actions';
import { finishMyUpload, removeMyFile, saveMyDraft, startMyUpload } from '@/app/assignment-actions';
import { formatBytes, SUBMISSION_ACCEPT, submissionContentType } from '@/lib/assignment.ts';
import type { MySubmission } from '@/lib/edu-api.ts';

type Ids = { slug: string; tenantId: string; courseId: string; assignmentId: string };

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

/** The learner's draft: text, link, and file, saved as a draft or submitted to the teacher (FR-ASSESS-503). */
export function MyWork({ ids, mine }: { ids: Ids; mine: MySubmission }) {
  const router = useRouter();
  const { assignment, draft } = mine;
  const [state, action, pending] = useActionState<FormState & { saved?: boolean }, FormData>(saveMyDraft, {});
  const [upload, setUpload] = useState<{ busy: boolean; progress: number; error?: string }>({ busy: false, progress: 0 });

  async function uploadFile(file: File) {
    const contentType = submissionContentType(file);
    if (!contentType) return setUpload({ busy: false, progress: 0, error: 'Upload a PDF, Word, PowerPoint, Excel, image, text, ZIP, or audio file.' });
    if (file.size > assignment.maxFileMb * 1024 * 1024) return setUpload({ busy: false, progress: 0, error: `The file is larger than ${assignment.maxFileMb} MB.` });
    setUpload({ busy: true, progress: 0 });
    const started = await startMyUpload({ ...ids, fileName: file.name, contentType, sizeBytes: file.size });
    if (!started.ok) return setUpload({ busy: false, progress: 0, error: started.error });
    let status: number;
    try {
      status = await put(started.ticket.uploadUrl, started.ticket.headers, file, (progress) => setUpload((s) => ({ ...s, progress })));
    } catch {
      return setUpload({ busy: false, progress: 0, error: 'The upload was interrupted. Check your connection and try again.' });
    }
    if (status < 200 || status >= 300) return setUpload({ busy: false, progress: 0, error: `The upload failed (${status}). Try again.` });
    const finished = await finishMyUpload(ids);
    if (!finished.ok) return setUpload({ busy: false, progress: 0, error: finished.error });
    setUpload({ busy: false, progress: 1 });
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <form action={action} className="grid gap-4" noValidate>
        {Object.entries(ids).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        {assignment.acceptText ? (
          <div>
            <label htmlFor="text" className="field-label">
              Your answer
            </label>
            <textarea id="text" name="text" className="field min-h-40" defaultValue={draft.text} maxLength={50000} />
          </div>
        ) : null}
        {assignment.acceptUrl ? (
          <div>
            <label htmlFor="url" className="field-label">
              Link <span className="text-muted">(for example a Google Doc or GitHub page)</span>
            </label>
            <input id="url" name="url" type="url" className="field" defaultValue={draft.url ?? ''} placeholder="https://" maxLength={2000} />
          </div>
        ) : null}
        {state.error ? (
          <p role="alert" className="notice notice-error">
            {state.error}
          </p>
        ) : state.saved ? (
          <p role="status" className="notice">
            Saved.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button type="submit" name="intent" value="save" className="btn btn-secondary" disabled={pending || upload.busy}>
            Save draft
          </button>
          <button type="submit" name="intent" value="submit" className="btn btn-primary" disabled={pending || upload.busy}>
            {pending ? 'Sending…' : 'Submit to the teacher'}
          </button>
        </div>
      </form>

      {assignment.acceptFile ? (
        <div className="card grid gap-3">
          <p className="field-label mb-0">File</p>
          {draft.file ? (
            <div className="flex flex-wrap items-center gap-3">
              <span>
                {draft.file.name} · {formatBytes(draft.file.sizeBytes)}
              </span>
              <form action={removeMyFile}>
                {Object.entries(ids).map(([name, value]) => (
                  <input key={name} type="hidden" name={name} value={value} />
                ))}
                <button type="submit" className="btn btn-secondary text-sm">
                  Remove
                </button>
              </form>
            </div>
          ) : (
            <p className="text-muted">No file attached.</p>
          )}
          <label className="btn btn-secondary justify-self-start" aria-disabled={upload.busy}>
            {draft.file ? 'Replace file' : 'Attach a file'}
            <input
              type="file"
              className="sr-only"
              accept={SUBMISSION_ACCEPT}
              disabled={upload.busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) void uploadFile(file);
              }}
            />
          </label>
          <p className="text-sm text-muted">PDF, Word, PowerPoint, Excel, image, text, ZIP, or audio, up to {assignment.maxFileMb} MB. Attach the file before submitting.</p>
          {upload.busy ? (
            <div role="status" aria-live="polite" className="grid gap-1">
              <span className="text-sm">Uploading… {Math.round(upload.progress * 100)}%</span>
              <progress max={1} value={upload.progress} className="w-full" />
            </div>
          ) : null}
          {upload.error ? (
            <p role="alert" className="notice notice-error">
              {upload.error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
