import type { Metadata } from 'next';
import { eduApi } from '@/lib/edu-api.ts';
import { formatDate } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { loadOfferings } from '../data';
import { GiveAccessForm, RevokeForm } from './AccessForms';

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: 'Free access' };

/** Free access grants (FR-MGMT-1404; design screen 8, "Give free access"): give, list, and end them. */
export default async function AccessPage({ params }: Props) {
  const { slug } = await params;
  const here = `/w/${slug}/studio/access`;
  const { token, workspace } = await workspaceContext(slug, here);
  const [grants, offerings] = await Promise.all([load(here, () => eduApi.grants(token, workspace.id)), loadOfferings(token, workspace.id, here)]);
  const published = offerings.filter((offering) => offering.published).map((offering) => ({ id: offering.courseId, title: offering.title }));
  const now = Date.now();

  return (
    <>
      <div className="grid gap-1">
        <span className="studio-kicker">// Business</span>
        <h1 className="studio-title">Free access</h1>
        <p className="text-sm text-muted">Give a learner access without a payment: scholarships, prizes, partners, or a 7-day trial. Every grant is in the audit log.</p>
      </div>

      <GiveAccessForm slug={slug} tenantId={workspace.id} offerings={published} />

      <section aria-labelledby="grants-heading" className="studio-panel overflow-x-auto">
        <div className="studio-panel-head">
          <h2 id="grants-heading" className="studio-h2">
            Recent grants
          </h2>
        </div>
        {grants.length === 0 ? (
          <p className="px-5 py-4 text-muted">No free access given yet.</p>
        ) : (
          <table className="studio-table min-w-[48rem]">
            <thead>
              <tr>
                <th>Learner</th>
                <th>Offering</th>
                <th>Access</th>
                <th>
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {grants.map((grant) => {
                const ended = grant.revokedAt !== null || (grant.endsAt !== null && new Date(grant.endsAt).getTime() <= now);
                return (
                  <tr key={grant.id}>
                    <td>
                      {grant.learnerName ?? 'Learner'}
                      <span className="studio-sub block break-all">{grant.learnerEmail}</span>
                    </td>
                    <td>{grant.courseTitle}</td>
                    <td className="whitespace-nowrap">
                      {grant.revokedAt ? (
                        <span className="studio-status tone-danger">Ended · {grant.revokeReason}</span>
                      ) : grant.endsAt ? (
                        <span className={`studio-status ${ended ? 'tone-muted' : 'tone-success'}`}>
                          {ended ? 'Ended' : 'Until'} {formatDate(grant.endsAt, workspace.timeZone)}
                        </span>
                      ) : (
                        <span className="studio-status tone-success">Lifetime</span>
                      )}
                    </td>
                    <td className="text-right">{ended ? null : <RevokeForm slug={slug} tenantId={workspace.id} grantId={grant.id} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
