'use client';

import { useState } from 'react';

/** Copies an item's link so it can be pasted into another lesson (FR-COURSE-210 reuse). */
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return (
    <button type="button" className="btn btn-secondary px-3 py-1 text-sm" onClick={copy}>
      {copied ? 'Copied ✓' : 'Copy link'}
    </button>
  );
}
