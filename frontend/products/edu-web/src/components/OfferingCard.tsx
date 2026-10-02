import Link from 'next/link';
import type { StoreOffering } from '@/lib/edu-api.ts';
import { formatNpr } from '@/lib/store.ts';
import { CATEGORY_TONES, KIND_LABELS, cardGlyph, cardTag } from '@/lib/storefront.ts';
import { formatPrice } from '@/lib/format.ts';
import { ratingLabel } from '@/lib/reviews.ts';

/** One offering on the store home (design screen 1): mark, kind, title, summary, what is free, and price. */
export function OfferingCard({ offering, tone }: { offering: StoreOffering; tone?: string }) {
  const color = tone ?? CATEGORY_TONES[offering.category];
  const price = offering.free
    ? 'FREE'
    : offering.hasPlans
      ? `from ${formatNpr(offering.fromMinor)}`
      : formatPrice({ amountMinor: offering.fromMinor, currency: offering.currency });
  return (
    <Link href={`/o/${offering.slug}`} className="store-card h-full" style={{ ['--tone' as string]: `var(${color})` }}>
      <span className="store-card-art grid-bg" aria-hidden="true">
        <span className="store-card-glyph">{cardGlyph(offering.title)}</span>
        <span className="store-badge store-badge-solid absolute left-3 top-3">{offering.free ? `Free ${KIND_LABELS[offering.kind]}` : KIND_LABELS[offering.kind]}</span>
      </span>
      <span className="flex flex-1 flex-col gap-2 p-4">
        <span className="font-studio text-lg font-bold leading-tight">{offering.title}</span>
        <span className="flex-1 text-sm text-muted">{offering.summary}</span>
        {offering.ratingCount > 0 && offering.ratingAverage !== null ? (
          <span className="text-hud text-xs text-muted" aria-label={ratingLabel(offering.ratingAverage, offering.ratingCount)}>
            <span className="tone-warning">★ {offering.ratingAverage.toFixed(1)}</span> ({offering.ratingCount})
          </span>
        ) : null}
        <span className="flex items-center justify-between gap-2 border-t border-line pt-3">
          <span className="studio-status" style={{ color: `var(${offering.free ? '--ox-color-success' : '--ox-color-text-muted'})` }}>
            {cardTag(offering)}
          </span>
          <span className="font-display text-sm font-bold" style={{ color: offering.free ? 'var(--ox-color-success)' : undefined }}>
            {price}
          </span>
        </span>
      </span>
    </Link>
  );
}
