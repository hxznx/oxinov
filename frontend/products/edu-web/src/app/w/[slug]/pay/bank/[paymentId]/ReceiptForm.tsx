'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { requestEvidenceUpload, submitBankPayment } from '@/app/store-actions';
import { EVIDENCE_MAX_BYTES, EVIDENCE_TYPES, fileProblem } from '@/lib/store.ts';

/** Uploads the receipt straight to private storage with a signed URL, then sends the transaction ID. */
async function put(url: string, headers: Record<string, string>, file: File): Promise<number> {
  const response = await fetch(url, { method: 'PUT', headers, body: file });
  return response.status;
}

export function ReceiptForm({ slug, tenantId, paymentId, resubmit }: { slug: string; tenantId: string; paymentId: string; resubmit: boolean }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [txId, setTxId] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (txId.trim().length < 4) return setError('Enter the transaction ID from your bank receipt.');
    if (!file) return setError('Add a screenshot or PDF of your bank receipt.');
    const problem = fileProblem(file, EVIDENCE_TYPES, EVIDENCE_MAX_BYTES, 'JPG, PNG, or PDF of the receipt');
    if (problem) return setError(problem);

    setBusy('Uploading your receipt…');
    const ticket = await requestEvidenceUpload({ tenantId, paymentId, contentType: file.type, sizeBytes: file.size });
    if (!ticket.ok) {
      setBusy(null);
      return setError(ticket.error);
    }
    try {
      const status = await put(ticket.value.uploadUrl, ticket.value.headers, file);
      if (status < 200 || status >= 300) throw new Error(String(status));
    } catch {
      setBusy(null);
      return setError('The upload was interrupted. Check your connection and try again.');
    }
    setBusy('Sending for review…');
    const sent = await submitBankPayment({ slug, tenantId, paymentId, bankTransactionId: txId });
    setBusy(null);
    if (!sent.ok) return setError(sent.error);
    router.refresh();
  }

  return (
    <form onSubmit={send} className="grid gap-3" noValidate>
      <label className="grid gap-1">
        <span className="field-label">Bank transaction ID</span>
        <input className="field" value={txId} onChange={(e) => setTxId(e.target.value)} autoComplete="off" maxLength={80} placeholder="As shown on your bank receipt" required />
      </label>
      <label className="grid gap-1">
        <span className="field-label">Receipt screenshot or PDF</span>
        <input className="field" type="file" accept={EVIDENCE_TYPES.join(',')} onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
        <span className="text-sm opacity-80">JPG, PNG, or PDF up to 5 MB. Only Oxinov&apos;s payment team sees it.</span>
      </label>
      <button type="submit" className="btn btn-primary justify-center" disabled={busy !== null}>
        {busy ?? (resubmit ? 'Resubmit for review' : 'Submit for review')}
      </button>
      {error ? (
        <p role="alert" className="notice notice-error">
          {error}
        </p>
      ) : null}
    </form>
  );
}
