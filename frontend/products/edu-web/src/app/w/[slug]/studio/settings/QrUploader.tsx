'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { completeQrUpload, requestQrUpload } from '@/app/store-actions';
import { QR_MAX_BYTES, QR_TYPES, fileProblem } from '@/lib/store.ts';

/** Uploads the bank QR image to private storage; the API checks it really is a PNG or JPG. */
export function QrUploader({ slug, tenantId }: { slug: string; tenantId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    const problem = fileProblem(file, QR_TYPES, QR_MAX_BYTES, 'PNG or JPG image');
    if (problem) return setError(problem);
    setBusy(true);
    const ticket = await requestQrUpload({ tenantId, contentType: file.type, sizeBytes: file.size });
    if (!ticket.ok) {
      setBusy(false);
      return setError(ticket.error);
    }
    try {
      const response = await fetch(ticket.value.uploadUrl, { method: 'PUT', headers: ticket.value.headers, body: file });
      if (!response.ok) throw new Error(String(response.status));
    } catch {
      setBusy(false);
      return setError('The upload was interrupted. Check your connection and try again.');
    }
    const done = await completeQrUpload({ slug, tenantId, uploadId: ticket.value.uploadId, contentType: file.type });
    setBusy(false);
    if (!done.ok) return setError(done.error);
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <label className="grid gap-1">
        <span className="field-label">{busy ? 'Uploading…' : 'Upload a new QR image'}</span>
        <input
          type="file"
          className="field"
          accept={QR_TYPES.join(',')}
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </label>
      {error ? (
        <p role="alert" className="notice notice-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
