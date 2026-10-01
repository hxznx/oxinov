'use client';

import { useState } from 'react';

/** Copies one value, so learners never mistype the amount, reference, or account number (FR-CATALOG-314). */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-secondary min-h-11 px-3 py-1 text-sm"
      aria-label={`Copy ${label}`}
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  );
}
