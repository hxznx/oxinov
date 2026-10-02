'use client';

import { useMemo, useState } from 'react';

interface Channel {
  name: string;
  source: string;
  tone: string;
  /** How the channel's own share page is opened; null for apps that only accept posts made in the app. */
  share: ((link: string, caption: string) => string) | null;
}

const enc = encodeURIComponent;
const CHANNELS: Channel[] = [
  { name: 'Facebook', source: 'facebook', tone: '--ox-color-product-services', share: (link) => `https://www.facebook.com/sharer/sharer.php?u=${enc(link)}` },
  { name: 'WhatsApp', source: 'whatsapp', tone: '--ox-color-success', share: (link, caption) => `https://wa.me/?text=${enc(`${caption}\n${link}`)}` },
  { name: 'Telegram', source: 'telegram', tone: '--ox-color-brand', share: (link, caption) => `https://t.me/share/url?url=${enc(link)}&text=${enc(caption)}` },
  { name: 'LinkedIn', source: 'linkedin', tone: '--ox-color-product-services', share: (link) => `https://www.linkedin.com/sharing/share-offsite/?url=${enc(link)}` },
  { name: 'Viber', source: 'viber', tone: '--ox-color-brand-mid', share: (link, caption) => `viber://forward?text=${enc(`${caption}\n${link}`)}` },
  { name: 'Instagram', source: 'instagram', tone: '--ox-color-brand2', share: null },
  { name: 'TikTok', source: 'tiktok', tone: '--ox-color-brand', share: null },
];

/**
 * Caption, campaign coupon, and per-channel links of the share kit (design screen 19). Each channel gets
 * its own tracked link; networks without a web share page (Instagram, TikTok) get the image to download
 * and the link to copy into the bio or story.
 */
export function ShareKit({
  origin,
  slug,
  captions,
  coupons,
}: {
  origin: string;
  slug: string;
  /** The ready caption without a coupon, and with each coupon code. */
  captions: Record<string, string>;
  coupons: string[];
}) {
  const [coupon, setCoupon] = useState('');
  const [caption, setCaption] = useState(captions[''] ?? '');
  const [copied, setCopied] = useState('');
  const links = useMemo(
    () => Object.fromEntries(CHANNELS.map((channel) => [channel.source, `${origin}/o/${enc(slug)}?utm_source=${channel.source}&utm_medium=social&utm_campaign=share-kit`])),
    [origin, slug],
  );

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      setCopied('');
    }
  }

  return (
    <div className="grid gap-4">
      <section aria-labelledby="caption-heading" className="studio-panel grid gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="caption-heading" className="studio-h2">
            Caption
          </h2>
          <button type="button" className="btn btn-secondary px-3 py-1 text-sm" onClick={() => copy('caption', caption)}>
            {copied === 'caption' ? 'Copied ✓' : 'Copy caption'}
          </button>
        </div>
        <label className="sr-only" htmlFor="share-caption">
          Caption
        </label>
        <textarea id="share-caption" className="field" rows={7} maxLength={2000} value={caption} onChange={(event) => setCaption(event.target.value)} />
        {coupons.length > 0 ? (
          <label className="grid gap-1">
            <span className="field-label">Campaign coupon (optional)</span>
            <select
              className="field"
              value={coupon}
              onChange={(event) => {
                setCoupon(event.target.value);
                setCaption(captions[event.target.value] ?? caption);
              }}
            >
              <option value="">No coupon</option>
              {coupons.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <p className="studio-sub">Edit before posting. Never promise jobs, visas, or exam results.</p>
      </section>

      <section aria-labelledby="channels-heading" className="studio-panel grid gap-2 p-4">
        <h2 id="channels-heading" className="studio-h2">
          Share to
        </h2>
        {CHANNELS.map((channel) => {
          const link = links[channel.source]!;
          return (
            <div key={channel.source} className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)_auto]">
              {channel.share ? (
                <a
                  href={channel.share(link, caption)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn justify-center border font-studio text-sm"
                  style={{ borderColor: `var(${channel.tone})`, color: `var(${channel.tone})` }}
                >
                  {channel.name}
                </a>
              ) : (
                <span className="btn justify-center border font-studio text-sm opacity-80" style={{ borderColor: `var(${channel.tone})`, color: `var(${channel.tone})` }}>
                  {channel.name}
                </span>
              )}
              <input className="field text-hud text-xs" readOnly value={link} aria-label={`${channel.name} tracked link`} onFocus={(event) => event.currentTarget.select()} />
              <button type="button" className="btn btn-secondary px-3 py-1 text-sm" onClick={() => copy(channel.source, link)}>
                {copied === channel.source ? '✓' : 'Copy'}
              </button>
            </div>
          );
        })}
        <p className="studio-sub">
          Facebook, WhatsApp, Telegram, LinkedIn, and Viber open with the post ready. For Instagram and TikTok, download the image, post it in the app, and put
          the link in your bio or story. Each link names its channel for later reports.
        </p>
      </section>
    </div>
  );
}
