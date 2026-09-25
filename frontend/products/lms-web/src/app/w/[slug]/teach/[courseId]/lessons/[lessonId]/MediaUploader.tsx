'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { finishUpload, requestUpload } from '@/app/media-actions';
import { formatClock } from '@/lib/exam.ts';
import { mediaContentType, MEDIA_ACCEPT } from '@/lib/media.ts';

type Props = {
  kind: 'VIDEO' | 'AUDIO';
  hidden: { slug: string; tenantId: string; courseId: string; lessonId: string };
  current: { fileName: string; durationSec: number | null; status: string } | null;
};

/** Reads a local media file's duration; WebM files sometimes report Infinity until forced to the end. */
function measureDuration(file: File, kind: 'VIDEO' | 'AUDIO'): Promise<number> {
  return new Promise((resolve, reject) => {
    const element = document.createElement(kind === 'VIDEO' ? 'video' : 'audio');
    const url = URL.createObjectURL(file);
    const done = (value: number) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    element.preload = 'metadata';
    element.onloadedmetadata = () => {
      if (Number.isFinite(element.duration) && element.duration > 0) return done(element.duration);
      element.ontimeupdate = () => {
        element.ontimeupdate = null;
        if (Number.isFinite(element.duration) && element.duration > 0) done(element.duration);
        else reject(new Error('unknown duration'));
      };
      element.currentTime = 1e101;
    };
    element.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('unreadable'));
    };
    element.src = url;
  });
}

/** Sends the file straight to storage with the signed URL, reporting progress (media never touches our servers). */
function putWithProgress(url: string, headers: Record<string, string>, file: File, onProgress: (ratio: number) => void): Promise<number> {
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

export function MediaUploader({ kind, hidden, current }: Props) {
  const router = useRouter();
  const [state, setState] = useState<{ phase: 'idle' | 'measuring' | 'uploading' | 'checking' | 'done'; progress: number; error?: string; fileName?: string }>({
    phase: 'idle',
    progress: 0,
  });
  const noun = kind === 'VIDEO' ? 'video' : 'audio';

  async function upload(file: File) {
    const contentType = mediaContentType(file, kind);
    if (!contentType) {
      setState({ phase: 'idle', progress: 0, error: kind === 'VIDEO' ? 'Choose an MP4 or WebM video.' : 'Choose an MP3, M4A, OGG, or WebM audio file.' });
      return;
    }
    setState({ phase: 'measuring', progress: 0 });
    let durationSec: number;
    try {
      durationSec = await measureDuration(file, kind);
    } catch {
      setState({ phase: 'idle', progress: 0, error: `This ${noun} file cannot be played in the browser. Export it as ${kind === 'VIDEO' ? 'MP4 (H.264)' : 'MP3'} and try again.` });
      return;
    }

    const ticket = await requestUpload({ tenantId: hidden.tenantId, kind, contentType, sizeBytes: file.size, fileName: file.name });
    if (!ticket.ok) return setState({ phase: 'idle', progress: 0, error: ticket.error });

    setState({ phase: 'uploading', progress: 0 });
    let status: number;
    try {
      status = await putWithProgress(ticket.value.uploadUrl, ticket.value.headers, file, (ratio) => setState((s) => ({ ...s, progress: ratio })));
    } catch {
      return setState({ phase: 'idle', progress: 0, error: 'The upload was interrupted. Check your connection and try again.' });
    }
    if (status < 200 || status >= 300) return setState({ phase: 'idle', progress: 0, error: `The storage service refused the upload (${status}). Try again.` });

    setState({ phase: 'checking', progress: 1 });
    const finished = await finishUpload({ ...hidden, mediaId: ticket.value.mediaId, durationSec });
    if (!finished.ok) return setState({ phase: 'idle', progress: 0, error: finished.error });
    setState({ phase: 'done', progress: 1, fileName: finished.value.fileName });
    router.refresh();
  }

  const busy = state.phase === 'measuring' || state.phase === 'uploading' || state.phase === 'checking';
  return (
    <div className="card grid gap-3">
      <p className="field-label mb-0">{kind === 'VIDEO' ? 'Video' : 'Audio'} file</p>
      {current?.status === 'READY' ? (
        <p>
          Attached: <strong>{current.fileName}</strong>
          {current.durationSec ? ` · ${formatClock(current.durationSec)}` : ''}
        </p>
      ) : (
        <p className="text-muted">No {noun} attached yet.</p>
      )}
      <label className="btn btn-secondary justify-self-start" aria-disabled={busy}>
        {current?.status === 'READY' ? `Replace ${noun}` : `Upload ${noun}`}
        <input
          type="file"
          accept={MEDIA_ACCEPT[kind]}
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void upload(file);
          }}
        />
      </label>
      <p className="text-sm text-muted">
        {kind === 'VIDEO' ? 'MP4 or WebM, up to 1 GB.' : 'MP3, M4A, OGG, or WebM, up to 200 MB.'} Add a transcript or summary in the lesson text below; learners who
        cannot {kind === 'VIDEO' ? 'watch' : 'listen'} rely on it.
      </p>
      {busy ? (
        <div role="status" aria-live="polite" className="grid gap-1">
          <span className="text-sm">
            {state.phase === 'measuring' ? 'Reading the file…' : state.phase === 'checking' ? 'Checking the file…' : `Uploading… ${Math.round(state.progress * 100)}%`}
          </span>
          <progress max={1} value={state.progress} className="w-full" />
        </div>
      ) : null}
      {state.phase === 'done' ? (
        <p role="status" className="notice">
          Uploaded {state.fileName}.
        </p>
      ) : null}
      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
