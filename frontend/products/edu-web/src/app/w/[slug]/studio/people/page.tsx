import type { Metadata } from 'next';
import { revokeInvite } from '@/app/invite-actions';
import { eduApi, type Invite, type TenantRole } from '@/lib/edu-api.ts';
import { displayCode, formatDate } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { CreateInviteForm } from './CreateInviteForm';

export const metadata: Metadata = { title: 'Learners and join codes' };

const ROLE_LABEL: Record<TenantRole, string> = { LEARNER: 'Student', INSTRUCTOR: 'Teacher', ADMIN: 'Administrator', OWNER: 'Owner' };
const STATUS_LABEL: Record<Invite['status'], string> = { ACTIVE: 'Active', EXPIRED: 'Expired', USED_UP: 'Limit reached', REVOKED: 'Turned off' };

type Props = { params: Promise<{ slug: string }> };

/** Learners, teachers and join codes (FR-AUTH-102). Studio pages are for administrators and the owner. */
export default async function PeoplePage({ params }: Props) {
  const { slug } = await params;
  const here = `/w/${slug}/studio/people`;
  const { token, workspace } = await workspaceContext(slug, here);
  const [invites, members] = await Promise.all([load(here, () => eduApi.invites(token, workspace.id)), load(here, () => eduApi.members(token, workspace.id))]);
  const appUrl = process.env.APP_URL?.replace(/\/$/, '') ?? 'https://edu.oxinov.com';
  const date = (value: string) => formatDate(value, workspace.timeZone);

  return (
    <div className="grid max-w-6xl gap-8">
      <div className="grid gap-1">
        <span className="studio-kicker">// Business</span>
        <h1 className="studio-title">Learners and join codes</h1>
        <p className="text-sm text-muted">Invite students and teachers with a join code, like a class code.</p>
      </div>

      <section aria-labelledby="invite-heading" className="studio-panel grid gap-4 p-5">
        <h2 id="invite-heading" className="studio-h2">
          New join code
        </h2>
        <CreateInviteForm slug={slug} tenantId={workspace.id} appUrl={appUrl} canInviteAdmins={workspace.role === 'OWNER'} />
      </section>

      <section aria-labelledby="codes-heading">
        <h2 id="codes-heading" className="studio-h2">
          Join codes
        </h2>
        {invites.length === 0 ? (
          <p className="studio-panel mt-3 px-5 py-4 text-muted">No join codes yet.</p>
        ) : (
          <div className="studio-panel mt-3 overflow-x-auto">
            <table className="studio-table min-w-[40rem]">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>For</th>
                  <th>Joined</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr key={invite.id}>
                    <td className="font-display tracking-widest">{displayCode(invite.code)}</td>
                    <td>{ROLE_LABEL[invite.role]}s</td>
                    <td>
                      {invite.useCount}
                      {invite.maxUses ? ` / ${invite.maxUses}` : ''}
                    </td>
                    <td>{date(invite.expiresAt)}</td>
                    <td className={`studio-status ${invite.status === 'ACTIVE' ? 'text-success' : 'text-muted'}`}>{STATUS_LABEL[invite.status]}</td>
                    <td className="text-right">
                      {invite.status === 'ACTIVE' ? (
                        <form action={revokeInvite}>
                          <input type="hidden" name="slug" value={slug} />
                          <input type="hidden" name="tenantId" value={workspace.id} />
                          <input type="hidden" name="inviteId" value={invite.id} />
                          <button type="submit" className="btn btn-secondary text-sm">
                            Turn off
                          </button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="members-heading">
        <h2 id="members-heading" className="studio-h2">
          Members <span className="text-muted">({members.length})</span>
        </h2>
        <div className="studio-panel mt-3 overflow-x-auto">
          <table className="studio-table min-w-[36rem]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.userId}>
                  <td>{member.displayName ?? '—'}</td>
                  <td className="break-all">{member.email ?? '—'}</td>
                  <td>
                    {ROLE_LABEL[member.role]}
                    {member.status !== 'ACTIVE' ? <span className="text-muted"> · suspended</span> : null}
                  </td>
                  <td>{date(member.joinedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
