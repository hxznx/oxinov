import type { Metadata } from 'next';
import { activityTimeline } from '@/lib/account.ts';
import { eduApi } from '@/lib/edu-api.ts';
import { load } from '@/lib/guard.ts';
import { accountContext } from '../data';

export const metadata: Metadata = { title: 'Activity' };

const TONE = { success: 'var(--ox-color-success)', warning: 'var(--ox-color-warning)', danger: 'var(--ox-color-danger)', muted: 'var(--ox-color-text-muted)', brand: 'var(--ox-color-brand)' } as const;

/** What happened on the learner's account: payments, access, and certificates (FR-AUTH-104). */
export default async function ActivityPage() {
  const here = '/account/activity';
  const { token, workspace } = await accountContext(here);
  const [subs, payments, certificates] = workspace
    ? await Promise.all([
        load(here, () => eduApi.mySubscriptions(token, workspace.id)),
        load(here, () => eduApi.myBankPayments(token, workspace.id)),
        load(here, () => eduApi.myCertificates(token, workspace.id)),
      ])
    : [[], [], []];
  const events = activityTimeline(subs, payments, certificates);

  return (
    <>
      <div className="grid gap-1">
        <span className="studio-kicker">// My learning</span>
        <h1 className="studio-title">
          <span className="crumb">Account ›</span> Activity
        </h1>
        <p className="text-sm text-muted">
          Payments, new access, and certificates, newest first. If you don&apos;t recognise a sign-in, sign out of all devices under Profile and privacy.
        </p>
      </div>
      {events.length === 0 ? (
        <p className="studio-panel px-5 py-4 text-muted">Nothing yet.</p>
      ) : (
        <ol className="studio-panel">
          {events.map((event, index) => (
            <li key={`${event.at}-${index}`} className="grid grid-cols-[7.5rem_0.75rem_minmax(0,1fr)] items-start gap-3 border-b border-line px-5 py-3 last:border-b-0">
              <time dateTime={event.at} className="text-hud text-xs text-muted">
                {new Date(event.at).toLocaleString('en', { timeZone: 'Asia/Kathmandu', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
              </time>
              <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5" style={{ background: TONE[event.tone], boxShadow: `0 0 8px ${TONE[event.tone]}` }} />
              <span className="grid gap-0.5">
                <span className="font-semibold">{event.title}</span>
                <span className="studio-sub">{event.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
