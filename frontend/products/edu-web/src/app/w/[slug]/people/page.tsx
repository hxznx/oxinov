import type { Metadata } from 'next';
import Link from 'next/link';
import { revokeInvite } from '@/app/invite-actions';
import { EduHeader } from '@/components/EduHeader';
import { eduApi, type Invite, type TenantRole } from '@/lib/edu-api.ts';
import { displayCode, formatDate } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { CreateInviteForm } from './CreateInviteForm';

export const metadata: Metadata = { title: 'People' };

const ROLE_LABEL: Record<TenantRole, string> = { LEARNER: 'Student', INSTRUCTOR: 'Teacher', ADMIN: 'Administrator', OWNER: 'Owner' };
const STATUS_LABEL: Record<Invite['status'], string> = { ACTIVE: 'Active', EXPIRED: 'Expired', USED_UP: 'Limit reached', REVOKED: 'Turned off' };

type Props = { params: Promise<{ slug: string }> };

/** People and join codes for a learning space (FR-AUTH-102). The API allows administrators only. */
export default async function PeoplePage({ params }: Props) {
  const { slug } = await params;
  const here = `/w/${slug}/people`;
  const { token, workspace } = await workspaceContext(slug, here);
  const isAdmin = workspace.role === 'ADMIN' || workspace.role === 'OWNER';

  if (!isAdmin) {
    return (
      <>
        <EduHeader signedIn workspace={workspace} />
        <main id="main" className="mx-auto max-w-3xl px-4 py-12">
          <h1 className="text-4xl">People</h1>
          <p className="notice mt-6">Only administrators of {workspace.name} can manage people and join codes.</p>
          <p className="mt-6">
            <Link href={`/w/${slug}`}>Back to courses</Link>
          </p>
        </main>
      </>
    );
  }

  const [invites, members] = await Promise.all([load(here, () => eduApi.invites(token, workspace.id)), load(here, () => eduApi.members(token, workspace.id))]);
  const appUrl = process.env.APP_URL?.replace(/\/$/, '') ?? 'https://edu.oxinov.com';
  const date = (value: string) => formatDate(value, workspace.timeZone);

  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <main id="main" className="mx-auto grid max-w-6xl gap-10 px-4 py-10">
        <div>
          <p className="hud-label">
            <Link href={`/w/${slug}`}>// {workspace.name}</Link>
          </p>
          <h1 className="mt-2 text-4xl">People</h1>
          <p className="mt-2 text-muted">Invite students and teachers with a join code, like a class code.</p>
        </div>

        <section aria-labelledby="invite-heading" className="card grid gap-4">
          <h2 id="invite-heading" className="text-2xl">
            New join code
          </h2>
          <CreateInviteForm slug={slug} tenantId={workspace.id} appUrl={appUrl} canInviteAdmins={workspace.role === 'OWNER'} />
        </section>

        <section aria-labelledby="codes-heading">
          <h2 id="codes-heading" className="text-2xl">
            Join codes
          </h2>
          {invites.length === 0 ? (
            <p className="card mt-4 text-muted">No join codes yet.</p>
          ) : (
            <div className="card mt-4 overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left">
                <thead>
                  <tr className="hud-label">
                    <th className="py-2 font-normal">Code</th>
                    <th className="py-2 font-normal">For</th>
                    <th className="py-2 font-normal">Joined</th>
                    <th className="py-2 font-normal">Expires</th>
                    <th className="py-2 font-normal">Status</th>
                    <th className="py-2 font-normal">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((invite) => (
                    <tr key={invite.id} className="border-t border-line">
                      <td className="py-2 font-display tracking-widest">{displayCode(invite.code)}</td>
                      <td className="py-2">{ROLE_LABEL[invite.role]}s</td>
                      <td className="py-2">
                        {invite.useCount}
                        {invite.maxUses ? ` / ${invite.maxUses}` : ''}
                      </td>
                      <td className="py-2">{date(invite.expiresAt)}</td>
                      <td className={`py-2 ${invite.status === 'ACTIVE' ? 'text-success' : 'text-muted'}`}>{STATUS_LABEL[invite.status]}</td>
                      <td className="py-2 text-right">
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
          <h2 id="members-heading" className="text-2xl">
            Members <span className="text-muted">({members.length})</span>
          </h2>
          <div className="card mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left">
              <thead>
                <tr className="hud-label">
                  <th className="py-2 font-normal">Name</th>
                  <th className="py-2 font-normal">Email</th>
                  <th className="py-2 font-normal">Role</th>
                  <th className="py-2 font-normal">Joined</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.userId} className="border-t border-line">
                    <td className="py-2">{member.displayName ?? '—'}</td>
                    <td className="py-2 break-all">{member.email ?? '—'}</td>
                    <td className="py-2">
                      {ROLE_LABEL[member.role]}
                      {member.status !== 'ACTIVE' ? <span className="text-muted"> · suspended</span> : null}
                    </td>
                    <td className="py-2">{date(member.joinedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
