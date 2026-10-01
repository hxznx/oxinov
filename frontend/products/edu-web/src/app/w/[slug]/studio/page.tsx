import type { Metadata } from 'next';
import Link from 'next/link';
import { eduApi } from '@/lib/edu-api.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { formatNpr } from '@/lib/store.ts';
import { approvedTotal, studioTodo } from '@/lib/studio.ts';
import { loadOfferings } from './data';

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: 'Studio' };

const TONE = { brand: 'tone-brand', success: 'tone-success', warning: 'tone-warning', danger: 'tone-danger', muted: 'tone-muted' } as const;

/**
 * Studio dashboard (ADR-028 point 12; design screen 8, "Mission control"): live counts and the list of
 * things that need the administrator. Funnel, notices, free access, and OXI arrive with their features.
 */
export default async function StudioDashboard({ params }: Props) {
  const { slug } = await params;
  const base = `/w/${slug}/studio`;
  const { token, workspace } = await workspaceContext(slug, base);
  const [waiting, approved, settings, coupons, offerings] = await Promise.all([
    load(base, () => eduApi.reviewQueue(token, workspace.id, 'PENDING_REVIEW')),
    load(base, () => eduApi.reviewQueue(token, workspace.id, 'SUCCEEDED')),
    load(base, () => eduApi.storeSettings(token, workspace.id)),
    load(base, () => eduApi.coupons(token, workspace.id)),
    loadOfferings(token, workspace.id, base),
  ]);
  const onSale = offerings.filter((offering) => offering.published && offering.hasPlans).length;
  const todo = studioTodo({ base, settings, waiting: waiting.length, offerings });

  const tiles = [
    { label: 'Waiting for review', value: String(waiting.length), tone: waiting.length > 0 ? '--ox-color-warning' : '--ox-color-success', href: `${base}/payments` },
    { label: 'Approved payments', value: String(approved.length), tone: '--ox-color-success', href: `${base}/payments?status=SUCCEEDED` },
    { label: 'Approved income', value: formatNpr(approvedTotal(approved)), tone: '--ox-color-brand', href: `${base}/payments?status=SUCCEEDED` },
    { label: 'Offerings on sale', value: `${onSale} / ${offerings.length}`, tone: '--ox-color-brand-mid', href: `${base}/offerings` },
    { label: 'Active coupons', value: String(coupons.filter((coupon) => coupon.active).length), tone: '--ox-color-highlight', href: `${base}/settings#coupons` },
    {
      label: 'Checkout',
      value: settings.isSeller && settings.available ? 'OPEN' : 'CLOSED',
      tone: settings.isSeller && settings.available ? '--ox-color-success' : '--ox-color-danger',
      href: `${base}/settings`,
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end gap-4">
        <div className="grid gap-1">
          <span className="studio-kicker">// Mission control</span>
          <h1 className="studio-title">Dashboard</h1>
        </div>
        <span className="flex-1" />
        <Link href={`/w/${slug}/teach`} className="btn btn-primary font-studio">
          + New offering
        </Link>
      </div>

      <div className="studio-tiles">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className="studio-tile" style={{ ['--tile' as string]: `var(${tile.tone})` }}>
            <span className="studio-tile-label">{tile.label}</span>
            <span className="studio-tile-value">{tile.value}</span>
          </Link>
        ))}
      </div>

      <section aria-labelledby="todo-heading" className="studio-panel">
        <div className="studio-panel-head">
          <h2 id="todo-heading" className="studio-h2">
            Needs you
          </h2>
          <span className="studio-status tone-muted">{todo.length === 0 ? 'ALL CLEAR' : `${todo.length} ITEM${todo.length === 1 ? '' : 'S'}`}</span>
        </div>
        {todo.length === 0 ? (
          <p className="px-5 py-4 text-muted">Nothing needs you right now. New payments appear here as soon as a learner sends one.</p>
        ) : (
          todo.map((item) => (
            <Link key={item.key} href={item.href} className="studio-row">
              <span className={`studio-icon ${TONE[item.tone]}`} aria-hidden="true">
                {item.glyph}
              </span>
              <span className="grid gap-0.5">
                <span className="font-semibold">{item.title}</span>
                <span className="studio-sub">{item.sub}</span>
              </span>
              <span className="tone-muted" aria-hidden="true">
                ›
              </span>
            </Link>
          ))
        )}
      </section>

      {waiting.length > 0 ? (
        <section aria-labelledby="latest-heading" className="studio-panel overflow-x-auto">
          <div className="studio-panel-head">
            <h2 id="latest-heading" className="studio-h2">
              Oldest waiting payments
            </h2>
            <span className="flex-1" />
            <Link href={`${base}/payments`} className="text-sm">
              Open the review queue ›
            </Link>
          </div>
          <table className="studio-table">
            <thead>
              <tr>
                <th>Learner</th>
                <th>Offering · plan</th>
                <th>Amount</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {waiting.slice(0, 5).map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link href={`${base}/payments/${item.id}`}>{item.learnerName ?? item.learnerEmail ?? 'Learner'}</Link>
                  </td>
                  <td>
                    {item.courseTitle} · {item.planLabel}
                  </td>
                  <td className="font-display">{formatNpr(item.amountMinor)}</td>
                  <td className="text-hud tone-warning">{item.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </>
  );
}
