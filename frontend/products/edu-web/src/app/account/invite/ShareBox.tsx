'use client';

import { useState } from 'react';
import { shareLinks } from '@/lib/account.ts';

/** A link to share, with a copy button and share targets (design screen 10, "Invite friends"). */
export function ShareBox({ url, text, label }: { url: string; text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const id = `share-${label.replace(/\W+/g, '-').toLowerCase()}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="flex gap-2">
        <input id={id} className="field text-hud" readOnly value={url} onFocus={(event) => event.currentTarget.select()} />
        <button type="button" onClick={copy} className="btn btn-primary shrink-0 font-studio">
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <span role="status" className="sr-only">
        {copied ? 'Link copied' : ''}
      </span>
      <div className="flex flex-wrap gap-2">
        {shareLinks(url, text).map((link) => (
          <a key={link.name} href={link.href} target="_blank" rel="noreferrer noopener" className="store-chip">
            {link.name}
          </a>
        ))}
      </div>
    </div>
  );
}

/** Pick one offering to recommend; the share box follows the choice. */
export function RecommendBox({ origin, offerings }: { origin: string; offerings: { slug: string; title: string; free: boolean }[] }) {
  const [slug, setSlug] = useState(offerings[0]?.slug ?? '');
  const chosen = offerings.find((offering) => offering.slug === slug);
  if (!chosen) return null;
  return (
    <div className="grid gap-3">
      <label className="grid gap-1">
        <span className="field-label">Course to recommend</span>
        <select className="field" value={slug} onChange={(event) => setSlug(event.target.value)}>
          {offerings.map((offering) => (
            <option key={offering.slug} value={offering.slug}>
              {offering.title}
              {offering.free ? ' (free)' : ''}
            </option>
          ))}
        </select>
      </label>
      <ShareBox url={`${origin}/o/${chosen.slug}`} text={`I think you'll like “${chosen.title}” on Oxinov.`} label="Link to this course" />
    </div>
  );
}
