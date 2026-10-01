import type { Metadata } from 'next';
import Link from 'next/link';
import { workspaceContext } from '@/lib/guard.ts';
import { formatNpr } from '@/lib/store.ts';
import { saleState } from '@/lib/studio.ts';
import { loadOfferings } from '../data';

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: 'Offerings and prices' };

const TONE = { brand: 'tone-brand', success: 'tone-success', warning: 'tone-warning', danger: 'tone-danger', muted: 'tone-muted' } as const;

/** Every offering with its sale state; plans and prices per offering (design screen 7; FR-CATALOG-305). */
export default async function OfferingsPage({ params }: Props) {
  const { slug } = await params;
  const base = `/w/${slug}/studio`;
  const { token, workspace } = await workspaceContext(slug, `${base}/offerings`);
  const offerings = await loadOfferings(token, workspace.id, `${base}/offerings`);

  return (
    <>
      <div className="flex flex-wrap items-end gap-4">
        <div className="grid gap-1">
          <span className="studio-kicker">// Content</span>
          <h1 className="studio-title">Offerings and prices</h1>
          <p className="text-sm text-muted">Courses, trainings, ideas and skills. Each one is sold by access plan: 1 month, 6 months, 1 year, or lifetime.</p>
        </div>
        <span className="flex-1" />
        <Link href={`/w/${slug}/teach`} className="btn btn-primary font-studio">
          + New offering
        </Link>
      </div>

      {offerings.length === 0 ? (
        <p className="studio-panel px-5 py-4 text-muted">
          No offerings yet. <Link href={`/w/${slug}/teach`}>Create the first one in the course builder</Link>.
        </p>
      ) : (
        <div className="studio-panel overflow-x-auto">
          <table className="studio-table min-w-[44rem]">
            <thead>
              <tr>
                <th>Offering</th>
                <th>Sale state</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {offerings.map((offering) => {
                const state = saleState(offering, formatNpr);
                return (
                  <tr key={offering.courseId}>
                    <td>
                      <span className="font-studio text-base font-bold">{offering.title}</span>
                      {offering.published && offering.draftStatus ? (
                        <span className="studio-sub block">{offering.draftStatus === 'IN_REVIEW' ? 'A new version is in review' : 'A new version is being written'}</span>
                      ) : null}
                    </td>
                    <td className={`studio-status ${TONE[state.tone]}`}>{state.text}</td>
                    <td className="whitespace-nowrap text-right">
                      <Link href={`${base}/offerings/${offering.courseId}/plans`} className="btn btn-secondary text-sm">
                        Plans and prices
                      </Link>{' '}
                      <Link href={`/w/${slug}/teach/${offering.courseId}`} className="btn btn-secondary text-sm">
                        Edit content
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
