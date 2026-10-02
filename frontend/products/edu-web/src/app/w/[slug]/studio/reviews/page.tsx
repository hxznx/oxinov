import type { Metadata } from 'next';
import Link from 'next/link';
import { eduApi } from '@/lib/edu-api.ts';
import { formatDate } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { REVIEW_TABS, parseReviewStatus, stars } from '@/lib/reviews.ts';
import { ModerationForms } from './ModerationForms';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ status?: string }> };

export const metadata: Metadata = { title: 'Reviews' };

/**
 * Reviews (FR-CATALOG-304). The owner chose "approve first": learner reviews wait here and appear on the
 * offering page only after approval. Hiding needs a reason that only administrators see.
 */
export default async function ReviewsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const status = parseReviewStatus((await searchParams).status);
  const here = `/w/${slug}/studio/reviews`;
  const { token, workspace } = await workspaceContext(slug, here);
  const reviews = await load(here, () => eduApi.moderationReviews(token, workspace.id, status));
  const tab = REVIEW_TABS.find((item) => item.status === status)!;

  return (
    <>
      <div className="grid gap-1">
        <span className="studio-kicker">// Business</span>
        <h1 className="studio-title">Reviews</h1>
        <p className="text-sm text-muted">
          Learners who joined an offering can rate it. Each review waits here until you approve it; only approved reviews show on the offering page and count in
          the rating. A changed review comes back for approval.
        </p>
      </div>
      <nav aria-label="Review states" className="flex flex-wrap gap-2">
        {REVIEW_TABS.map((item) => (
          <Link
            key={item.status}
            href={`${here}?status=${item.status}`}
            aria-current={item.status === status ? 'page' : undefined}
            className={`btn font-studio ${item.status === status ? 'btn-primary' : 'btn-secondary'}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <section aria-label={tab.label} className="studio-panel overflow-x-auto">
        <div className="studio-panel-head">
          <h2 className="studio-h2">{tab.label}</h2>
          <span className={`studio-status ${status === 'PENDING' && reviews.length > 0 ? 'tone-warning' : 'tone-muted'}`}>
            {reviews.length}
            {status === 'PENDING' ? ' · oldest first' : ' · newest first'}
          </span>
        </div>
        {reviews.length === 0 ? (
          <p className="px-5 py-4 text-muted">{status === 'PENDING' ? 'Nothing is waiting. New reviews appear here.' : 'None yet.'}</p>
        ) : (
          <table className="studio-table min-w-[48rem]">
            <thead>
              <tr>
                <th>Review</th>
                <th>Learner · offering</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td className="max-w-[28rem]">
                    <span className="tone-warning" aria-label={`${review.rating} out of 5`}>
                      {stars(review.rating)}
                    </span>
                    <p className="mt-1 whitespace-pre-line break-words">{review.body || <span className="text-muted">No text, stars only.</span>}</p>
                    {review.moderationReason ? <p className="studio-sub mt-1">Hidden because: {review.moderationReason}</p> : null}
                  </td>
                  <td>
                    {review.learnerName ?? 'Learner'}
                    <span className="studio-sub block break-all">{review.learnerEmail}</span>
                    <span className="studio-sub block">
                      {review.courseTitle} · {formatDate(review.updatedAt, workspace.timeZone)}
                    </span>
                  </td>
                  <td className="text-right">
                    <ModerationForms slug={slug} tenantId={workspace.id} reviewId={review.id} canApprove={review.status !== 'APPROVED'} canHide={review.status !== 'HIDDEN'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
