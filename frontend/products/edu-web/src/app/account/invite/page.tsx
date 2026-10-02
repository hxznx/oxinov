import type { Metadata } from 'next';
import { eduApi } from '@/lib/edu-api.ts';
import { accountContext } from '../data';
import { RecommendBox, ShareBox } from './ShareBox';

export const metadata: Metadata = { title: 'Invite friends' };

/**
 * Share Oxinov or one course (design screen 10; FR-CATALOG-311). Links open the store or the offering page;
 * personal invite links that count who joined come with the owner's decision on an invite reward.
 */
export default async function InvitePage() {
  await accountContext('/account/invite');
  const origin = process.env.APP_URL?.replace(/\/$/, '') ?? 'https://edu.oxinov.com';
  const offerings = await eduApi
    .storeHome()
    .then((home) => home.offerings.map((offering) => ({ slug: offering.slug, title: offering.title, free: offering.free })))
    .catch(() => []);

  return (
    <>
      <div className="grid gap-1">
        <span className="studio-kicker">// Share</span>
        <h1 className="studio-title">
          <span className="crumb">Account ›</span> Invite friends
        </h1>
      </div>
      <section aria-labelledby="squad-heading" className="studio-panel grid-bg grid gap-4 p-5">
        <div className="grid gap-1">
          <span className="studio-kicker tone-pink">// Recruit your squad</span>
          <h2 id="squad-heading" className="font-studio text-2xl font-bold">
            Learning is better together
          </h2>
          <p className="text-sm text-muted">Share Oxinov with a friend. They can read every syllabus and try the free lessons straight away.</p>
        </div>
        <ShareBox url={`${origin}/`} text="Learn languages, technology, and new skills with me on Oxinov." label="Link to the Oxinov store" />
      </section>
      {offerings.length > 0 ? (
        <section aria-labelledby="recommend-heading" className="studio-panel grid gap-3 p-5">
          <div className="grid gap-1">
            <h2 id="recommend-heading" className="studio-h2">
              Recommend a course
            </h2>
            <p className="studio-sub">Send a friend straight to a course page.</p>
          </div>
          <RecommendBox origin={origin} offerings={offerings} />
        </section>
      ) : null}
    </>
  );
}
