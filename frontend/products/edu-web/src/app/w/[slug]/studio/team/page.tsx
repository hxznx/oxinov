import type { Metadata } from 'next';
import Link from 'next/link';
import { initials } from '@/lib/account.ts';
import { eduApi } from '@/lib/edu-api.ts';
import { formatDate } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { PERMISSIONS, ROLES, ROLE_NAMES, describeAudit } from '@/lib/team.ts';
import { MemberControls } from './MemberControls';

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: 'Team and roles' };

const ROLE_TONE = { OWNER: '--ox-color-product-hr', ADMIN: '--ox-color-brand-mid', INSTRUCTOR: '--ox-color-highlight', LEARNER: '--ox-color-text-muted' } as const;

/**
 * Team and roles (FR-AUTH-102; design screen 22): change a member's role, suspend or restore access, see what
 * each role can do, and read the audit log. Owners change administrators and owners; administrators change
 * learners and teachers; nobody changes themselves, and a workspace always keeps an active owner.
 */
export default async function TeamPage({ params }: Props) {
  const { slug } = await params;
  const here = `/w/${slug}/studio/team`;
  const { token, workspace } = await workspaceContext(slug, here);
  const [members, me, audit] = await Promise.all([
    load(here, () => eduApi.members(token, workspace.id)),
    load(here, () => eduApi.me(token)),
    load(here, () => eduApi.auditEvents(token, workspace.id)),
  ]);
  const team = members.filter((member) => member.role !== 'LEARNER');
  const learners = members.length - team.length;

  return (
    <>
      <div className="grid gap-1">
        <span className="studio-kicker">// System</span>
        <h1 className="studio-title">Team and roles</h1>
        <p className="text-sm text-muted">
          Invite teachers and administrators with a join code in <Link href={`/w/${slug}/studio/people`}>Learners and join codes</Link>, then set their role here.
        </p>
      </div>

      <section aria-labelledby="team-heading" className="studio-panel overflow-x-auto">
        <div className="studio-panel-head">
          <h2 id="team-heading" className="studio-h2">
            Members
          </h2>
          <span className="studio-status tone-muted">
            {team.length} team · {learners} learners
          </span>
        </div>
        <table className="studio-table min-w-[44rem]">
          <thead>
            <tr>
              <th>Member</th>
              <th>Role and access</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const name = member.displayName ?? member.email ?? 'Member';
              const self = member.email !== null && member.email === me.email;
              return (
                <tr key={member.userId}>
                  <td>
                    <span className="flex items-center gap-3">
                      <span className="studio-id-mark h-9 w-9 text-xs" aria-hidden="true" style={{ background: `var(${ROLE_TONE[member.role]})` }}>
                        {initials(member.displayName, member.email)}
                      </span>
                      <span className="grid">
                        <span className="font-semibold">{name}</span>
                        <span className="studio-sub break-all">{member.email}</span>
                        {member.status !== 'ACTIVE' ? <span className="studio-status tone-danger">Suspended</span> : null}
                      </span>
                    </span>
                  </td>
                  <td>
                    <MemberControls ids={{ slug, tenantId: workspace.id, userId: member.userId }} name={name} role={member.role} status={member.status} locked={self} />
                  </td>
                  <td className="whitespace-nowrap">{formatDate(member.joinedAt, workspace.timeZone)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="perm-heading" className="studio-panel overflow-x-auto">
        <div className="studio-panel-head">
          <h2 id="perm-heading" className="studio-h2">
            What each role can do
          </h2>
          <span className="studio-status tone-muted">● yes · ◐ own items · · no</span>
        </div>
        <table className="studio-table min-w-[36rem]">
          <thead>
            <tr>
              <th>Permission</th>
              {ROLES.map((value) => (
                <th key={value} className="text-center" style={{ color: `var(${ROLE_TONE[value]})` }}>
                  {ROLE_NAMES[value]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                {ROLES.map((value) => (
                  <td key={value} className="text-hud text-center" style={{ color: row.cells[value] === '·' ? 'var(--ox-color-border)' : row.cells[value] === '●' ? 'var(--ox-color-success)' : 'var(--ox-color-warning)' }}>
                    <span aria-label={row.cells[value] === '●' ? 'yes' : row.cells[value] === '◐' ? 'own items only' : 'no'}>{row.cells[value]}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="audit-heading" className="studio-panel">
        <div className="studio-panel-head">
          <h2 id="audit-heading" className="studio-h2">
            Audit log
          </h2>
          <span className="studio-status tone-muted">Newest 100</span>
        </div>
        {audit.length === 0 ? (
          <p className="px-5 py-4 text-muted">Nothing recorded yet.</p>
        ) : (
          <ol>
            {audit.map((event) => (
              <li key={event.id} className="grid gap-1 border-b border-line px-5 py-2.5 text-sm last:border-b-0 sm:grid-cols-[9rem_12rem_minmax(0,1fr)]">
                <time dateTime={event.createdAt} className="text-hud text-xs text-muted">
                  {new Date(event.createdAt).toLocaleString('en', { timeZone: workspace.timeZone, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                </time>
                <span className="truncate">{event.actor ?? 'Oxinov (automatic)'}</span>
                <span className="text-muted">{describeAudit(event)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
