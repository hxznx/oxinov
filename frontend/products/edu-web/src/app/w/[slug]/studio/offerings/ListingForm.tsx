'use client';

import { useActionState } from 'react';
import { saveListing, type ListingFormState } from '@/app/storefront-actions';
import type { OfferingCategory, OfferingKind } from '@/lib/edu-api.ts';
import { CATEGORIES, CATEGORY_LABELS, KINDS, KIND_LABELS } from '@/lib/storefront.ts';

/** Kind and store category of one offering (ADR-028 point 1): where it appears on the store home. */
export function ListingForm({ slug, tenantId, courseId, kind, category, title }: { slug: string; tenantId: string; courseId: string; kind: OfferingKind; category: OfferingCategory; title: string }) {
  const [state, action, pending] = useActionState<ListingFormState, FormData>(saveListing, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="courseId" value={courseId} />
      <label className="sr-only" htmlFor={`kind-${courseId}`}>
        Kind of {title}
      </label>
      <select id={`kind-${courseId}`} name="kind" defaultValue={kind} className="field w-auto py-1.5 text-sm" disabled={pending}>
        {KINDS.map((value) => (
          <option key={value} value={value}>
            {KIND_LABELS[value]}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor={`category-${courseId}`}>
        Store category of {title}
      </label>
      <select id={`category-${courseId}`} name="category" defaultValue={category} className="field w-auto py-1.5 text-sm" disabled={pending}>
        {CATEGORIES.map((value) => (
          <option key={value} value={value}>
            {CATEGORY_LABELS[value]}
          </option>
        ))}
      </select>
      <button type="submit" className="btn btn-secondary px-3 py-1.5 text-sm" disabled={pending}>
        {pending ? 'Saving…' : 'Save'}
      </button>
      <span role="status" className={`studio-status ${state.error ? 'tone-danger' : 'tone-success'}`}>
        {state.error ?? state.ok ?? ''}
      </span>
    </form>
  );
}
